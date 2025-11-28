import { useState } from 'react';
import ScraperForm from './ScraperForm';
import ScrapedDataTable from './ScrapedDataTable';
import ScraperStats from './ScraperStats';

export default function ScraperDashboard() {
  const [scrapedData, setScrapedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState(null);

  const handleScrape = async (url, type, roundNumber) => {
    setIsLoading(true);
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
          totalRows: result.count,
          url: result.url,
          timestamp: new Date().toISOString(),
        });
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Scraping error:', error);
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

    // Convert to CSV - handle both cell-based and object-based data
    let csvRows = [];
    
    if (scrapedData[0].cells) {
      // Cell-based format
      const maxCells = Math.max(...scrapedData.map(row => row.cells ? row.cells.length : 0));
      const headers = Array.from({ length: maxCells }, (_, i) => `Column ${i + 1}`);
      csvRows = [
        [...headers, 'Source URL', 'Timestamp'].join(','),
        ...scrapedData.map(row => {
          const cells = row.cells || [];
          const paddedCells = [...cells, ...Array(maxCells - cells.length).fill('')];
          return [
            ...paddedCells.map(cell => {
              const value = String(cell || '');
              return `"${value.replace(/"/g, '""')}"`;
            }),
            `"${row.sourceUrl || ''}"`,
            `"${row.timestamp || ''}"`
          ].join(',');
        }),
      ];
    } else {
      // Object-based format
      const headers = Object.keys(scrapedData[0]);
      csvRows = [
        headers.join(','),
        ...scrapedData.map(row =>
          headers.map(header => {
            const value = row[header];
            const strValue = value === null || value === undefined ? '' : String(value);
            return `"${strValue.replace(/"/g, '""')}"`;
          }).join(',')
        ),
      ];
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `scraped_data_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">🌐 Web Scraper</h2>
        <ScraperForm onScrape={handleScrape} isLoading={isLoading} />
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

