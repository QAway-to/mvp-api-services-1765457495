export default function Block({ block, onClick, onMouseDown, isDragging }) {
  const typeColors = {
    extract: { bg: 'rgba(34,211,238,0.2)', border: '#22d3ee', icon: '📥' },
    transform: { bg: 'rgba(251,191,36,0.2)', border: '#fbbf24', icon: '⚙️' },
    load: { bg: 'rgba(34,197,94,0.2)', border: '#22c55e', icon: '📤' }
  };

  const colors = typeColors[block.type] || typeColors.extract;
  const status = block.status || 'idle';

  return (
    <div
      style={{
        ...blockStyle,
        left: block.x || 0,
        top: block.y || 0,
        background: colors.bg,
        borderColor: colors.border,
        opacity: isDragging ? 0.8 : 1,
        transform: isDragging ? 'scale(1.05)' : 'scale(1)',
        cursor: isDragging ? 'grabbing' : 'pointer'
      }}
      onClick={onClick}
      onMouseDown={onMouseDown}
    >
      <div style={headerStyle}>
        <span style={iconStyle}>{colors.icon}</span>
        <span style={titleStyle}>{block.type.toUpperCase()}</span>
        {status !== 'idle' && (
          <span style={statusStyle[status]}>
            {status === 'running' ? '⏳' : status === 'success' ? '✅' : '❌'}
          </span>
        )}
      </div>
      <div style={bodyStyle}>
        <div style={labelStyle}>{block.label || block.id}</div>
        {block.metrics && (
          <div style={metricsStyle}>
            {block.metrics.rowsProcessed && (
              <span>{block.metrics.rowsProcessed} rows</span>
            )}
            {block.metrics.duration && (
              <span>{block.metrics.duration}ms</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const blockStyle = {
  position: 'absolute',
  width: 200,
  minHeight: 100,
  borderRadius: 12,
  border: '2px solid',
  padding: 16,
  cursor: 'pointer',
  transition: 'all 0.2s',
  zIndex: 2,
  boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
};

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 8
};

const iconStyle = {
  fontSize: 20
};

const titleStyle = {
  flex: 1,
  fontWeight: 700,
  fontSize: 14,
  color: '#f8fafc',
  textTransform: 'uppercase',
  letterSpacing: 0.5
};

const statusStyle = {
  running: { fontSize: 14 },
  success: { fontSize: 14 },
  error: { fontSize: 14 }
};

const bodyStyle = {
  fontSize: 12,
  color: '#cbd5f5'
};

const labelStyle = {
  marginBottom: 8,
  fontWeight: 500
};

const metricsStyle = {
  display: 'flex',
  gap: 12,
  fontSize: 11,
  color: '#94a3b8',
  marginTop: 8
};

