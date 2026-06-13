// import React, { useState, useEffect, useCallback } from 'react';
// import './index.css';
// import Sidebar from './components/Sidebar';
// import ChatArea from './components/ChatArea';
// import { createSession, getSessions, getSession } from './utils/api';

// export default function App() {
//   const [sessions, setSessions] = useState([]);
//   const [currentSession, setCurrentSession] = useState(null);
//   const [loading, setLoading] = useState(true);

  

//   const loadSessions = useCallback(async () => {
//     try {
//       const data = await getSessions();
//       setSessions(data);
//       return data;
//     } catch (err) {
//       console.error('Failed to load sessions:', err);
//       return [];
//     }
//   }, []);

//   const handleNewSession = async () => {
//     try {
//       const { sessionId } = await createSession();
//       const session = { sessionId, title: 'New Chat', files: [], messages: [], createdAt: new Date(), updatedAt: new Date() };
//       setCurrentSession(session);
//       await loadSessions();
//     } catch (err) {
//       console.error(err);
//     }
//   };

  
//  const handleSelectSession = async (sessionId) => {
//   console.log("SELECTING:", sessionId);
//   if (!sessionId) {
//     console.log("BLOCKED NULL SESSION");
//     return;
//   }
//   try {
//     const session = await getSession(sessionId);
//     console.log("LOADED:", session);
//     setCurrentSession(session);
//   } catch (err) {
//     console.error(err);
//   }
// };


// const handleSessionUpdate = async (sessionId) => {
//   try {
//     const id = sessionId || currentSession?.sessionId;
//     if (!id) {
//       console.log("NO SESSION ID");
//       return;
//     }
//     console.log("UPDATING SESSION:", id);
//     const updated = await getSession(id);
//     console.log("UPDATED SESSION:", updated);
//     setCurrentSession(updated);
//     await loadSessions();
//   } catch (err) {
//     console.error(err);
//   }
// };

//   useEffect(() => {
//     (async () => {
//       setLoading(true);
//       const data = await loadSessions();
//       if (data.length > 0) {
//         await handleSelectSession(data[0].sessionId);
//       } else {
//         await handleNewSession();
//       }
//       setLoading(false);
//     })();
//   }, []);


//   useEffect(() => {
//   console.log(
//     "CURRENT SESSION:",
//     currentSession
//   );
// }, [currentSession]);

// useEffect(() => {
//   console.log(
//     "SESSIONS:",
//     sessions
//   );
// }, [sessions]);
 
//   if (loading) {
//     return (
//       <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
//         <div style={{ textAlign: 'center' }}>
//           <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
//           <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading DocChat...</div>
//         </div>
//       </div>
//     );
//   }


//   return (
//     <>
//       <Sidebar
//         sessions={sessions}
//         currentSessionId={currentSession?.sessionId}
//         onSelectSession={handleSelectSession}
//         onNewSession={handleNewSession}
//         onSessionUpdate={handleSessionUpdate}
//       />
//       {currentSession && (
//         <ChatArea
//           session={currentSession}
//           onSessionUpdate={handleSessionUpdate}
//         />
//       )}
//     </>
//   );
// }







import React, { useState, useEffect, useCallback } from 'react';
import './index.css';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import { createSession, getSessions, getSession } from './utils/api';

// ✅ Safe normalize - handles both Mongoose docs and plain objects
function normalizeSession(raw) {
  if (!raw) return null;
  try {
    // Convert to plain object if it's a Mongoose doc
    const s = raw.toObject ? raw.toObject() : raw;
    return {
      sessionId: s.sessionId || '',
      title: s.title || 'New Chat',
      files: Array.isArray(s.files) ? s.files.map(f => ({
        name: f.name || '',
        size: f.size || 0,
        uploadedAt: f.uploadedAt || null
      })) : [],
      messages: Array.isArray(s.messages) ? s.messages.map(m => ({
        role: m.role || 'user',
        content: m.content || '',
        sources: Array.isArray(m.sources) ? m.sources : [],
        timestamp: m.timestamp || new Date()
      })) : [],
      createdAt: s.createdAt || new Date(),
      updatedAt: s.updatedAt || new Date()
    };
  } catch (e) {
    console.error('normalizeSession error:', e);
    return null;
  }
}

export default function App() {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSessions = useCallback(async () => {
    try {
      const data = await getSessions();
      setSessions(Array.isArray(data) ? data : []);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Failed to load sessions:', err);
      return [];
    }
  }, []);

  const handleSelectSession = useCallback(async (sessionId) => {
    if (!sessionId) return;
    try {
      const raw = await getSession(sessionId);
      const session = normalizeSession(raw);
      if (session) {
        setCurrentSession(session);
      }
    } catch (err) {
      console.error('Select session error:', err);
    }
  }, []);

  const handleNewSession = useCallback(async () => {
    try {
      const { sessionId } = await createSession();
      const session = normalizeSession({
        sessionId,
        title: 'New Chat',
        files: [],
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      setCurrentSession(session);
      await loadSessions();
    } catch (err) {
      console.error('New session error:', err);
    }
  }, [loadSessions]);

  const handleSessionUpdate = useCallback(async (sessionId) => {
    try {
      const id = sessionId || currentSession?.sessionId;
      if (!id) return;
      const raw = await getSession(id);
      const session = normalizeSession(raw);
      if (session) setCurrentSession(session);
      await loadSessions();
    } catch (err) {
      console.error('Session update error:', err);
    }
  }, [currentSession?.sessionId, loadSessions]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await loadSessions();
        if (data.length > 0) {
          await handleSelectSession(data[0].sessionId);
        } else {
          await handleNewSession();
        }
      } catch (err) {
        setError('Failed to load. Make sure backend is running on port 5000.');
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading DocChat...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div style={{ textAlign: 'center', color: 'var(--danger)', fontSize: 14, padding: 32 }}>
          ⚠️ {error}
          <br /><br />
          <button onClick={() => window.location.reload()} style={{
            padding: '8px 16px', background: 'var(--accent)', color: 'white',
            border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13
          }}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSession?.sessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onSessionUpdate={handleSessionUpdate}
      />
      {currentSession?.sessionId ? (
        <ChatArea
          key={currentSession.sessionId}
          session={currentSession}
          onSessionUpdate={handleSessionUpdate}
        />
      ) : (
        // ✅ Fallback — shouldn't happen but prevents black screen
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg-base)', color: 'var(--text-muted)', fontSize: 14
        }}>
          Select a chat or create a new one
        </div>
      )}
    </>
  );
}