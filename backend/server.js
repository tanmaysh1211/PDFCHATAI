const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const morgan = require('morgan');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatpdf';

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(morgan('dev'));

// ─── File Upload Config ────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  }
});

// ─── MongoDB Models ────────────────────────────────────────────────────────────
const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  sources: [{ file: String, page: Number, paragraph: Number, excerpt: String, total_pages: Number }],
  timestamp: { type: Date, default: Date.now }
});

const SessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  title: { type: String, default: 'New Chat' },
  files: [{ name: String, size: Number, uploadedAt: Date }],
  messages: [MessageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Session = mongoose.model('Session', SessionSchema);

// Connect to MongoDB (optional - works without it too)
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.warn('⚠️  MongoDB not connected, chat history will be in-memory:', err.message));

// In-memory fallback store
const inMemorySessions = new Map();

// ─── Helper: Get or create session ────────────────────────────────────────────
async function getSession(sessionId) {
  try {
    if (mongoose.connection.readyState === 1) {
      return await Session.findOne({ sessionId });
    }
  } catch {}
  return inMemorySessions.get(sessionId) || null;
}

async function saveSession(sessionData) {
  try {
    if (mongoose.connection.readyState === 1) {
      return await Session.findOneAndUpdate(
        { sessionId: sessionData.sessionId },
        { ...sessionData, updatedAt: new Date() },
        { upsert: true, new: true }
      );
    }
  } catch {}
  inMemorySessions.set(sessionData.sessionId, sessionData);
  return sessionData;
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'backend', port: PORT });
});

// Create new session
app.post('/api/sessions', async (req, res) => {
  try {
    const sessionId = uuidv4();
    const session = await saveSession({
      sessionId,
      title: 'New Chat',
      files: [],
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    res.json({ sessionId: session.sessionId, title: session.title });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all sessions
app.get('/api/sessions', async (req, res) => {
  try {
    let sessions;
    if (mongoose.connection.readyState === 1) {
      sessions = await Session.find({}, 'sessionId title files createdAt updatedAt messages')
        .sort({ updatedAt: -1 }).limit(50);
    } else {
      sessions = Array.from(inMemorySessions.values())
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }
    res.json(sessions.map(s => ({
      sessionId: s.sessionId,
      title: s.title,
      files: s.files,
      messageCount: s.messages?.length || 0,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get session with messages
app.get('/api/sessions/:sessionId', async (req, res) => {
  try {
    const session = await getSession(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete session
app.delete('/api/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (mongoose.connection.readyState === 1) {
      await Session.deleteOne({ sessionId });
    } else {
      inMemorySessions.delete(sessionId);
    }
    // Notify AI service
    await axios.delete(`${AI_SERVICE_URL}/session/${sessionId}`).catch(() => {});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload and process PDFs
app.post('/api/sessions/:sessionId/upload', upload.array('files', 10), async (req, res) => {
  const { sessionId } = req.params;
  const uploadedFiles = req.files;

  if (!uploadedFiles || uploadedFiles.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  try {
    // Forward files to AI service
    const formData = new FormData();
    uploadedFiles.forEach(file => {
      formData.append('files', fs.createReadStream(file.path), {
        filename: file.originalname,
        contentType: 'application/pdf'
      });
    });

    const aiResponse = await axios.post(
      `${AI_SERVICE_URL}/process-pdfs?session_id=${sessionId}`,
      formData,
      { headers: formData.getHeaders(), timeout: 120000 }
    );

    // Update session with file info
    const session = await getSession(sessionId) || {
      sessionId, title: 'New Chat', files: [], messages: [], createdAt: new Date()
    };

    const newFiles = uploadedFiles.map(f => ({
      name: f.originalname,
      size: f.size,
      uploadedAt: new Date()
    }));

    session.files = [...(session.files || []), ...newFiles];

    // Auto-set title from first file
    if (session.title === 'New Chat' && newFiles.length > 0) {
      session.title = newFiles[0].name.replace('.pdf', '').substring(0, 40);
    }

    await saveSession({ ...session, updatedAt: new Date() });

    // Cleanup temp files
    uploadedFiles.forEach(f => fs.unlink(f.path, () => {}));

    res.json({
      success: true,
      sessionId,
      files: newFiles,
      chunksCreated: aiResponse.data.chunks_created
    });
  } catch (err) {
    // Cleanup
    if (uploadedFiles) uploadedFiles.forEach(f => fs.unlink(f.path, () => {}));
    console.error('Upload error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.detail || err.message });
  }
});

// Ask a question
app.post('/api/sessions/:sessionId/ask', async (req, res) => {
  const { sessionId } = req.params;
  const { question } = req.body;

  if (!question?.trim()) {
    return res.status(400).json({ error: 'Question is required' });
  }

  try {
    const session = await getSession(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Build chat history for conversation memory
    const chatHistory = (session.messages || []).slice(-20).map(m => ({
      role: m.role,
      content: m.content
    }));

    // Ask AI service
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/ask`, {
      session_id: sessionId,
      question: question.trim(),
      chat_history: chatHistory
    }, { timeout: 60000 });

    const { answer, sources } = aiResponse.data;

    // Save messages to session
    const userMessage = { role: 'user', content: question, timestamp: new Date(), sources: [] };
    const assistantMessage = { role: 'assistant', content: answer, sources, timestamp: new Date() };

    session.messages = [...(session.messages || []), userMessage, assistantMessage];
    await saveSession({ ...session, updatedAt: new Date() });

    res.json({ answer, sources, sessionId });
  } catch (err) {
    console.error('Ask error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.detail || err.message });
  }
});

// Clear chat history for session
app.delete('/api/sessions/:sessionId/messages', async (req, res) => {
  try {
    const session = await getSession(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    session.messages = [];
    await saveSession({ ...session, updatedAt: new Date() });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/sessions/:sessionId/title', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { title } = req.body;

    const session = await getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.title = title.trim();

    await saveSession({
      ...session,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      title: session.title
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
  console.log(`   AI Service: ${AI_SERVICE_URL}`);
  console.log(`   MongoDB: ${MONGODB_URI}`);
});
