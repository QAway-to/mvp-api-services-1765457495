import { useState } from 'react';

export default function ScraperForm({ onScrape, isLoading }) {
  const [url, setUrl] = useState('');
  const [type, setType] = useState('match');
  const [roundNumber, setRoundNumber] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) {
      alert('Please enter a URL');
      return;
    }
    onScrape(url.trim(), type, roundNumber ? parseInt(roundNumber) : null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Target URL
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/data"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Scrape Type
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="match">Single Match/Page</option>
          <option value="season">Season/Multiple Pages</option>
        </select>
      </div>

      {type === 'season' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Round Number (optional)
          </label>
          <input
            type="number"
            value={roundNumber}
            onChange={(e) => setRoundNumber(e.target.value)}
            placeholder="e.g., 2"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min="1"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading ? '🔄 Scraping...' : '🚀 Start Scraping'}
      </button>
    </form>
  );
}

