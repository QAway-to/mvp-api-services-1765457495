export default function WaybackLogs({ logs }) {
  if (!logs || logs.length === 0) {
    return null;
  }

  const getLogClass = (type) => {
    switch (type) {
      case 'success':
        return 'log-success';
      case 'error':
        return 'log-error';
      case 'warning':
        return 'log-warning';
      default:
        return 'log-info';
    }
  };

  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString();
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="card">
      <header className="card-header">
        <h2>Logs</h2>
      </header>
      <div className="logs-container">
        {logs.map((log, index) => (
          <div key={index} className="log-entry">
            <span className="log-timestamp">[{formatTimestamp(log.timestamp)}]</span>
            <span className={getLogClass(log.type)}>{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

