import { useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import { loadUsers, buildMetrics } from '../src/lib/randomuser';

const container = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  padding: '16px',
  background: '#f5f7fa',
  color: '#1a1a1a',
  minHeight: '100vh'
};

const header = {
  background: '#ffffff',
  borderBottom: '1px solid #e0e0e0',
  padding: '12px 16px',
  marginBottom: '16px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const dashboardGrid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px',
  marginBottom: '16px'
};

const card = {
  background: '#ffffff',
  borderRadius: '8px',
  padding: '16px',
  border: '1px solid #e0e0e0',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
};

const cardTitle = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#666',
  marginBottom: '12px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};

const metricValue = {
  fontSize: '28px',
  fontWeight: 700,
  color: '#1a1a1a',
  margin: '4px 0'
};

const metricLabel = {
  fontSize: '12px',
  color: '#999',
  marginTop: '4px'
};

const transformPanel = {
  ...card,
  gridColumn: '1 / -1'
};

const button = {
  padding: '8px 16px',
  borderRadius: '6px',
  border: 'none',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s',
  minWidth: '120px',
  minHeight: '36px'
};

const buttonPrimary = {
  ...button,
  background: '#0066cc',
  color: '#ffffff'
};

const buttonSecondary = {
  ...button,
  background: '#f0f0f0',
  color: '#1a1a1a',
  border: '1px solid #d0d0d0'
};

const previewTable = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '13px'
};

const tableHeader = {
  background: '#f8f9fa',
  padding: '10px 12px',
  textAlign: 'left',
  fontWeight: 600,
  color: '#666',
  borderBottom: '2px solid #e0e0e0',
  fontSize: '12px',
  textTransform: 'uppercase'
};

const tableCell = {
  padding: '10px 12px',
  borderBottom: '1px solid #f0f0f0',
  color: '#333'
};

const logContainer = {
  background: '#1a1a1a',
  borderRadius: '6px',
  padding: '12px',
  fontFamily: 'Monaco, "Courier New", monospace',
  fontSize: '12px',
  maxHeight: '200px',
  overflowY: 'auto',
  color: '#00ff00'
};

const logLine = {
  margin: '2px 0',
  lineHeight: '1.4'
};

