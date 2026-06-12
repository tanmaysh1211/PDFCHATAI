import React, { useState, useEffect, useCallback } from 'react';
import './index.css';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import { createSession, getSessions, getSession } from './utils/api';

export default function App() {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(true);

  

  const loadSessions = useCallback(async () => {
    try {
      const data = await getSessions();
      setSessions(data);
      return data;
    } catch (err) {
      console.error('Failed to load sessions:', err);
      return [];
    }
  }, []);

  const handleNewSession = async () => {
    try {
      const { sessionId } = await createSession();
      const session = { sessionId, title: 'New Chat', files: [], messages: [], createdAt: new Date(), updatedAt: new Date() };
      setCurrentSession(session);
      await loadSessions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectSession = async (sessionId) => {
    try {
      const session = await getSession(sessionId);
      setCurrentSession(session);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSessionUpdate = async () => {
    if (!currentSession) return;
    try {
      const updated = await getSession(currentSession.sessionId);
      setCurrentSession(updated);
      await loadSessions();
    } catch {}
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await loadSessions();
      if (data.length > 0) {
        await handleSelectSession(data[0].sessionId);
      } else {
        await handleNewSession();
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

  return (
    <>
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSession?.sessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
      />
      {currentSession && (
        <ChatArea
          session={currentSession}
          onSessionUpdate={handleSessionUpdate}
        />
      )}
    </>
  );
}
