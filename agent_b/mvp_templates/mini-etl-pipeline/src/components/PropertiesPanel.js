const panelStyle = {
  width: '320px',
  background: '#111c33',
  borderLeft: '1px solid rgba(56,189,248,0.25)',
  padding: '24px',
  height: 'calc(100vh - 56px)',
  overflowY: 'auto',
  position: 'fixed',
  right: 0,
  top: '56px'
};

const sectionStyle = {
  marginBottom: '24px'
};

const sectionTitleStyle = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#f8fafc',
  marginBottom: '12px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};

const inputGroupStyle = {
  marginBottom: '16px'
};

const labelStyle = {
  display: 'block',
  fontSize: '12px',
  color: '#94a3b8',
  marginBottom: '6px',
  fontWeight: 500
};

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  background: '#0b1120',
  border: '1px solid rgba(56,189,248,0.25)',
  borderRadius: '6px',
  color: '#f8fafc',
  fontSize: '14px'
};

const textareaStyle = {
  ...inputStyle,
  minHeight: '80px',
  resize: 'vertical',
  fontFamily: 'monospace'
};

export default function PropertiesPanel({ 
  block = null, 
  onUpdate 
}) {
  if (!block) {
    return (
      <div style={panelStyle}>
        <div style={{ color: '#64748b', textAlign: 'center', marginTop: '40px' }}>
          <p>Select a block to edit</p>
        </div>
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Block Properties</h2>
        
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Name</label>
          <input
            type="text"
            value={block.name || ''}
            onChange={(e) => onUpdate && onUpdate({ ...block, name: e.target.value })}
            style={inputStyle}
            placeholder="Block name"
          />
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>Type</label>
          <select
            value={block.type || 'extract'}
            onChange={(e) => onUpdate && onUpdate({ ...block, type: e.target.value })}
            style={inputStyle}
          >
            <option value="extract">Extract</option>
            <option value="transform">Transform</option>
            <option value="load">Load</option>
          </select>
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>Description</label>
          <textarea
            value={block.description || ''}
            onChange={(e) => onUpdate && onUpdate({ ...block, description: e.target.value })}
            style={textareaStyle}
            placeholder="Block description"
          />
        </div>
      </div>

      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Configuration</h2>
        
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Config (JSON)</label>
          <textarea
            value={JSON.stringify(block.config || {}, null, 2)}
            onChange={(e) => {
              try {
                const config = JSON.parse(e.target.value);
                onUpdate && onUpdate({ ...block, config });
              } catch (err) {
                // Invalid JSON, ignore
              }
            }}
            style={textareaStyle}
            placeholder='{"key": "value"}'
          />
        </div>
      </div>

      {block.preview && (
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Preview</h2>
          <div style={{
            background: '#0b1120',
            padding: '12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#94a3b8',
            maxHeight: '200px',
            overflow: 'auto'
          }}>
            {Array.isArray(block.preview) && block.preview.length > 0 ? (
              <div>
                <div style={{ color: '#38bdf8', marginBottom: '8px' }}>
                  {block.preview.length} records
                </div>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(block.preview[0], null, 2)}
                </pre>
              </div>
            ) : (
              <div style={{ color: '#64748b' }}>No preview data</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

