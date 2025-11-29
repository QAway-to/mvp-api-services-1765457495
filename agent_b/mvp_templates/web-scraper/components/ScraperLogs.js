export default function ScraperLogs({ logs }) {
  if (!logs || logs.length === 0) {
    return null;
  }

  const getLogIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const getLogClass = (type) => {
    switch (type) {
      case 'success':
        return 'log-entry log-entry-success';
      case 'error':
        return 'log-entry log-entry-error';
      case 'warning':
        return 'log-entry log-entry-warning';
      case 'info':
      default:
        return 'log-entry log-entry-info';
    }
  };

  return (
    <div className="card">
      <header className="card-header">
        <h3>📋 Scraping Logs</h3>
        <p>{logs.length} log entries</p>
      </header>
      <div className="logs-container">
        {logs.map((log, index) => {
          const time = new Date(log.timestamp).toLocaleTimeString();
          return (
            <div key={index} className={getLogClass(log.type)}>
              <span style={{ flexShrink: 0 }}>{getLogIcon(log.type)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="log-time">{time}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.8 }}>
                    {log.type}
                  </span>
                </div>
                <div style={{ wordBreak: 'break-word' }}>{log.message}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

