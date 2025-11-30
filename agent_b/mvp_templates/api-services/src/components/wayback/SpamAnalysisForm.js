import { useState } from 'react';

export default function SpamAnalysisForm({ onAnalyze, isLoading }) {
  const [domains, setDomains] = useState('');
  const [stopWords, setStopWords] = useState('');
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
    <form onSubmit={handleSubmit}>
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
        <small style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
          Enter domain names, one per line. Each domain will be analyzed for spam content.
        </small>
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
        <small style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
          Default stop words will be used if not provided. Add custom keywords to detect spam.
        </small>
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
        <small style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
          Number of historical snapshots to check per domain (1-50, default: 10)
        </small>
      </div>

      <button
        type="submit"
        disabled={isLoading || !domains.trim()}
        className="btn btn-primary"
        style={{ width: '100%' }}
      >
        {isLoading ? '🔄 Analyzing...' : '🔍 Analyze for Spam'}
      </button>
    </form>
  );
}

