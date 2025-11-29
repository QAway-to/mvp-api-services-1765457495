import { useState } from 'react';

export default function ScraperForm({ onScrape, isLoading }) {
  const [url, setUrl] = useState('');
  const [type, setType] = useState('match');
  const [roundNumber, setRoundNumber] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) {
      return;
    }
    onScrape(url.trim(), type, roundNumber ? parseInt(roundNumber) : null);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">
          Target URL
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://afltables.com/afl/stats/games/2024/... or https://afltables.com/afl/seas/2024.html"
          className="form-input"
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          Scrape Type
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="form-select"
        >
          <option value="match">Single Match/Page</option>
          <option value="season">Season/Multiple Pages</option>
        </select>
      </div>

      {type === 'season' && (
        <div className="form-group">
          <label className="form-label">
            Round Number (optional)
          </label>
          <input
            type="number"
            value={roundNumber}
            onChange={(e) => setRoundNumber(e.target.value)}
            placeholder="e.g., 2 (leave empty for all rounds)"
            className="form-input"
            min="1"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="btn btn-primary"
        style={{ width: '100%' }}
      >
        {isLoading ? '🔄 Scraping...' : '🚀 Start Scraping'}
      </button>
    </form>
  );
}

