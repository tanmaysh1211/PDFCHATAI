import React, { useState } from 'react';
// import { deleteSession } from '../utils/api';
import { deleteSession, renameSession } from '../utils/api';

const FileIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const BotIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="11" width="18" height="10" rx="2"/>
    <circle cx="12" cy="7" r="3"/>
    <path d="M12 10v1"/><circle cx="8.5" cy="15" r="1" fill="currentColor" stroke="none"/>
    <circle cx="15.5" cy="15" r="1" fill="currentColor" stroke="none"/>
  </svg>
);

const EditIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M12 20h9"/>
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
  </svg>
);

export default function Sidebar({ sessions, currentSessionId, onSelectSession, onNewSession }) {
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const handleDelete = async (e, sessionId) => {
    e.stopPropagation();
    // if (!window.confirm('Delete this chat?')) return;
    setDeletingId(sessionId);
    try {
      await deleteSession(sessionId);
      if (sessionId === currentSessionId) onNewSession();
      else onSelectSession(sessions.find(s => s.sessionId !== sessionId)?.sessionId || null);
      window.location.reload(); // Simple refresh to update list
    } catch (err) {
      console.error(err);
    }
    setConfirmDeleteId(null);
    setDeletingId(null);
  };

  // const formatDate = (dateStr) => {
  //   const date = new Date(dateStr);
  //   const now = new Date();
  //   const diff = now - date;
  //   if (diff < 60000) return 'Just now';
  //   if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
  //   if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
  //   return date.toLocaleDateString();
  // };




  const formatDate = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();

  const seconds = Math.floor(diff / 1000);

  if (seconds < 60)
    return `${seconds} sec ago`;

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60)
    return `${minutes} min ${seconds % 60} sec ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24)
    return `${hours} hr ${minutes % 60} min ago`;

  const days = Math.floor(hours / 24);

  return `${days} day${days > 1 ? 's' : ''} ago`;
};


const handleRename = async (sessionId) => {
  try {
    await renameSession(sessionId, editTitle);

    setEditingId(null);

    window.location.reload();
  } catch (err) {
    console.error(err);
  }
};

  return (
    <aside style={{
      width: 260,
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      flexShrink: 0
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--accent), #9c5fff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white'
          }}>
            <BotIcon />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px' }}>DocChat</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>GPT-4o Mini · RAG</div>
          </div>
        </div>

        <button onClick={onNewSession} style={{
          width: '100%', padding: '9px 14px',
          background: 'var(--accent-soft)', border: '1px solid rgba(108,99,255,0.3)',
          borderRadius: 'var(--radius-sm)', color: 'var(--accent)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
          transition: 'all 0.15s'
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(108,99,255,0.2)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-soft)'}
        >
          <PlusIcon /> New Chat
        </button>
      </div>

      {/* Session List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
        {sessions.length === 0 && (
          <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No chats yet.<br/>Create a new one to start.
          </div>
        )}
        {sessions.map(session => (
          <div
            key={session.sessionId}
            onClick={() => onSelectSession(session.sessionId)}
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              marginBottom: 2,
              background: currentSessionId === session.sessionId ? 'var(--bg-hover)' : 'transparent',
              border: currentSessionId === session.sessionId ? '1px solid var(--border-light)' : '1px solid transparent',
              transition: 'all 0.15s',
              position: 'relative',
              group: true
            }}
            onMouseEnter={e => {
              if (currentSessionId !== session.sessionId)
                e.currentTarget.style.background = 'var(--bg-elevated)';
              e.currentTarget.querySelector('.del-btn').style.opacity = '1';
              e.currentTarget.querySelector('.edit-btn').style.opacity = '1';
            }}
            onMouseLeave={e => {
              if (currentSessionId !== session.sessionId)
                e.currentTarget.style.background = 'transparent';
              e.currentTarget.querySelector('.del-btn').style.opacity = '0';
              e.currentTarget.querySelector('.edit-btn').style.opacity = '0';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ color: 'var(--text-muted)', marginTop: 1, flexShrink: 0 }}><FileIcon /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 500,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  color: currentSessionId === session.sessionId ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}>
                  {session.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {session.messageCount ?? session.messages?.length ?? 0} msgs · {formatDate(session.updatedAt)}
                </div>
                {session.files?.length > 0 && (
                  <div style={{ fontSize: 10, color: 'var(--accent)', marginTop: 2, opacity: 0.8 }}>
                    {session.files.length} PDF{session.files.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>
              <button
                className="del-btn"
                // onClick={e => handleDelete(e, session.sessionId)}
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDeleteId(session.sessionId);
                }}
                disabled={deletingId === session.sessionId}
                style={{
                  opacity: 0, background: 'none', border: 'none',
                  color: 'var(--text-muted)', cursor: 'pointer',
                  padding: 4, borderRadius: 4, transition: 'all 0.15s',
                  flexShrink: 0
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.opacity = '1'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <TrashIcon />
              </button>

              <button
              className="edit-btn"
              onClick={(e) => {
                e.stopPropagation();
                setEditingId(session.sessionId);
                setEditTitle(session.title);
              }}
              style={{
                opacity: 0,
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 4,
                borderRadius: 4
              }}
            >
              <EditIcon />
            </button>
            </div>


            {confirmDeleteId === session.sessionId && (
  <div
    onClick={(e) => e.stopPropagation()}
    style={{
      marginTop: 10,
      padding: 12,
      borderRadius: 10,
      background: '#1b1d2a',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 8px 25px rgba(0,0,0,0.35)'
    }}
  >
    <div
      style={{
        fontSize: 13,
        fontWeight: 500,
        marginBottom: 10,
        color: '#fff'
      }}
    >
      Delete this chat?
    </div>

    <div
      style={{
        display: 'flex',
        gap: 8
      }}
    >
      <button
        onClick={(e) => handleDelete(e, session.sessionId)}
        style={{
          flex: 1,
          padding: '8px 12px',
          border: 'none',
          borderRadius: 8,
          background: '#dc2626',
          color: '#fff',
          cursor: 'pointer',
          fontWeight: 600,
          transition: '0.15s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#b91c1c';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#dc2626';
        }}
      >
        Delete
      </button>

      <button
        onClick={() => setConfirmDeleteId(null)}
        style={{
          flex: 1,
          padding: '8px 12px',
          border: 'none',
          borderRadius: 8,
          background: '#4b5563',
          color: '#fff',
          cursor: 'pointer',
          fontWeight: 600,
          transition: '0.15s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#374151';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#4b5563';
        }}
      >
        Cancel
      </button>
    </div>
  </div>
)}


{editingId === session.sessionId && (
  <div
    onClick={(e) => e.stopPropagation()}
    style={{
      marginTop: 10,
      padding: 12,
      borderRadius: 12,
      background: '#1b1d2a',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 8px 25px rgba(0,0,0,0.35)'
    }}
  >
    <div
      style={{
        fontSize: 13,
        fontWeight: 600,
        marginBottom: 10,
        color: '#fff'
      }}
    >
      Rename Chat
    </div>

    <input
      value={editTitle}
      onChange={(e) => setEditTitle(e.target.value)}
      style={{
        width: '100%',
        padding: '10px',
        borderRadius: 8,
        border: '1px solid #333',
        background: '#111827',
        color: '#fff',
        outline: 'none',
        marginBottom: 10
      }}
    />

    <div
      style={{
        display: 'flex',
        gap: 8
      }}
    >
      <button
        onClick={() => handleRename(session.sessionId)}
        style={{
          flex: 1,
          padding: '8px 12px',
          border: 'none',
          borderRadius: 8,
          background: '#16a34a',
          color: '#fff',
          fontWeight: 600,
          cursor: 'pointer'
        }}
        onMouseEnter={(e) =>
          e.currentTarget.style.background = '#15803d'
        }
        onMouseLeave={(e) =>
          e.currentTarget.style.background = '#16a34a'
        }
      >
        Save
      </button>

      <button
        onClick={() => {
          setEditingId(null);
          setEditTitle('');
        }}
        style={{
          flex: 1,
          padding: '8px 12px',
          border: 'none',
          borderRadius: 8,
          background: '#4b5563',
          color: '#fff',
          fontWeight: 600,
          cursor: 'pointer'
        }}
        onMouseEnter={(e) =>
          e.currentTarget.style.background = '#374151'
        }
        onMouseLeave={(e) =>
          e.currentTarget.style.background = '#4b5563'
        }
      >
        Cancel
      </button>
    </div>
  </div>
)}


          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 16px', borderTop: '1px solid var(--border)',
        fontSize: 11, color: 'var(--text-muted)', textAlign: 'center'
      }}>
        Powered by LangChain + GPT-4o Mini
      </div>
    </aside>
  );
}
