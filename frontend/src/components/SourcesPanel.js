import React, { useState } from 'react';

const ChevronIcon = ({ open }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const BookIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

export default function SourcesPanel({ sources }) {
  const [open, setOpen] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState(null);

  if (!sources || sources.length === 0) return null;

  return (
    <div style={{
      marginTop: 8,
      background: 'var(--bg-base)',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--border)',
      overflow: 'hidden',
      fontSize: 12
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '7px 12px',
          background: 'none', border: 'none',
          color: 'var(--text-muted)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: 'inherit', fontSize: 12
        }}
      >
        <BookIcon />
        <span>{sources.length} Source{sources.length > 1 ? 's' : ''}</span>
        <div style={{ marginLeft: 'auto' }}><ChevronIcon open={open} /></div>
      </button>

      {open && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          {sources.map((src, idx) => (
            <div key={idx} style={{ borderBottom: idx < sources.length-1 ? '1px solid var(--border)' : 'none' }}>
              <button
                onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                style={{
                  width: '100%', padding: '8px 12px',
                  background: 'none', border: 'none',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontFamily: 'inherit', fontSize: 12, textAlign: 'left'
                }}
              >
                <div style={{
                  background: 'var(--accent-soft)', color: 'var(--accent)',
                  borderRadius: 4, padding: '1px 7px', fontSize: 11, fontWeight: 600,
                  whiteSpace: 'nowrap', flexShrink: 0
                }}>
                  P.{src.page}
                </div>
                <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {src.file}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>¶{src.paragraph}</div>
                <ChevronIcon open={expandedIdx === idx} />
              </button>

              {expandedIdx === idx && (
                <div style={{
                  padding: '0 12px 10px 12px',
                  animation: 'fadeIn 0.2s ease'
                }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                    {src.file} · Page {src.page} of {src.total_pages} · Paragraph {src.paragraph}
                  </div>
                  <div style={{
                    padding: '8px 10px',
                    background: 'var(--bg-elevated)',
                    borderRadius: 6,
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    borderLeft: '3px solid var(--accent)',
                    fontStyle: 'italic'
                  }}>
                    "{src.excerpt}"
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
