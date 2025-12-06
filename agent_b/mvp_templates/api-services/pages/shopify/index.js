import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import WebhookInfo from '../../src/components/shopify/WebhookInfo';
import EventsList from '../../src/components/shopify/EventsList';
import EventDetails from '../../src/components/shopify/EventDetails';

export default function ShopifyPage() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

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

  const handleEventSelect = (event) => {
    setSelectedEvent(event);
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
            onEventSelect={handleEventSelect}
            selectedEvent={selectedEvent}
          />
          <EventDetails event={selectedEvent} />
        </div>

      </main>
    </>
  );
}

