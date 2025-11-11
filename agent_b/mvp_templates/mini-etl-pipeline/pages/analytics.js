import { useMemo } from 'react';
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

const card = {
  background: '#ffffff',
  borderRadius: '8px',
  padding: '16px',
  border: '1px solid #e0e0e0',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  marginBottom: '16px'
};

const cardTitle = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#666',
  marginBottom: '12px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};

const table = {
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

const button = {
  padding: '8px 16px',
  borderRadius: '6px',
  border: 'none',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  background: '#f0f0f0',
  color: '#1a1a1a',
  textDecoration: 'none',
  display: 'inline-block',
  minWidth: '120px',
  minHeight: '36px'
};

const statsGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '16px',
  marginBottom: '16px'
};

const statCard = {
  ...card,
  marginBottom: 0
};

const statValue = {
  fontSize: '24px',
  fontWeight: 700,
  color: '#1a1a1a',
  margin: '4px 0'
};

const statLabel = {
  fontSize: '12px',
  color: '#999',
  marginTop: '4px'
};

export default function Analytics({ users, metrics }) {
  const userArray = Array.isArray(users) ? users : [];
  const countries = useMemo(() => {
    const countryMap = new Map();
    userArray.forEach(user => {
      const country = user?.location?.country || 'Unknown';
      countryMap.set(country, (countryMap.get(country) || 0) + 1);
    });
    return Array.from(countryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [userArray]);

  return (
    <main style={container}>
      <header style={header}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Analytics</h1>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#666' }}>
            Data analysis and insights
          </p>
        </div>
        <Link href="/" style={button}>
          ← Back to Dashboard
        </Link>
      </header>

      <div style={statsGrid}>
        <div style={statCard}>
          <div style={cardTitle}>Total Records</div>
          <div style={statValue}>{metrics?.rows_in || userArray.length || 0}</div>
          <div style={statLabel}>Fetched from source</div>
        </div>
        <div style={statCard}>
          <div style={cardTitle}>Valid Records</div>
          <div style={statValue}>{metrics?.rows_out || userArray.length || 0}</div>
          <div style={statLabel}>After transformation</div>
        </div>
        <div style={statCard}>
          <div style={cardTitle}>Removed</div>
          <div style={statValue}>{metrics?.dedup_removed || 0}</div>
          <div style={statLabel}>Duplicates/invalid</div>
        </div>
        <div style={statCard}>
          <div style={cardTitle}>Countries</div>
          <div style={statValue}>{metrics?.countries || countries.length || 0}</div>
          <div style={statLabel}>Unique countries</div>
        </div>
      </div>

      <div style={card}>
        <div style={cardTitle}>Top Countries</div>
        <table style={table}>
          <thead>
            <tr>
              <th style={tableHeader}>Country</th>
              <th style={tableHeader}>Users</th>
              <th style={tableHeader}>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {countries.length > 0 ? (
              countries.map(([country, count], idx) => (
                <tr key={idx}>
                  <td style={tableCell}>{country}</td>
                  <td style={tableCell}>{count}</td>
                  <td style={tableCell}>
                    {((count / userArray.length) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" style={{ ...tableCell, textAlign: 'center', color: '#999' }}>
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={card}>
        <div style={cardTitle}>All Records</div>
        <table style={table}>
          <thead>
            <tr>
              <th style={tableHeader}>Name</th>
              <th style={tableHeader}>Email</th>
              <th style={tableHeader}>Country</th>
              <th style={tableHeader}>City</th>
              <th style={tableHeader}>Phone</th>
              <th style={tableHeader}>Registered</th>
            </tr>
          </thead>
          <tbody>
            {userArray.length > 0 ? (
              userArray.map((user, idx) => (
                <tr key={user?.id?.value || user?.login?.uuid || idx}>
                  <td style={tableCell}>{user?.name?.first} {user?.name?.last}</td>
                  <td style={tableCell}>{user?.email || 'N/A'}</td>
                  <td style={tableCell}>{user?.location?.country || 'N/A'}</td>
                  <td style={tableCell}>{user?.location?.city || 'N/A'}</td>
                  <td style={tableCell}>{user?.phone || 'N/A'}</td>
                  <td style={tableCell}>
                    {user?.registered?.date ? new Date(user.registered.date).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ ...tableCell, textAlign: 'center', color: '#999' }}>
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
    const users = await loadUsers();
    const userArray = Array.isArray(users) ? users : [];
    const metrics = userArray.length > 0 ? buildMetrics(userArray) : { rows_in: 0, rows_out: 0, dedup_removed: 0, countries: 0 };
    
    return {
      props: {
        users: userArray,
        metrics
      }
    };
  } catch (error) {
    console.error('[Analytics] getServerSideProps error:', error);
    return {
      props: {
        users: [],
        metrics: { rows_in: 0, rows_out: 0, dedup_removed: 0, countries: 0 }
      }
    };
  }
}
