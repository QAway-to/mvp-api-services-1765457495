import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import WebhookInfo from '../../src/components/shopify/WebhookInfo';
import EventsList from '../../src/components/shopify/EventsList';

export default function ShopifyPage() {
  const [events, setEvents] = useState([]);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  const fetchEvents = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/events');
      const data = await response.json();

      if (data.success) {
        setEvents(data.events || []);
        setLastRefresh(new Date());
      } else {
        setError(data.error || 'Failed to fetch events');
      }
    } catch (err) {
      console.error('Fetch events error:', err);
      setError(err.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchEvents();

    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchEvents, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleSendToBitrix = async () => {
    if (selectedEvents.length === 0) {
      alert('Выберите хотя бы одно событие для отправки');
      return;
    }

    setIsSending(true);
    setSendResult(null);

    try {
      const response = await fetch('/api/send-to-bitrix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedEvents })
      });

      const result = await response.json();

      if (response.ok) {
        setSendResult({ success: true, message: result.message });
        // Optionally clear selection after successful send
        // setSelectedEvents([]);
      } else {
        setSendResult({ success: false, message: result.error || 'Failed to send' });
      }
    } catch (error) {
      console.error('Send to Bitrix error:', error);
      setSendResult({ success: false, message: 'Network error' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Head>
        <title>Shopify Webhook - API Services</title>
        <meta name="description" content="Monitor Shopify webhook events" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <main className="page">
        <header className="page-header">
          <div>
            <h1>Shopify Webhook</h1>
            <p className="subtitle">
              Receive and monitor Shopify webhook events in real-time
            </p>
          </div>
          <div className="header-actions">
            <button
              onClick={handleSendToBitrix}
              className="btn"
              disabled={isSending || selectedEvents.length === 0}
              style={{
                marginRight: '12px',
                background: selectedEvents.length > 0 ? '#059669' : '#6b7280',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                color: 'white',
                cursor: selectedEvents.length > 0 ? 'pointer' : 'not-allowed'
              }}
            >
              {isSending ? 'Отправка...' : `📤 Отправить в Bitrix (${selectedEvents.length})`}
            </button>
            <button
              onClick={fetchEvents}
              className="btn"
              disabled={isLoading}
              style={{ marginRight: '12px' }}
            >
              {isLoading ? 'Refreshing...' : '🔄 Refresh'}
            </button>
            <Link href="/" className="btn">
              ← Back
            </Link>
          </div>
        </header>

        {sendResult && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            background: sendResult.success ? 'rgba(5, 150, 105, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${sendResult.success ? '#059669' : '#ef4444'}`,
            color: sendResult.success ? '#059669' : '#ef4444'
          }}>
            {sendResult.message}
          </div>
        )}

        {lastRefresh && (
          <div style={{
            padding: '8px 16px',
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '0.9rem',
            color: '#94a3b8'
          }}>
            Last refreshed: {lastRefresh.toLocaleTimeString()} (Auto-refresh every 5s)
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Webhook Configuration */}
        <WebhookInfo />

        {/* Events List and Details */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '20px',
          marginTop: '20px'
        }}>
          <EventsList
            events={events}
            selectedEvents={selectedEvents}
            onSelectionChange={setSelectedEvents}
          />
          <div className="card">
            <header className="card-header">
              <h2>Selected Events Summary</h2>
            </header>
            <div style={{ padding: '20px' }}>
              {selectedEvents.length === 0 ? (
                <p style={{ color: '#94a3b8' }}>No events selected</p>
              ) : (
                <div>
                  <p style={{ color: '#f1f5f9', marginBottom: '12px' }}>
                    <strong>{selectedEvents.length}</strong> event(s) selected for sending to Bitrix
                  </p>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {selectedEvents.map((event, index) => (
                      <div key={event.id || index} style={{
                        padding: '8px 12px',
                        marginBottom: '8px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        borderRadius: '6px',
                        border: '1px solid #3b82f6'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#f1f5f9', fontWeight: 600 }}>
                            Order #{event.id}
                          </span>
                          <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                            {event.total_price} {event.currency}
                          </span>
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '4px' }}>
                          {event.email}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

