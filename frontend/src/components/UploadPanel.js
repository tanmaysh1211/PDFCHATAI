import React, { useState, useRef } from 'react';
import { uploadPDFs } from '../utils/api';

const UploadIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const FileIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);

const XIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/1048576).toFixed(1)} MB`;
};

export default function UploadPanel({ sessionId, onUploadComplete, existingFiles = [] }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef();

  const addFiles = (newFiles) => {
    const pdfs = Array.from(newFiles).filter(f => f.type === 'application/pdf');
    if (pdfs.length !== newFiles.length) setError('Only PDF files are accepted');
    else setError('');
    setFiles(prev => {
      const names = new Set(prev.map(f => f.name));
      return [...prev, ...pdfs.filter(f => !names.has(f.name))];
    });
  };

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    setProgress(0);
    setError('');
    try {
      const result = await uploadPDFs(sessionId, files, setProgress);
      setFiles([]);
      onUploadComplete(result);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Upload failed');
    }
    setUploading(false);
  };

  return (
    <div style={{ padding: '0 0 16px' }}>
      {/* Existing files */}
      {existingFiles.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Loaded Documents
          </div>
          {existingFiles.map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 10px', background: 'var(--success-soft)',
              borderRadius: 6, marginBottom: 4,
              border: '1px solid rgba(34,197,94,0.15)'
            }}>
              <span style={{ color: 'var(--success)' }}><FileIcon size={13} /></span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatSize(f.size)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current.click()}
        style={{
          border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border-light)'}`,
          borderRadius: 'var(--radius)',
          padding: '20px 16px',
          textAlign: 'center',
          cursor: uploading ? 'default' : 'pointer',
          background: dragOver ? 'var(--accent-soft)' : 'var(--bg-elevated)',
          transition: 'all 0.2s',
        }}
      >
        <div style={{ color: dragOver ? 'var(--accent)' : 'var(--text-muted)', marginBottom: 8 }}>
          <UploadIcon />
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
          {uploading ? 'Processing...' : 'Drop PDFs here or click to browse'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
          Multiple files supported · Max 20MB each
        </div>
        <input ref={inputRef} type="file" accept=".pdf" multiple onChange={e => addFiles(e.target.files)} style={{ display: 'none' }} />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div style={{ marginTop: 10 }}>
          {files.map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 10px', background: 'var(--bg-elevated)',
              borderRadius: 6, marginBottom: 4, border: '1px solid var(--border)'
            }}>
              <span style={{ color: 'var(--accent)' }}><FileIcon size={13} /></span>
              <span style={{ fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>{f.name}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatSize(f.size)}</span>
              {!uploading && (
                <button onClick={e => { e.stopPropagation(); removeFile(i); }} style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  cursor: 'pointer', padding: 2
                }}><XIcon /></button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Progress bar */}
      {uploading && (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
            <span>Building knowledge base...</span>
            <span>{progress}%</span>
          </div>
          <div style={{ height: 4, background: 'var(--bg-elevated)', borderRadius: 2 }}>
            <div style={{
              height: '100%', width: `${progress}%`,
              background: 'linear-gradient(90deg, var(--accent), #9c5fff)',
              borderRadius: 2, transition: 'width 0.3s'
            }} />
          </div>
        </div>
      )}

      {error && (
        <div style={{
          marginTop: 8, padding: '8px 12px',
          background: 'var(--danger-soft)', borderRadius: 6,
          fontSize: 12, color: 'var(--danger)',
          border: '1px solid rgba(239,68,68,0.2)'
        }}>
          {error}
        </div>
      )}

      {files.length > 0 && !uploading && (
        <button onClick={handleUpload} style={{
          marginTop: 10, width: '100%', padding: '10px',
          background: 'linear-gradient(135deg, var(--accent), #9c5fff)',
          border: 'none', borderRadius: 'var(--radius-sm)',
          color: 'white', fontWeight: 600, fontSize: 13,
          cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.01em'
        }}>
          Process {files.length} PDF{files.length > 1 ? 's' : ''}
        </button>
      )}
    </div>
  );
}
