import { useState } from 'react';
import ScraperForm from './ScraperForm';
import ScrapedDataTable from './ScrapedDataTable';
import ScraperStats from './ScraperStats';

export default function ScraperDashboard() {
  const [scrapedData, setScrapedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  const handleScrape = async (url, type, roundNumber) => {
    setIsLoading(true);
    setError(null);
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

      if (result.success) {
        setScrapedData(result.data);
        setStats({
          rowCount: result.count,
          url: result.metadata.url,
          timestamp: result.metadata.timestamp,
          metadata: result.metadata,
        });
      } else {
        setError(result.error || 'Unknown error');
        alert(`Error: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Scraping error:', error);
      setError(error.message);
      alert(`Failed to scrape: ${error.message}`);
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
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">🌐 Universal Web Scraper</h2>
        <ScraperForm onScrape={handleScrape} isLoading={isLoading} />
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
            ❌ {error}
          </div>
        )}
      </div>

      {stats && (
        <ScraperStats stats={stats} onExport={handleExport} />
      )}

      {scrapedData.length > 0 && (
        <ScrapedDataTable data={scrapedData} />
      )}
    </div>
  );
}

