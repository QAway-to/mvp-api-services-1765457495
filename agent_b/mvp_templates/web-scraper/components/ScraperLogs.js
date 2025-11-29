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

  const getLogColor = (type) => {
    switch (type) {
      case 'success':
        return 'text-green-700 bg-green-50';
      case 'error':
        return 'text-red-700 bg-red-50';
      case 'warning':
        return 'text-yellow-700 bg-yellow-50';
      case 'info':
      default:
        return 'text-blue-700 bg-blue-50';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">📋 Scraping Logs</h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {logs.map((log, index) => {
          const time = new Date(log.timestamp).toLocaleTimeString();
          return (
            <div
              key={index}
              className={`p-2 rounded text-sm ${getLogColor(log.type)}`}
            >
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0">{getLogIcon(log.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs opacity-70">{time}</span>
                    <span className="font-medium">{log.type.toUpperCase()}</span>
                  </div>
                  <div className="mt-1 break-words">{log.message}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

