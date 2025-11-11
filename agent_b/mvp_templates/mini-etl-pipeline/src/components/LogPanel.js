export default function LogPanel({ logs, visible }) {
  if (!visible) return null;

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>Execution Logs</h3>
        <span style={countStyle}>{logs.length} entries</span>
      </div>
      <div style={contentStyle}>
        {logs.length === 0 ? (
          <div style={emptyStyle}>
            <p>No logs yet. Run the pipeline to see execution logs.</p>
          </div>
        ) : (
          logs.map((log, idx) => (
            <div key={idx} style={getLogItemStyle(log.level)}>
              <span style={timestampStyle}>
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span style={levelStyle[log.level] || levelStyle.info}>
                [{log.level.toUpperCase()}]
              </span>
              <span style={messageStyle}>{log.message}</span>
              {log.data && (
                <pre style={dataStyle}>{JSON.stringify(log.data, null, 2)}</pre>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const panelStyle = {
  position: 'fixed',
  bottom: 0,
  left: 240,
  right: 320,
  height: 300,
  background: '#0f172a',
  borderTop: '1px solid rgba(56,189,248,0.25)',
  display: 'flex',
  flexDirection: 'column',
  zIndex: 15
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 20px',
  borderBottom: '1px solid rgba(56,189,248,0.15)'
};

const titleStyle = {
  margin: 0,
  fontSize: 14,
  fontWeight: 700,
  color: '#f8fafc'
};

const countStyle = {
  fontSize: 12,
  color: '#94a3b8'
};

const contentStyle = {
  flex: 1,
  overflowY: 'auto',
  padding: '12px 20px',
  fontFamily: 'Monaco, "Courier New", monospace',
  fontSize: 12
};

const getLogItemStyle = (level) => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
  padding: '8px 0',
  borderBottom: '1px solid rgba(56,189,248,0.1)',
  lineHeight: 1.5
});

const timestampStyle = {
  color: '#64748b',
  fontSize: 11,
  minWidth: 80
};

const levelStyle = {
  info: { color: '#38bdf8', fontWeight: 600, minWidth: 70 },
  success: { color: '#22c55e', fontWeight: 600, minWidth: 70 },
  warn: { color: '#fbbf24', fontWeight: 600, minWidth: 70 },
  error: { color: '#ef4444', fontWeight: 600, minWidth: 70 }
};

const messageStyle = {
  flex: 1,
  color: '#cbd5f5'
};

const dataStyle = {
  margin: '4px 0 0 0',
  padding: '8px',
  background: '#0b1120',
  borderRadius: 4,
  fontSize: 11,
  color: '#94a3b8',
  overflow: 'auto',
  maxHeight: 100
};

const emptyStyle = {
  padding: '40px 20px',
  textAlign: 'center',
  color: '#64748b'
};

