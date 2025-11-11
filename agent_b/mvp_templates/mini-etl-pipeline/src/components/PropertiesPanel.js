import { useState } from 'react';

export default function PropertiesPanel({ block, onUpdate, onClose }) {
  if (!block) {
    return (
      <div style={panelStyle}>
        <div style={headerStyle}>
          <h3 style={titleStyle}>Properties</h3>
          <button onClick={onClose} style={closeButtonStyle}>×</button>
        </div>
        <div style={emptyStyle}>
          <p>Select a block to edit</p>
        </div>
      </div>
    );
  }

  const [config, setConfig] = useState(block.config || {});

  const handleChange = (field, value) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    onUpdate(block.id, { config: newConfig });
  };

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>{block.type.toUpperCase()} Properties</h3>
        <button onClick={onClose} style={closeButtonStyle}>×</button>
      </div>
      <div style={contentStyle}>
        {block.type === 'extract' && (
          <div style={sectionStyle}>
            <label style={labelStyle}>Source URL</label>
            <input
              type="text"
              value={config.sourceUrl || 'https://dummyjson.com/products?limit=100'}
              onChange={(e) => handleChange('sourceUrl', e.target.value)}
              style={inputStyle}
              placeholder="https://dummyjson.com/products?limit=100"
            />
            <label style={labelStyle}>Limit</label>
            <input
              type="number"
              value={config.limit || 100}
              onChange={(e) => handleChange('limit', parseInt(e.target.value) || 100)}
              style={inputStyle}
            />
          </div>
        )}

        {block.type === 'transform' && (
          <div style={sectionStyle}>
            <label style={labelStyle}>Filters</label>
            <div style={filterListStyle}>
              {config.filters && config.filters.length > 0 ? (
                config.filters.map((filter, idx) => (
                  <div key={idx} style={filterItemStyle}>
                    <input
                      type="text"
                      value={filter.field || ''}
                      onChange={(e) => {
                        const newFilters = [...(config.filters || [])];
                        newFilters[idx] = { ...newFilters[idx], field: e.target.value };
                        handleChange('filters', newFilters);
                      }}
                      style={{ ...inputStyle, width: '30%' }}
                      placeholder="field"
                    />
                    <select
                      value={filter.operator || '==='}
                      onChange={(e) => {
                        const newFilters = [...(config.filters || [])];
                        newFilters[idx] = { ...newFilters[idx], operator: e.target.value };
                        handleChange('filters', newFilters);
                      }}
                      style={{ ...inputStyle, width: '25%' }}
                    >
                      <option value="===">===</option>
                      <option value=">">&gt;</option>
                      <option value="<">&lt;</option>
                      <option value="includes">includes</option>
                    </select>
                    <input
                      type="text"
                      value={filter.value || ''}
                      onChange={(e) => {
                        const newFilters = [...(config.filters || [])];
                        newFilters[idx] = { ...newFilters[idx], value: e.target.value };
                        handleChange('filters', newFilters);
                      }}
                      style={{ ...inputStyle, width: '40%' }}
                      placeholder="value"
                    />
                  </div>
                ))
              ) : (
                <p style={emptyTextStyle}>No filters</p>
              )}
            </div>
          </div>
        )}

        {block.type === 'load' && (
          <div style={sectionStyle}>
            <label style={labelStyle}>Target</label>
            <select
              value={config.target || 'preview'}
              onChange={(e) => handleChange('target', e.target.value)}
              style={inputStyle}
            >
              <option value="preview">Preview</option>
              <option value="csv">CSV Export</option>
              <option value="json">JSON Export</option>
            </select>
            <label style={labelStyle}>Format</label>
            <select
              value={config.format || 'json'}
              onChange={(e) => handleChange('format', e.target.value)}
              style={inputStyle}
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
          </div>
        )}

        {block.metrics && (
          <div style={sectionStyle}>
            <h4 style={sectionTitleStyle}>Metrics</h4>
            <div style={metricsGridStyle}>
              <div style={metricItemStyle}>
                <span style={metricLabelStyle}>Rows Processed</span>
                <span style={metricValueStyle}>{block.metrics.rowsProcessed || 0}</span>
              </div>
              <div style={metricItemStyle}>
                <span style={metricLabelStyle}>Duration</span>
                <span style={metricValueStyle}>{block.metrics.duration || 0}ms</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const panelStyle = {
  width: 320,
  background: '#111c33',
  borderLeft: '1px solid rgba(56,189,248,0.25)',
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  position: 'fixed',
  right: 0,
  top: 0,
  zIndex: 10
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '20px',
  borderBottom: '1px solid rgba(56,189,248,0.15)'
};

const titleStyle = {
  margin: 0,
  fontSize: 16,
  fontWeight: 700,
  color: '#f8fafc'
};

const closeButtonStyle = {
  background: 'transparent',
  border: 'none',
  color: '#94a3b8',
  fontSize: 24,
  cursor: 'pointer',
  lineHeight: 1,
  padding: 0,
  width: 24,
  height: 24
};

const contentStyle = {
  flex: 1,
  overflowY: 'auto',
  padding: '20px'
};

const sectionStyle = {
  marginBottom: 24
};

const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#94a3b8',
  marginBottom: 8,
  textTransform: 'uppercase',
  letterSpacing: 0.5
};

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid rgba(56,189,248,0.3)',
  background: '#0f172a',
  color: '#f8fafc',
  fontSize: 14,
  marginBottom: 12
};

const filterListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8
};

const filterItemStyle = {
  display: 'flex',
  gap: 8
};

const emptyStyle = {
  padding: '40px 20px',
  textAlign: 'center',
  color: '#64748b'
};

const emptyTextStyle = {
  color: '#64748b',
  fontSize: 12,
  fontStyle: 'italic'
};

const sectionTitleStyle = {
  margin: '0 0 12px',
  fontSize: 14,
  fontWeight: 600,
  color: '#cbd5f5'
};

const metricsGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12
};

const metricItemStyle = {
  background: '#0f172a',
  padding: 12,
  borderRadius: 8,
  border: '1px solid rgba(56,189,248,0.2)'
};

const metricLabelStyle = {
  display: 'block',
  fontSize: 11,
  color: '#94a3b8',
  marginBottom: 4
};

const metricValueStyle = {
  display: 'block',
  fontSize: 18,
  fontWeight: 700,
  color: '#38bdf8'
};

