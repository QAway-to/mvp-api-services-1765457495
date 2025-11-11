import Block from './Block';

const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  padding: 24,
  background: '#0f172a',
  borderRadius: 16,
  border: '1px solid rgba(56,189,248,0.2)',
  minHeight: 400
};

const blocksContainerStyle = {
  display: 'flex',
  gap: 24,
  justifyContent: 'center',
  flexWrap: 'wrap',
  alignItems: 'flex-start'
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8
};

export default function Canvas({ blocks, onBlockRun, metrics }) {
  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f8fafc' }}>
          ETL Pipeline Canvas
        </h2>
        {metrics && (
          <div style={{ display: 'flex', gap: 16, fontSize: 14, color: '#94a3b8' }}>
            <span>In: <strong>{metrics.rows_in || 0}</strong></span>
            <span>Out: <strong>{metrics.rows_out || 0}</strong></span>
            <span>Removed: <strong>{metrics.dedup_removed || 0}</strong></span>
          </div>
        )}
      </div>
      
      <div style={blocksContainerStyle}>
        {blocks.map((block) => (
          <Block
            key={block.step}
            step={block.step}
            status={block.status}
            data={block.data}
            onRun={() => onBlockRun && onBlockRun(block.step)}
          />
        ))}
      </div>
    </div>
  );
}

