export default function Toolbar({ onRun, onSave, onToggleLogs, isRunning, logsVisible }) {
  return (
    <div style={toolbarStyle}>
      <div style={leftSectionStyle}>
        <button
          onClick={onRun}
          disabled={isRunning}
          style={{
            ...buttonStyle,
            ...primaryButtonStyle,
            ...(isRunning ? disabledButtonStyle : {})
          }}
        >
          {isRunning ? '⏳ Running...' : '▶ Run Pipeline'}
        </button>
        <button
          onClick={onSave}
          style={{
            ...buttonStyle,
            ...secondaryButtonStyle
          }}
        >
          💾 Save
        </button>
      </div>
      <div style={rightSectionStyle}>
        <button
          onClick={onToggleLogs}
          style={{
            ...buttonStyle,
            ...secondaryButtonStyle,
            ...(logsVisible ? activeButtonStyle : {})
          }}
        >
          📋 Logs {logsVisible ? '▼' : '▶'}
        </button>
      </div>
    </div>
  );
}

const toolbarStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 24px',
  background: '#0f172a',
  borderBottom: '1px solid rgba(56,189,248,0.25)',
  position: 'sticky',
  top: 0,
  zIndex: 5
};

const leftSectionStyle = {
  display: 'flex',
  gap: 12
};

const rightSectionStyle = {
  display: 'flex',
  gap: 12
};

const buttonStyle = {
  padding: '8px 16px',
  borderRadius: 8,
  border: 'none',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s',
  minWidth: 120,
  minHeight: 36
};

const primaryButtonStyle = {
  background: 'linear-gradient(135deg,#38bdf8,#0ea5e9)',
  color: '#0b1120'
};

const secondaryButtonStyle = {
  background: '#1d293a',
  border: '1px solid rgba(56,189,248,0.3)',
  color: '#e2e8f0'
};

const disabledButtonStyle = {
  background: '#0f172a',
  color: '#475569',
  cursor: 'wait',
  opacity: 0.6
};

const activeButtonStyle = {
  background: 'rgba(56,189,248,0.2)',
  borderColor: '#38bdf8'
};

