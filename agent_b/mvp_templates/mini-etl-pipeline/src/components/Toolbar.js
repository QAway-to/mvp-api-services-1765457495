const toolbarStyle = {
  height: '56px',
  background: '#111c33',
  borderBottom: '1px solid rgba(56,189,248,0.25)',
  display: 'flex',
  alignItems: 'center',
  padding: '0 24px',
  gap: '12px',
  position: 'sticky',
  top: 0,
  zIndex: 10
};

const buttonStyle = {
  padding: '8px 16px',
  borderRadius: '6px',
  border: 'none',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s',
  minWidth: '100px',
  minHeight: '36px'
};

const primaryButtonStyle = {
  ...buttonStyle,
  background: '#38bdf8',
  color: '#0b1120'
};

const secondaryButtonStyle = {
  ...buttonStyle,
  background: 'rgba(56,189,248,0.1)',
  color: '#38bdf8',
  border: '1px solid rgba(56,189,248,0.3)'
};

const statusStyle = {
  marginLeft: 'auto',
  padding: '8px 16px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 500
};

export default function Toolbar({ 
  onRun, 
  onSave, 
  onToggleLogs, 
  isRunning = false,
  showLogs = false,
  status = null
}) {
  const statusColors = {
    success: { background: 'rgba(34,197,94,0.1)', color: '#22c55e' },
    error: { background: 'rgba(239,68,68,0.1)', color: '#ef4444' },
    running: { background: 'rgba(56,189,248,0.1)', color: '#38bdf8' },
    idle: { background: 'rgba(148,163,184,0.1)', color: '#94a3b8' }
  };

  const currentStatusStyle = status 
    ? { ...statusStyle, ...statusColors[status] || statusColors.idle }
    : null;

  return (
    <div style={toolbarStyle}>
      <button
        onClick={onRun}
        disabled={isRunning}
        style={isRunning ? { ...primaryButtonStyle, opacity: 0.6, cursor: 'not-allowed' } : primaryButtonStyle}
      >
        {isRunning ? '⏳ Running...' : '▶️ Run Pipeline'}
      </button>
      
      <button
        onClick={onSave}
        style={secondaryButtonStyle}
      >
        💾 Save
      </button>
      
      <button
        onClick={onToggleLogs}
        style={{
          ...secondaryButtonStyle,
          background: showLogs ? 'rgba(56,189,248,0.2)' : 'rgba(56,189,248,0.1)'
        }}
      >
        📋 {showLogs ? 'Hide' : 'Show'} Logs
      </button>

      {currentStatusStyle && (
        <div style={currentStatusStyle}>
          {status === 'success' && '✅ Success'}
          {status === 'error' && '❌ Error'}
          {status === 'running' && '⏳ Running'}
          {status === 'idle' && '⚪ Idle'}
        </div>
      )}
    </div>
  );
}

