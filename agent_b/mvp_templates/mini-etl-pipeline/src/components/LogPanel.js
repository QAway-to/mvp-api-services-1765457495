const panelStyle = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  height: '300px',
  background: '#0b1120',
  borderTop: '1px solid rgba(56,189,248,0.25)',
  display: 'flex',
  flexDirection: 'column',
  zIndex: 20
};

const headerStyle = {
  padding: '12px 24px',
  background: '#111c33',
  borderBottom: '1px solid rgba(56,189,248,0.25)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const titleStyle = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#f8fafc',
  margin: 0
};

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  color: '#94a3b8',
  cursor: 'pointer',
  fontSize: '18px',
  padding: '4px 8px'
};

const contentStyle = {
  flex: 1,
  overflowY: 'auto',
  padding: '16px 24px',
  fontFamily: 'monospace',
  fontSize: '12px',
  lineHeight: '1.6'
};

const logEntryStyle = {
  marginBottom: '8px',
  padding: '4px 0'
};

const logLevels = {
  info: { color: '#94a3b8' },
  warn: { color: '#fbbf24' },
  error: { color: '#ef4444' },
  success: { color: '#22c55e' }
};

export default function LogPanel({ 
  logs = [], 
  onClose 
}) {
  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>Execution Logs</h3>
        <button onClick={onClose} style={closeButtonStyle}>
          ✕
        </button>
      </div>
      
      <div style={contentStyle}>
        {logs.length === 0 ? (
          <div style={{ color: '#64748b', textAlign: 'center', marginTop: '40px' }}>
            No logs yet. Run the pipeline to see execution logs.
          </div>
        ) : (
          logs.map((log, index) => {
            const levelStyle = logLevels[log.level] || logLevels.info;
            const time = new Date(log.timestamp).toLocaleTimeString();
            
            return (
              <div key={index} style={logEntryStyle}>
                <span style={{ color: '#64748b' }}>{time}</span>
                {' '}
                <span style={{ color: levelStyle.color, fontWeight: 500 }}>
                  [{log.level.toUpperCase()}]
                </span>
                {' '}
                <span style={{ color: '#f8fafc' }}>
                  {log.message}
                </span>
                {log.data && (
                  <div style={{ marginLeft: '20px', marginTop: '4px', color: '#94a3b8' }}>
                    {JSON.stringify(log.data, null, 2)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

