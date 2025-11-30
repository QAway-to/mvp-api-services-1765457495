import { useEffect, useRef } from 'react';

const STATUS_COLORS = {
  QUEUED: '#6b7280',
  FETCHING_SNAPSHOTS: '#3b82f6',
  NO_SNAPSHOTS: '#9ca3af',
  UNAVAILABLE: '#ef4444',
  ANALYZING: '#f59e0b',
  CLEAN: '#10b981',
  SUSPICIOUS: '#f59e0b',
  SPAM: '#ef4444',
};

const STATUS_LABELS = {
  QUEUED: 'Queued',
  FETCHING_SNAPSHOTS: 'Fetching Snapshots',
  NO_SNAPSHOTS: 'No Snapshots',
  UNAVAILABLE: 'Unavailable',
  ANALYZING: 'Analyzing',
  CLEAN: 'Clean',
  SUSPICIOUS: 'Suspicious',
  SPAM: 'Spam',
};

export default function DomainStatusList({ domains, summary }) {
  const containerRef = useRef(null);

  // Auto-scroll to bottom when new domains are added
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [domains]);

  if (!domains || domains.length === 0) {
    return null;
  }

  const getStatusBadge = (status) => {
    const color = STATUS_COLORS[status] || '#6b7280';
    const label = STATUS_LABELS[status] || status;
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: 600,
          backgroundColor: `${color}20`,
          color: color,
          border: `1px solid ${color}40`,
        }}
      >
        {label}
      </span>
    );
  };

  const formatStopWords = (stopWords) => {
    if (!stopWords || stopWords.length === 0) return 'None';
    const words = stopWords.slice(0, 5).map(sw => sw.word || sw);
    const more = stopWords.length > 5 ? ` +${stopWords.length - 5}` : '';
    return words.join(', ') + more;
  };

  return (
    <>
      {/* Summary */}
      {summary && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <header className="card-header">
            <h2>Analysis Summary</h2>
          </header>
          <div style={{ padding: '16px' }}>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}>
              <span>
                <strong>Total:</strong> {summary.total || 0}
              </span>
              <span style={{ color: '#10b981' }}>
                <strong>Clean:</strong> {summary.clean || 0}
              </span>
              <span style={{ color: '#f59e0b' }}>
                <strong>Suspicious:</strong> {summary.suspicious || 0}
              </span>
              <span style={{ color: '#ef4444' }}>
                <strong>Spam:</strong> {summary.spam || 0}
              </span>
              <span style={{ color: '#9ca3af' }}>
                <strong>No Snapshots:</strong> {summary.no_snapshots || 0}
              </span>
              <span style={{ color: '#ef4444' }}>
                <strong>Unavailable:</strong> {summary.unavailable || 0}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Domain List */}
      <div className="card">
        <header className="card-header">
          <h2>Domain Analysis Status</h2>
          <p style={{ fontSize: '0.9rem', color: '#9ca3af', marginTop: '8px' }}>
            Real-time analysis progress for each domain
          </p>
        </header>
        <div
          ref={containerRef}
          style={{
            maxHeight: '600px',
            overflowY: 'auto',
            padding: '16px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {domains.map((domain, index) => (
              <div
                key={index}
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #374151',
                  backgroundColor: '#1f2937',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '1rem', color: '#f9fafb' }}>{domain.domain}</strong>
                      {getStatusBadge(domain.status)}
                    </div>
                    {domain.lastMessage && (
                      <div style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: '4px' }}>
                        {domain.lastMessage}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '12px',
                  fontSize: '0.85rem',
                  marginTop: '12px',
                }}>
                  <div>
                    <span style={{ color: '#9ca3af' }}>Snapshots:</span>{' '}
                    <strong style={{ color: '#f9fafb' }}>
                      {domain.snapshotsAnalyzed || 0}/{domain.snapshotsFound || 0}
                    </strong>
                  </div>
                  {domain.maxSpamScore !== undefined && (
                    <div>
                      <span style={{ color: '#9ca3af' }}>Max Score:</span>{' '}
                      <strong style={{
                        color: domain.maxSpamScore >= 8 ? '#ef4444' : domain.maxSpamScore >= 5 ? '#f59e0b' : '#10b981'
                      }}>
                        {domain.maxSpamScore.toFixed(1)}/10
                      </strong>
                    </div>
                  )}
                  {domain.avgSpamScore !== undefined && domain.avgSpamScore > 0 && (
                    <div>
                      <span style={{ color: '#9ca3af' }}>Avg Score:</span>{' '}
                      <strong style={{ color: '#f9fafb' }}>
                        {domain.avgSpamScore.toFixed(1)}/10
                      </strong>
                    </div>
                  )}
                  {domain.stopWordsFound && domain.stopWordsFound.length > 0 && (
                    <div>
                      <span style={{ color: '#9ca3af' }}>Stop Words:</span>{' '}
                      <strong style={{ color: '#f9fafb' }}>
                        {domain.stopWordsFound.length}
                      </strong>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>
                        {formatStopWords(domain.stopWordsFound)}
                      </div>
                    </div>
                  )}
                </div>

                {domain.error && (
                  <div style={{
                    marginTop: '12px',
                    padding: '8px',
                    borderRadius: '4px',
                    backgroundColor: '#7f1d1d',
                    border: '1px solid #991b1b',
                    fontSize: '0.85rem',
                    color: '#fca5a5',
                  }}>
                    <strong>Error:</strong> {domain.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

