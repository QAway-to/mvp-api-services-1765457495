import { useState } from 'react';

const DEFAULT_DOMAINS = `888casino.com
paydayloan.com
sp.freehat.cc
example.com
wikipedia.org
poker.com
loans.com
online-casino.com
betting.com
test.com`;

const DEFAULT_STOP_WORDS = `casino
poker
roulette
blackjack
betting
loan
payday
bonus
jackpot
картман`;

export default function SpamAnalysisForm({ onAnalyze, isLoading }) {
  const [domains, setDomains] = useState(DEFAULT_DOMAINS);
  const [stopWords, setStopWords] = useState(DEFAULT_STOP_WORDS);
  const [maxSnapshots, setMaxSnapshots] = useState(10);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!domains.trim()) {
      return;
    }

    // Parse domains (one per line)
    const domainList = domains
      .split('\n')
      .map(d => d.trim())
      .filter(d => d.length > 0);

    if (domainList.length === 0) {
      return;
    }

    onAnalyze({
      domains: domainList,
      stopWords: stopWords.trim() || null,
      maxSnapshots: parseInt(maxSnapshots) || 10,
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%', boxSizing: 'border-box' }}>
      <div className="form-group">
        <label className="form-label">
          Domains to Analyze (one per line)
        </label>
        <textarea
          value={domains}
          onChange={(e) => setDomains(e.target.value)}
          placeholder="example.com&#10;test-domain.com&#10;another-domain.org"
          className="form-textarea"
          rows="6"
          required
          disabled={isLoading}
          style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          Custom Stop Words (optional, comma or newline separated)
        </label>
        <textarea
          value={stopWords}
          onChange={(e) => setStopWords(e.target.value)}
          placeholder="casino, viagra, porn, get rich fast"
          className="form-textarea"
          rows="3"
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          Max Snapshots per Domain
        </label>
        <input
          type="number"
          value={maxSnapshots}
          onChange={(e) => setMaxSnapshots(e.target.value)}
          min="1"
          max="50"
          className="form-input"
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || !domains.trim()}
        className="btn btn-primary"
        style={{ width: '100%', boxSizing: 'border-box' }}
      >
        {isLoading ? 'Analyzing...' : 'Analyze for Spam'}
      </button>
    </form>
  );
}

