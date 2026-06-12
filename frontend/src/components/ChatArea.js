import React, { useState, useRef, useEffect } from 'react';
import Message, { TypingIndicator } from './Message';
import UploadPanel from './UploadPanel';
import { askQuestion, clearMessages } from '../utils/api';

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const ClearIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>
  </svg>
);

const EmptyState = ({ hasFiles }) => (
  <div style={{
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    color: 'var(--text-muted)', padding: 32, textAlign: 'center'
  }}>
    <div style={{
      width: 64, height: 64, borderRadius: 20, marginBottom: 20,
      background: 'var(--accent-soft)', border: '1px solid rgba(108,99,255,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </div>
    <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
      {hasFiles ? 'Ready to answer questions' : 'Upload PDFs to get started'}
    </h3>
    <p style={{ fontSize: 13, lineHeight: 1.7, maxWidth: 300 }}>
      {hasFiles
        ? 'Ask anything about your documents. I remember our conversation.'
        : 'Upload one or more PDF files, then ask questions about their contents.'
      }
    </p>
    {hasFiles && (
      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 320 }}>
        {['What is this document about?', 'Summarize the key points', 'What are the main conclusions?'].map(q => (
          <div key={q} style={{
            padding: '8px 14px', borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            fontSize: 13, color: 'var(--text-secondary)', cursor: 'default',
            textAlign: 'left'
          }}>💬 {q}</div>
        ))}
      </div>
    )}
  </div>
);

export default function ChatArea({ session, onSessionUpdate }) {
  const [messages, setMessages] = useState(session?.messages || []);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(!session?.files?.length);
  const [files, setFiles] = useState(session?.files || []);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const bottomRef = useRef();
  const textareaRef = useRef();

  useEffect(() => {
    setMessages(session?.messages || []);
    setFiles(session?.files || []);
    setShowUpload(!session?.files?.length);
  }, [session?.sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    const q = input.trim();
    if (!q || loading || !files.length) return;

    const userMsg = { role: 'user', content: q, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const data = await askQuestion(session.sessionId, q);
      const aiMsg = {
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
      onSessionUpdate();
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ Error: ${err.response?.data?.error || err.message}`,
        sources: [],
        timestamp: new Date()
      }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // const handleClear = async () => {
  //   if (!window.confirm('Clear chat history?')) return;
  //   await clearMessages(session.sessionId);
  //   setMessages([]);
  //   onSessionUpdate();
  // };

  const handleClear = async () => {
  try {
    await clearMessages(session.sessionId);

    setMessages([]);
    setFiles([]);
    setShowUpload(true);

    setShowClearConfirm(false);

    onSessionUpdate();
  } catch (err) {
    console.error(err);
  }
};

  const handleUploadComplete = (result) => {
    const newFiles = result.files || [];
    setFiles(prev => [...prev, ...newFiles]);
    setShowUpload(false);
    onSessionUpdate();
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `✅ Processed **${newFiles.map(f => f.name).join(', ')}** — ${result.chunksCreated} knowledge chunks built. What would you like to know?`,
      sources: [],
      timestamp: new Date()
    }]);
  };

  const hasFiles = files.length > 0;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg-surface)', flexShrink: 0
      }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.3px' }}>
            {session?.title || 'New Chat'}
          </h2>
          {hasFiles && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              {files.length} document{files.length > 1 ? 's' : ''} loaded · GPT-4o Mini + FAISS RAG
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowUpload(s => !s)}
            style={{
              padding: '6px 12px', borderRadius: 'var(--radius-sm)',
              background: showUpload ? 'var(--accent-soft)' : 'var(--bg-elevated)',
              border: `1px solid ${showUpload ? 'rgba(108,99,255,0.4)' : 'var(--border)'}`,
              color: showUpload ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit'
            }}
          >
            {showUpload ? 'Hide Upload' : '+ Add PDFs'}
          </button>
          {messages.length > 0 && (
            // <button onClick={handleClear} 
            <button onClick={() => setShowClearConfirm(true)}
            style={{
              padding: '6px 10px', borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit'
            }}>
              <ClearIcon /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Upload panel */}
      {showUpload && (
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-surface)',
          flexShrink: 0
        }}>
          <UploadPanel
            sessionId={session?.sessionId}
            onUploadComplete={handleUploadComplete}
            existingFiles={files}
          />
        </div>
      )}




{showClearConfirm && (
  <div
    style={{
      position: 'absolute',
      top: 80,
      right: 24,
      width: 260,
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '16px',
      zIndex: 1000,
      boxShadow: '0 10px 30px rgba(0,0,0,0.35)'
    }}
  >
    <div
      style={{
        fontSize: 14,
        fontWeight: 600,
        marginBottom: 14
      }}
    >
      Clear chat history?
    </div>

    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 8
      }}
    >
      <button
        onClick={() => setShowClearConfirm(false)}
        style={{
          padding: '8px 12px',
          border: 'none',
          borderRadius: 8,
          background: '#4b5563',
          color: 'white',
          cursor: 'pointer'
        }}
        onMouseEnter={e => e.target.style.background = '#374151'}
        onMouseLeave={e => e.target.style.background = '#4b5563'}
      >
        Cancel
      </button>

      <button
        onClick={handleClear}
        style={{
          padding: '8px 12px',
          border: 'none',
          borderRadius: 8,
          background: '#dc2626',
          color: 'white',
          cursor: 'pointer'
        }}
        onMouseEnter={e => e.target.style.background = '#b91c1c'}
        onMouseLeave={e => e.target.style.background = '#dc2626'}
      >
        Clear
      </button>
    </div>
  </div>
)}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 8px' }}>
        {messages.length === 0
          ? <EmptyState hasFiles={hasFiles} />
          : messages.map((msg, i) => (
            <Message key={i} message={msg} isLast={i === messages.length - 1 && !loading} />
          ))
        }
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '16px 24px 20px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-surface)',
        flexShrink: 0
      }}>
        {!hasFiles && (
          <div style={{
            marginBottom: 10, padding: '8px 12px',
            background: 'rgba(245,158,11,0.1)', borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(245,158,11,0.2)',
            fontSize: 12, color: 'var(--warning)'
          }}>
            ⚠️ Upload and process PDFs before asking questions
          </div>
        )}
        <div style={{
          display: 'flex', gap: 10, alignItems: 'flex-end',
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '10px 12px',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
        onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
            }}
            onKeyDown={handleKeyDown}
            placeholder={hasFiles ? 'Ask anything about your documents... (Shift+Enter for newline)' : 'Upload PDFs first...'}
            disabled={!hasFiles || loading}
            rows={1}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit',
              resize: 'none', lineHeight: 1.5, minHeight: 24, maxHeight: 140,
              overflowY: 'auto', padding: 0
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading || !hasFiles}
            style={{
              width: 36, height: 36, borderRadius: 10, border: 'none', flexShrink: 0,
              background: input.trim() && hasFiles && !loading
                ? 'linear-gradient(135deg, var(--accent), #9c5fff)'
                : 'var(--bg-hover)',
              color: input.trim() && hasFiles && !loading ? 'white' : 'var(--text-muted)',
              cursor: input.trim() && hasFiles && !loading ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s'
            }}
          >
            {loading
              ? <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              : <SendIcon />
            }
          </button>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
          AI may make mistakes. Verify important information from the source documents.
        </div>
      </div>
    </div>
  );
}
