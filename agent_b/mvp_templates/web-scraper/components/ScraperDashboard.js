import { useState } from 'react';
import ScraperForm from './ScraperForm';
import ScrapedDataTable from './ScrapedDataTable';
import ScraperStats from './ScraperStats';
import ScraperLogs from './ScraperLogs';

export default function ScraperDashboard() {
  const [scrapedData, setScrapedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);

  const handleScrape = async (url, type, roundNumber) => {
    setIsLoading(true);
    setError(null);
    setLogs([]);
    setScrapedData([]);
    setStats(null);
    
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          type: type,
          roundNumber: roundNumber,
        }),
      });

      const result = await response.json();

      // Always set logs if available
      if (result.logs && Array.isArray(result.logs)) {
        setLogs(result.logs);
      }

      if (result.success) {
        setScrapedData(result.data);
        setStats({
          rowCount: result.count,
          url: result.metadata.url,
          timestamp: result.metadata.timestamp,
          metadata: result.metadata,
        });
      } else {
        const errorMsg = result.message || result.error || 'Unknown error';
        setError(errorMsg);
        // Logs already set above, no alert needed
      }
    } catch (error) {
      console.error('Scraping error:', error);
      const errorMsg = error.message || 'Network error or invalid response';
      setError(errorMsg);
      
      // Try to parse error response
      try {
        const errorText = await error.response?.text();
        if (errorText) {
          try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.logs) {
              setLogs(errorJson.logs);
            }
          } catch (e) {
            // Not JSON, add error to logs
            setLogs([{
              timestamp: new Date().toISOString(),
              type: 'error',
              message: `Network error: ${errorMsg}`
            }]);
          }
        }
      } catch (e) {
        // Add error to logs
        setLogs([{
          timestamp: new Date().toISOString(),
          type: 'error',
          message: `Failed to scrape: ${errorMsg}`
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (scrapedData.length === 0) {
      alert('No data to export');
      return;
    }

    // Convert to CSV
    const headers = Object.keys(scrapedData[0]);
    const csvRows = [
      headers.join(','),
      ...scrapedData.map(row =>
        headers.map(header => {
          const value = row[header];
          const strValue = value === null || value === undefined ? '' : String(value);
          return `"${strValue.replace(/"/g, '""')}"`;
        }).join(',')
      ),
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const filename = stats?.metadata?.year 
      ? `scraped_data_${stats.metadata.year}${stats.metadata.roundNumber ? '_round_' + stats.metadata.roundNumber : ''}.csv`
      : `scraped_data_${new Date().toISOString().split('T')[0]}.csv`;
    link.download = filename;
    link.click();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Main Form Card */}
      <div className="card">
        <header className="card-header">
          <h2>Scrape Configuration</h2>
        </header>
        <ScraperForm onScrape={handleScrape} isLoading={isLoading} />
        {error && (
          <div className="alert alert-error" style={{ marginTop: '20px' }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>❌ Error: {error}</div>
            {logs.length > 0 && (
              <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                Check logs below for detailed information
              </div>
            )}
          </div>
        )}
      </div>

      {/* Logs */}
      {logs.length > 0 && (
        <ScraperLogs logs={logs} />
      )}

      {/* Stats */}
      {stats && (
        <ScraperStats stats={stats} onExport={handleExport} />
      )}

      {/* Data Table */}
      {scrapedData.length > 0 && (
        <ScrapedDataTable data={scrapedData} />
      )}
    </div>
  );
}