export default function MiniETL({
  initialMetrics,
  initialUsers,
  sourceUrl: initialSource,
  fallbackUsed: initialFallback,
  fetchedAt: initialFetchedAt
}) {
  const [users, setUsers] = useState(() => Array.isArray(initialUsers) ? initialUsers : []);
  const [metrics, setMetrics] = useState(() => initialMetrics || { rows_in: 0, rows_out: 0, dedup_removed: 0, countries: 0 });
  const [sourceUrl, setSourceUrl] = useState(initialSource);
  const [fallbackUsed, setFallbackUsed] = useState(initialFallback);
  const [fetchedAt, setFetchedAt] = useState(initialFetchedAt);
  const [logLines, setLogLines] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewRows, setPreviewRows] = useState(10);
  const isMounted = useRef(true);
  const logTimers = useRef([]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      logTimers.current.forEach(timer => clearTimeout(timer));
      logTimers.current = [];
    };
  }, []);

  const addLog = (message) => {
    if (!isMounted.current) return;
    setLogLines(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleExtract = async () => {
    if (isProcessing || !isMounted.current) return;
    setIsProcessing(true);
    setLogLines([]);
    
    addLog('Starting Extract phase...');
    
    const timer1 = setTimeout(() => {
      if (isMounted.current) {
        addLog(`Extract: Fetched ${users.length} records from ${fallbackUsed ? 'demo data' : 'Random User API'}`);
      }
    }, 500);
    logTimers.current.push(timer1);

    const timer2 = setTimeout(() => {
      if (isMounted.current) {
        setIsProcessing(false);
        addLog('Extract completed successfully');
      }
    }, 1500);
    logTimers.current.push(timer2);
  };

  const handleTransform = async () => {
    if (isProcessing || !isMounted.current) return;
    setIsProcessing(true);
    
    addLog('Starting Transform phase...');
    
    const timer1 = setTimeout(() => {
      if (isMounted.current) {
        addLog(`Transform: Validated ${metrics.rows_out} records, removed ${metrics.dedup_removed} duplicates`);
      }
    }, 500);
    logTimers.current.push(timer1);

    const timer2 = setTimeout(() => {
      if (isMounted.current) {
        setIsProcessing(false);
        addLog('Transform completed successfully');
      }
    }, 1500);
    logTimers.current.push(timer2);
  };

  const handleLoad = async () => {
    if (isProcessing || !isMounted.current) return;
    setIsProcessing(true);
    
    addLog('Starting Load phase...');
    
    const timer1 = setTimeout(() => {
      if (isMounted.current) {
        addLog(`Load: Stored ${metrics.rows_out} records in destination`);
      }
    }, 500);
    logTimers.current.push(timer1);

    const timer2 = setTimeout(() => {
      if (isMounted.current) {
        setIsProcessing(false);
        addLog('Load completed successfully');
      }
    }, 1500);
    logTimers.current.push(timer2);
  };

  const handleRestart = async () => {
    if (isProcessing || !isMounted.current) return;
    setIsProcessing(true);
    setLogLines([]);
    
    try {
      const response = await fetch('/api/etl/restart');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const payload = await response.json();
      
      if (isMounted.current) {
        setUsers(Array.isArray(payload.users) ? payload.users : []);
        setMetrics(payload.metrics || metrics);
        setSourceUrl(payload.sourceUrl || sourceUrl);
        setFallbackUsed(payload.fallbackUsed ?? fallbackUsed);
        setFetchedAt(payload.fetchedAt || fetchedAt);
        addLog('Pipeline restarted with fresh data');
      }
    } catch (error) {
      if (isMounted.current) {
        addLog(`Error: ${error.message}`);
      }
    } finally {
      if (isMounted.current) {
        setIsProcessing(false);
      }
    }
  };

  const displayUsers = Array.isArray(users) ? users.slice(0, previewRows) : [];

  return (
    <main style={container}>
      <header style={header}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>ETL Pipeline</h1>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#666' }}>
            {fallbackUsed ? 'Demo Mode' : 'Live API'} · {new Date(fetchedAt).toLocaleString()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/analytics" style={{ ...buttonSecondary, textDecoration: 'none', display: 'inline-block' }}>
            Analytics
          </Link>
          <button onClick={handleRestart} disabled={isProcessing} style={buttonPrimary}>
            {isProcessing ? 'Processing...' : 'Restart'}
          </button>
        </div>
      </header>

      <div style={dashboardGrid}>
        <div style={card}>
          <div style={cardTitle}>Rows In</div>
          <div style={metricValue}>{metrics.rows_in || 0}</div>
          <div style={metricLabel}>Total records fetched</div>
        </div>
        <div style={card}>
          <div style={cardTitle}>Rows Out</div>
          <div style={metricValue}>{metrics.rows_out || 0}</div>
          <div style={metricLabel}>Valid records</div>
        </div>
        <div style={card}>
          <div style={cardTitle}>Removed</div>
          <div style={metricValue}>{metrics.dedup_removed || 0}</div>
          <div style={metricLabel}>Duplicates/invalid</div>
        </div>
        <div style={card}>
          <div style={cardTitle}>Countries</div>
          <div style={metricValue}>{metrics.countries || 0}</div>
          <div style={metricLabel}>Unique countries</div>
        </div>
      </div>

      <div style={transformPanel}>
        <div style={cardTitle}>Transformation Pipeline</div>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <button onClick={handleExtract} disabled={isProcessing} style={buttonPrimary}>
            Extract
          </button>
          <button onClick={handleTransform} disabled={isProcessing} style={buttonPrimary}>
            Transform
          </button>
          <button onClick={handleLoad} disabled={isProcessing} style={buttonPrimary}>
            Load
          </button>
        </div>
        <div style={logContainer}>
          {logLines.length > 0 ? (
            logLines.map((line, idx) => (
              <div key={idx} style={logLine}>{line}</div>
            ))
          ) : (
            <div style={{ ...logLine, color: '#666' }}>No operations yet. Click Extract, Transform, or Load to start.</div>
          )}
        </div>
      </div>

      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={cardTitle}>Data Preview</div>
          <select 
            value={previewRows} 
            onChange={(e) => setPreviewRows(Number(e.target.value))}
            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #d0d0d0', fontSize: '13px' }}
          >
            <option value={10}>10 rows</option>
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
          </select>
        </div>
        <table style={previewTable}>
          <thead>
            <tr>
              <th style={tableHeader}>Name</th>
              <th style={tableHeader}>Email</th>
              <th style={tableHeader}>Country</th>
              <th style={tableHeader}>Phone</th>
              <th style={tableHeader}>Registered</th>
            </tr>
          </thead>
          <tbody>
            {displayUsers.length > 0 ? (
              displayUsers.map((user, idx) => (
                <tr key={user?.id?.value || user?.login?.uuid || idx}>
                  <td style={tableCell}>{user?.name?.first} {user?.name?.last}</td>
                  <td style={tableCell}>{user?.email || 'N/A'}</td>
                  <td style={tableCell}>{user?.location?.country || 'N/A'}</td>
                  <td style={tableCell}>{user?.phone || 'N/A'}</td>
                  <td style={tableCell}>
                    {user?.registered?.date ? new Date(user.registered.date).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ ...tableCell, textAlign: 'center', color: '#999' }}>
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export async function getServerSideProps() {
  try {
    const meta = await loadUsers(true);
    const users = Array.isArray(meta?.users) ? meta.users : [];
    const metrics = users.length > 0 ? buildMetrics(users) : { rows_in: 0, rows_out: 0, dedup_removed: 0, countries: 0 };

    return {
      props: {
        initialMetrics: metrics,
        initialUsers: users,
        sourceUrl: meta?.sourceUrl || '',
        fallbackUsed: meta?.fallbackUsed ?? true,
        fetchedAt: meta?.fetchedAt || new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('[MiniETL] getServerSideProps error:', error);
    return {
      props: {
        initialMetrics: { rows_in: 0, rows_out: 0, dedup_removed: 0, countries: 0 },
        initialUsers: [],
        sourceUrl: '',
        fallbackUsed: true,
        fetchedAt: new Date().toISOString()
      }
    };
  }
}
