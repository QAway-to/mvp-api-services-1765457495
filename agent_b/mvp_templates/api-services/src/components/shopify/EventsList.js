export default function EventsList({ events, onEventSelect, selectedEvent }) {
  if (!events || events.length === 0) {
    return (
      <div className="card">
        <header className="card-header">
          <h2>Received Events</h2>
        </header>
        <div className="alert alert-info">
          <strong>No events yet</strong>
          <p>Webhook events will appear here once Shopify starts sending them.</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  return (
    <div className="card">
      <header className="card-header">
        <h2>Received Events ({events.length})</h2>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #334155' }}>
              <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8' }}>ID</th>
              <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8' }}>Email</th>
              <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8' }}>Total</th>
              <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8' }}>Currency</th>
              <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8' }}>Received At</th>
              <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8' }}>Items</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event, index) => (
              <tr
                key={event.id || index}
                onClick={() => onEventSelect && onEventSelect(event)}
                style={{
                  borderBottom: '1px solid #334155',
                  cursor: 'pointer',
                  backgroundColor: selectedEvent?.id === event.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (selectedEvent?.id !== event.id) {
                    e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedEvent?.id !== event.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <td style={{ padding: '12px', color: '#f1f5f9' }}>{event.id || 'N/A'}</td>
                <td style={{ padding: '12px', color: '#f1f5f9' }}>{event.email || 'N/A'}</td>
                <td style={{ padding: '12px', color: '#f1f5f9' }}>{event.total_price || 'N/A'}</td>
                <td style={{ padding: '12px', color: '#f1f5f9' }}>{event.currency || 'N/A'}</td>
                <td style={{ padding: '12px', color: '#94a3b8', fontSize: '0.9rem' }}>
                  {formatDate(event.received_at || event.created_at)}
                </td>
                <td style={{ padding: '12px', color: '#f1f5f9' }}>
                  {event.line_items ? event.line_items.length : 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

