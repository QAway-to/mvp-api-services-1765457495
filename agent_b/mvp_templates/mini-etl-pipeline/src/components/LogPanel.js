const containerStyle = {
  background: '#0f172a',
  borderRadius: 12,
  padding: 16,
  border: '1px solid rgba(56,189,248,0.2)',
  maxHeight: 300,
  overflow: 'auto',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 13
};

const logItemStyle = {
  padding: '6px 0',
  borderBottom: '1px solid rgba(148,163,184,0.1)',
  display: 'flex',
  gap: 12,
  alignItems: 'flex-start'
};

const timestampStyle = {
  color: '#64748b',
  fontSize: 11,
  minWidth: 80
};

const getStatusColor = (status) => {
  const colors = {
    running: '#3b82f6',
    success: '#22c55e',
    error: '#ef4444',
    pending: '#94a3b8'
  };
  return colors[status] || colors.pending;
};

export default function LogPanel({ logs }) {
  if (!logs || logs.length === 0) {
    return (
      <div style={containerStyle}>
        <div style={{ color: '#64748b', fontStyle: 'italic' }}>
          No logs yet. Run the pipeline to see activity.
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={{ marginBottom: 12, color: '#94a3b8', fontSize: 12, fontWeight: 600 }}>
        Pipeline Logs ({logs.length})
      </div>
      {logs.map((log, idx) => (
        <div key={idx} style={logItemStyle}>
          <span style={timestampStyle}>
            {new Date().toLocaleTimeString()}
          </span>
          <span style={{ 
            color: getStatusColor(log.status),
            fontWeight: log.status === 'error' ? 600 : 400
          }}>
            [{log.step?.toUpperCase() || 'SYSTEM'}] {log.message || log}
          </span>
        </div>
      ))}
    </div>
  );
}

