import React from 'react';
import SourcesPanel from './SourcesPanel';

const UserIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const BotIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="10" rx="2"/>
    <circle cx="12" cy="7" r="3"/>
    <path d="M12 10v1"/>
    <circle cx="8.5" cy="15" r="1" fill="currentColor" stroke="none"/>
    <circle cx="15.5" cy="15" r="1" fill="currentColor" stroke="none"/>
  </svg>
);

// Simple markdown-like renderer for bold/code
function RenderText({ text }) {
  if (!text) return null;
  
  // Split by code blocks first
  const parts = text.split(/(```[\s\S]*?```|`[^`]+`|\*\*[^*]+\*\*)/g);
  
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const code = part.slice(3, -3).trim();
          return (
            <pre key={i} style={{
              background: 'var(--bg-base)', borderRadius: 6,
              padding: '10px 12px', margin: '8px 0',
              fontSize: 12, fontFamily: 'JetBrains Mono, monospace',
              overflowX: 'auto', color: 'var(--text-primary)',
              border: '1px solid var(--border)'
            }}>{code}</pre>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={i} style={{
            fontFamily: 'JetBrains Mono, monospace',
            background: 'rgba(108,99,255,0.15)', padding: '1px 5px',
            borderRadius: 4, fontSize: '0.9em', color: 'var(--accent)'
          }}>{part.slice(1, -1)}</code>;
        }
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        // Handle bullet points and line breaks
        return part.split('\n').map((line, j) => {
          const isLast = j === part.split('\n').length - 1;
          if (line.startsWith('* ') || line.startsWith('- ') || line.match(/^\d+\. /)) {
            return (
              <div key={`${i}-${j}`} style={{ paddingLeft: 16, marginTop: 2 }}>
                {line}
              </div>
            );
          }
          return (
            <span key={`${i}-${j}`}>
              {line}
              {!isLast && <br />}
            </span>
          );
        });
      })}
    </span>
  );
}

export default function Message({ message, isLast }) {
  const isUser = message.role === 'user';

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fade-in" style={{
      display: 'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      gap: 10,
      marginBottom: isLast ? 4 : 16,
      alignItems: 'flex-start',
    }}>
      {/* Avatar */}
      <div style={{
        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
        background: isUser
          ? 'linear-gradient(135deg, var(--accent), #9c5fff)'
          : 'var(--bg-elevated)',
        border: isUser ? 'none' : '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: isUser ? 'white' : 'var(--text-muted)'
      }}>
        {isUser ? <UserIcon /> : <BotIcon />}
      </div>

      {/* Content */}
      <div style={{ maxWidth: '78%', minWidth: 80 }}>
        <div style={{
          padding: '10px 14px',
          background: isUser ? 'var(--user-bubble)' : 'var(--ai-bubble)',
          borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
          border: isUser ? 'none' : '1px solid var(--border)',
          fontSize: 14,
          lineHeight: 1.65,
          color: isUser ? 'white' : 'var(--text-primary)',
          wordBreak: 'break-word',
          boxShadow: isUser ? '0 2px 12px rgba(108,99,255,0.25)' : 'none'
        }}>
          <RenderText text={message.content} />
        </div>

        {/* Sources */}
        {!isUser && message.sources?.length > 0 && (
          <SourcesPanel sources={message.sources} />
        )}

        <div style={{
          fontSize: 10, color: 'var(--text-muted)',
          marginTop: 4, textAlign: isUser ? 'right' : 'left', paddingX: 4
        }}>
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="fade-in" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 16 }}>
      <div style={{
        width: 30, height: 30, borderRadius: '50%',
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-muted)'
      }}>
        <BotIcon />
      </div>
      <div style={{
        padding: '12px 16px',
        background: 'var(--ai-bubble)',
        borderRadius: '4px 16px 16px 16px',
        border: '1px solid var(--border)',
        display: 'flex', gap: 5, alignItems: 'center'
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--text-muted)',
            animation: 'pulse 1.2s ease infinite',
            animationDelay: `${i * 0.2}s`
          }} />
        ))}
      </div>
    </div>
  );
}
