export default function ScraperStats({ stats, onExport }) {
  if (!stats) return null;

  return (
    <div className="card">
      <header className="card-header">
        <div>
          <h3>📊 Scraping Statistics</h3>
          <p>Results summary and export options</p>
        </div>
        <button onClick={onExport} className="btn btn-primary">
          📥 Export CSV
        </button>
      </header>

      <div className="metrics-grid">
        <div className="metric">
          <p className="metric-label">Total Rows</p>
          <p className="metric-value">{stats.rowCount || stats.count || 0}</p>
        </div>
        {stats.metadata?.year && (
          <div className="metric">
            <p className="metric-label">Season</p>
            <p className="metric-value">{stats.metadata.year}</p>
          </div>
        )}
        {stats.metadata?.roundNumber && (
          <div className="metric">
            <p className="metric-label">Round</p>
            <p className="metric-value">{stats.metadata.roundNumber}</p>
          </div>
        )}
        <div className="metric">
          <p className="metric-label">Scraped At</p>
          <p className="metric-value" style={{ fontSize: '0.95rem', color: '#9ca3af' }}>
            {new Date(stats.timestamp).toLocaleString()}
          </p>
        </div>
      </div>

      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(55, 65, 81, 0.3)' }}>
        <p className="metric-label" style={{ marginBottom: '8px' }}>Source URL</p>
        <a 
          href={stats.url} 
          target="_blank" 
          rel="noopener noreferrer" 
          style={{ 
            color: '#60a5fa', 
            textDecoration: 'none',
            wordBreak: 'break-all',
            fontSize: '0.9rem'
          }}
          onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
          onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
        >
          {stats.url}
        </a>
      </div>
    </div>
  );
}

