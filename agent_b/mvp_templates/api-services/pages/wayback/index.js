import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import WaybackForm from '../../src/components/wayback/WaybackForm';
import WaybackResults from '../../src/components/wayback/WaybackResults';
import WaybackLogs from '../../src/components/wayback/WaybackLogs';
import SpamAnalysisForm from '../../src/components/wayback/SpamAnalysisForm';
import SpamAnalysisResults from '../../src/components/wayback/SpamAnalysisResults';

export default function WaybackPage() {
  const [mode, setMode] = useState('test'); // 'test' or 'analyze'
  const [result, setResult] = useState(null);
  const [spamResults, setSpamResults] = useState(null);
  const [spamSummary, setSpamSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);

  const handleTest = async (target) => {
    setIsLoading(true);
    setError(null);
    setLogs([]);
    setResult(null);
    setSpamResults(null);
    setSpamSummary(null);

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

  const handleSpamAnalysis = async ({ domains, stopWords, maxSnapshots }) => {
    setIsLoading(true);
    setError(null);
    setLogs([]);
    setResult(null);
    setSpamResults(null);
    setSpamSummary(null);

    try {
      const response = await fetch('/api/wayback/analyze-spam', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domains, stopWords, maxSnapshots }),
      });

      const data = await response.json();

      // Always set logs if available
      if (data.logs && Array.isArray(data.logs)) {
        setLogs(data.logs);
      }

      if (data.success) {
        setSpamResults(data.results);
        setSpamSummary(data.summary);
      } else {
        const errorMsg = data.message || data.error || 'Unknown error';
        setError(errorMsg);
      }
    } catch (err) {
      console.error('Spam analysis error:', err);
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

  const handleExportCSV = () => {
    if (!spamResults || spamResults.length === 0) {
      alert('No data to export');
      return;
    }

    // CSV Headers
    const headers = [
      'Domain',
      'Status',
      'Snapshots Checked',
      'Spam Snapshots',
      'Spam Percentage',
      'Average Spam Score',
      'Total Stop Words Found',
      'Stop Words List',
      'First Spam Date',
      'Error',
    ];

    // CSV Rows
    const rows = spamResults.map(result => {
      const stopWordsList = result.stopWordsFound
        ? result.stopWordsFound.map(sw => `${sw.word}(${sw.count})`).join('; ')
        : '';
      
      const formatDate = (timestamp) => {
        if (!timestamp || timestamp.length < 8) return '';
        const year = timestamp.substring(0, 4);
        const month = timestamp.substring(4, 6);
        const day = timestamp.substring(6, 8);
        return `${year}-${month}-${day}`;
      };

      return [
        result.domain || '',
        result.status || '',
        result.snapshotsChecked || '',
        result.spamSnapshots || '',
        result.spamPercentage !== undefined ? `${result.spamPercentage}%` : '',
        result.avgSpamScore || '',
        result.totalStopWordsFound || '',
        stopWordsList,
        result.firstSpamDate ? formatDate(result.firstSpamDate) : '',
        result.error || '',
      ];
    });

    // Create CSV content
    const csvRows = [
      headers.join(','),
      ...rows.map(row =>
        row.map(cell => {
          const strValue = cell === null || cell === undefined ? '' : String(cell);
          return `"${strValue.replace(/"/g, '""')}"`;
        }).join(',')
      ),
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `spam_analysis_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
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
              Получение архивных снимков сайтов и анализ дроп-доменов на спам
            </p>
          </div>
          <div className="header-actions">
            <Link href="/" className="btn">
              ← Back to APIs
            </Link>
          </div>
        </header>

        {/* Mode Switcher */}
        <div className="card">
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <button
              onClick={() => {
                setMode('test');
                setResult(null);
                setSpamResults(null);
                setSpamSummary(null);
                setError(null);
                setLogs([]);
              }}
              className={mode === 'test' ? 'btn btn-primary' : 'btn'}
              style={{ flex: 1 }}
            >
              🔍 Test Snapshots
            </button>
            <button
              onClick={() => {
                setMode('analyze');
                setResult(null);
                setSpamResults(null);
                setSpamSummary(null);
                setError(null);
                setLogs([]);
              }}
              className={mode === 'analyze' ? 'btn btn-primary' : 'btn'}
              style={{ flex: 1 }}
            >
              🛡️ Analyze for Spam
            </button>
          </div>
        </div>

        {/* Form Card */}
        <div className="card">
          <header className="card-header">
            <h2>{mode === 'test' ? 'Test Configuration' : 'Spam Analysis Configuration'}</h2>
            <p>
              {mode === 'test' 
                ? 'Enter a URL or domain to find archived snapshots'
                : 'Enter domains to analyze for spam content in historical snapshots'}
            </p>
          </header>
          {mode === 'test' ? (
            <WaybackForm onTest={handleTest} isLoading={isLoading} />
          ) : (
            <SpamAnalysisForm onAnalyze={handleSpamAnalysis} isLoading={isLoading} />
          )}
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

        {/* Test Results */}
        {mode === 'test' && result && (
          <WaybackResults result={result} />
        )}

        {/* Spam Analysis Results */}
        {mode === 'analyze' && spamResults && (
          <SpamAnalysisResults 
            results={spamResults} 
            summary={spamSummary}
            onExportCSV={handleExportCSV}
          />
        )}

        <footer className="page-footer">
          <p>API Services MVP - Wayback Machine Integration</p>
        </footer>
      </main>
    </>
  );
}

