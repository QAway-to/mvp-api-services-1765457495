const blockStyle = {
  background: '#111c33',
  border: '2px solid rgba(56,189,248,0.25)',
  borderRadius: '12px',
  padding: '20px',
  minWidth: '200px',
  cursor: 'pointer',
  transition: 'all 0.2s',
  position: 'relative'
};

const activeBlockStyle = {
  ...blockStyle,
  borderColor: '#38bdf8',
  boxShadow: '0 0 20px rgba(56,189,248,0.3)'
};

const blockHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '12px'
};

const blockIconStyle = {
  fontSize: '24px'
};

const blockTitleStyle = {
  fontSize: '16px',
  fontWeight: 600,
  color: '#f8fafc',
  margin: 0
};

const blockStatusStyle = {
  marginLeft: 'auto',
  fontSize: '12px',
  padding: '4px 8px',
  borderRadius: '4px',
  fontWeight: 500
};

const blockBodyStyle = {
  fontSize: '13px',
  color: '#94a3b8',
  lineHeight: '1.6'
};

const statusColors = {
  pending: { background: 'rgba(148,163,184,0.1)', color: '#94a3b8' },
  active: { background: 'rgba(56,189,248,0.2)', color: '#38bdf8' },
  success: { background: 'rgba(34,197,94,0.1)', color: '#22c55e' },
  error: { background: 'rgba(239,68,68,0.1)', color: '#ef4444' }
};

const blockIcons = {
  extract: '📥',
  transform: '🔄',
  load: '📤'
};

export default function Block({ 
  type, 
  name, 
  description, 
  status = 'pending',
  isActive = false,
  onClick,
  data = null
}) {
  const currentStyle = isActive ? activeBlockStyle : blockStyle;
  const statusStyle = { ...blockStatusStyle, ...statusColors[status] || statusColors.pending };

  return (
    <div 
      style={currentStyle}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.borderColor = 'rgba(56,189,248,0.5)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.borderColor = 'rgba(56,189,248,0.25)';
        }
      }}
    >
      <div style={blockHeaderStyle}>
        <span style={blockIconStyle}>{blockIcons[type] || '📦'}</span>
        <h3 style={blockTitleStyle}>{name}</h3>
        <span style={statusStyle}>
          {status === 'pending' && '⏸️'}
          {status === 'active' && '⏳'}
          {status === 'success' && '✅'}
          {status === 'error' && '❌'}
        </span>
      </div>
      
      <div style={blockBodyStyle}>
        <p style={{ margin: '0 0 8px 0' }}>{description}</p>
        
        {data && (
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(56,189,248,0.1)' }}>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Preview:</div>
            {Array.isArray(data) && data.length > 0 ? (
              <div style={{ fontSize: '12px', color: '#38bdf8' }}>
                {data.length} records
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>No data</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

