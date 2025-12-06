export default function InsightsPanel({ insights }) {
  if (!insights || !Array.isArray(insights) || insights.length === 0) {
    return null;
  }

  const getIcon = (type) => {
    switch (type) {
      case 'pattern': return '◉';
      case 'anomaly': return '⚠';
      case 'trend': return '▲';
      case 'recommendation': return '→';
      default: return '•';
    }
  };

  const getColor = (type, severity) => {
    if (type === 'anomaly') {
      return severity === 'high' ? '#ef4444' : severity === 'medium' ? '#f59e0b' : '#94a3b8';
    }
    if (type === 'recommendation') {
      return severity === 'high' ? '#10b981' : severity === 'medium' ? '#3b82f6' : '#94a3b8';
    }
    if (type === 'pattern') return '#6366f1';
    if (type === 'trend') return '#8b5cf6';
    return '#94a3b8';
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 14, fontWeight: 500, color: '#e2e8f0' }}>Ключевые инсайты</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {insights.map((insight, idx) => (
          <div
            key={idx}
            style={{
              padding: 12,
              background: 'rgba(99, 102, 241, 0.05)',
              border: `1px solid ${getColor(insight.type, insight.severity)}40`,
              borderRadius: 8,
              borderLeft: `3px solid ${getColor(insight.type, insight.severity)}`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'start', gap: 10 }}>
              <span style={{ 
                fontSize: 16, 
                color: getColor(insight.type, insight.severity),
                flexShrink: 0
              }}>
                {getIcon(insight.type)}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontSize: 13, 
                  fontWeight: 600, 
                  color: '#f8fafc',
                  marginBottom: 6
                }}>
                  {insight.title}
                </div>
                <div style={{ 
                  fontSize: 12, 
                  color: '#cbd5e1',
                  lineHeight: 1.6
                }}>
                  {insight.description}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

