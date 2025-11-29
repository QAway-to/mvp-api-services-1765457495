import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import WaybackForm from '../../src/components/wayback/WaybackForm';
import WaybackResults from '../../src/components/wayback/WaybackResults';
import WaybackLogs from '../../src/components/wayback/WaybackLogs';

export default function WaybackPage() {
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);

  const handleTest = async (target) => {
    setIsLoading(true);
    setError(null);
    setLogs([]);
    setResult(null);

    try {
      const response = await fetch('/api/wayback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ target }),
      });

      const data = await response.json();

      // Always set logs if available
      if (data.logs && Array.isArray(data.logs)) {
        setLogs(data.logs);
      }

      if (data.success) {
        setResult(data.data[0]);
      } else {
        const errorMsg = data.message || data.error || 'Unknown error';
        setError(errorMsg);
      }
    } catch (err) {
      console.error('Wayback test error:', err);
      const errorMsg = err.message || 'Network error or invalid response';
      setError(errorMsg);
      
      // Try to parse error response
      try {
        if (err.response) {
          const errorText = await err.response.text();
          if (errorText) {
            try {
              const errorJson = JSON.parse(errorText);
              if (errorJson.logs) {
                setLogs(errorJson.logs);
              }
            } catch (e) {
              // Not JSON
            }
          }
        }
      } catch (e) {
        // Ignore
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Wayback Machine - API Services</title>
        <meta name="description" content="Test Wayback Machine API integration" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <main className="page">
        <header className="page-header">
          <div>
            <h1>📚 Wayback Machine</h1>
            <p className="subtitle">
              Получение архивных снимков сайтов через Wayback Machine API
            </p>
          </div>
          <div className="header-actions">
            <Link href="/" className="btn">
              ← Back to APIs
            </Link>
          </div>
        </header>

        {/* Form Card */}
        <div className="card">
          <header className="card-header">
            <h2>Test Configuration</h2>
            <p>Enter a URL or domain to find archived snapshots</p>
          </header>
          <WaybackForm onTest={handleTest} isLoading={isLoading} />
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
          <WaybackLogs logs={logs} />
        )}

        {/* Results */}
        {result && (
          <WaybackResults result={result} />
        )}

        <footer className="page-footer">
          <p>API Services MVP - Wayback Machine Integration</p>
        </footer>
      </main>
    </>
  );
}

