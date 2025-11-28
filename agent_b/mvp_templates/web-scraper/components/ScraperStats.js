export default function ScraperStats({ stats, onExport }) {
  if (!stats) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold mb-2">📊 Scraping Statistics</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <p><strong>Total Rows:</strong> {stats.rowCount || stats.count || 0}</p>
            {stats.metadata?.year && (
              <p><strong>Season:</strong> {stats.metadata.year}</p>
            )}
            {stats.metadata?.roundNumber && (
              <p><strong>Round:</strong> {stats.metadata.roundNumber}</p>
            )}
            <p><strong>URL:</strong> <a href={stats.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{stats.url}</a></p>
            <p><strong>Scraped At:</strong> {new Date(stats.timestamp).toLocaleString()}</p>
          </div>
        </div>
        <button
          onClick={onExport}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
        >
          📥 Export CSV
        </button>
      </div>
    </div>
  );
}

