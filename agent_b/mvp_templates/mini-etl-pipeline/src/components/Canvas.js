import Block from './Block';

const canvasStyle = {
  flex: 1,
  padding: '40px',
  background: '#0b1120',
  minHeight: 'calc(100vh - 56px)',
  overflow: 'auto'
};

const pipelineStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '40px',
  justifyContent: 'center',
  flexWrap: 'wrap',
  maxWidth: '1200px',
  margin: '0 auto'
};

const connectorStyle = {
  width: '60px',
  height: '2px',
  background: 'linear-gradient(90deg, rgba(56,189,248,0.5) 0%, rgba(56,189,248,0.1) 100%)',
  position: 'relative'
};

const connectorArrowStyle = {
  position: 'absolute',
  right: '-8px',
  top: '-4px',
  width: 0,
  height: 0,
  borderLeft: '8px solid rgba(56,189,248,0.5)',
  borderTop: '4px solid transparent',
  borderBottom: '4px solid transparent'
};

export default function Canvas({ 
  blocks = [], 
  onBlockClick,
  activeBlockId = null
}) {
  return (
    <div style={canvasStyle}>
      <div style={pipelineStyle}>
        {blocks.map((block, index) => (
          <div key={block.id} style={{ display: 'flex', alignItems: 'center' }}>
            <Block
              type={block.type}
              name={block.name}
              description={block.description}
              status={block.status}
              isActive={activeBlockId === block.id}
              onClick={() => onBlockClick && onBlockClick(block.id)}
              data={block.preview}
            />
            
            {index < blocks.length - 1 && (
              <div style={connectorStyle}>
                <div style={connectorArrowStyle}></div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {blocks.length === 0 && (
        <div style={{
          textAlign: 'center',
          color: '#64748b',
          marginTop: '100px',
          fontSize: '16px'
        }}>
          <p>No pipeline blocks configured</p>
          <p style={{ fontSize: '14px', marginTop: '8px' }}>
            Configure your ETL pipeline in the Inspector
          </p>
        </div>
      )}
    </div>
  );
}

