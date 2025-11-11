import { useState, useRef, useEffect } from 'react';
import Sidebar from '../src/components/Sidebar';
import { previewData, sortData, aggregateData, getDataStats } from '../src/lib/dataUtils';
import { logger } from '../src/lib/logger';

export default function Inspector() {
  const [data, setData] = useState([]);
  const [preview, setPreview] = useState([]);
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [aggregateField, setAggregateField] = useState('');
  const [aggregated, setAggregated] = useState(null);
  const [stats, setStats] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    loadSampleData();
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadSampleData = async () => {
    try {
      const response = await fetch('/api/fetch-source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceUrl: 'https://dummyjson.com/products?limit=100' })
      });
      const result = await response.json();
      if (result.success && isMounted.current) {
        setData(result.data);
        setPreview(previewData(result.data, 10));
        setStats(getDataStats(result.data));
        logger.info('Sample data loaded', { rows: result.data.length });
      }
    } catch (error) {
      logger.error('Failed to load sample data', { error: error.message });
    }
  };

  const handleSort = () => {
    if (!sortField) return;
    const sorted = sortData(data, sortField, sortDirection);
    if (isMounted.current) {
      setData(sorted);
      setPreview(previewData(sorted, 10));
      logger.info('Data sorted', { field: sortField, direction: sortDirection });
    }
  };

  const handleAggregate = () => {
    if (!aggregateField) return;
    const agg = aggregateData(data, aggregateField);
    if (isMounted.current) {
      setAggregated(agg);
      logger.info('Data aggregated', { field: aggregateField, groups: Object.keys(agg).length });
    }
  };

  return (
    <div style={containerStyle}>
      <Sidebar currentPage="/inspector" />
      <div style={mainContentStyle}>
        <header style={headerStyle}>
          <h1 style={titleStyle}>Block Inspector</h1>
          <p style={subtitleStyle}>Preview, sort, and aggregate data</p>
        </header>

        <div style={contentStyle}>
          <section style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Data Statistics</h2>
            {stats && (
              <div style={statsGridStyle}>
                <div style={statCardStyle}>
                  <div style={statLabelStyle}>Total Rows</div>
                  <div style={statValueStyle}>{stats.count}</div>
                </div>
                <div style={statCardStyle}>
                  <div style={statLabelStyle}>Fields</div>
                  <div style={statValueStyle}>{stats.fields.length}</div>
                </div>
              </div>
            )}
          </section>

          <section style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Sort Data</h2>
            <div style={controlsStyle}>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                style={selectStyle}
              >
                <option value="">Select field...</option>
                {stats?.fields.map(field => (
                  <option key={field} value={field}>{field}</option>
                ))}
              </select>
              <select
                value={sortDirection}
                onChange={(e) => setSortDirection(e.target.value)}
                style={selectStyle}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
              <button onClick={handleSort} style={buttonStyle}>
                Sort
              </button>
            </div>
          </section>

          <section style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Aggregate Data</h2>
            <div style={controlsStyle}>
              <select
                value={aggregateField}
                onChange={(e) => setAggregateField(e.target.value)}
                style={selectStyle}
              >
                <option value="">Select field...</option>
                {stats?.fields.map(field => (
                  <option key={field} value={field}>{field}</option>
                ))}
              </select>
              <button onClick={handleAggregate} style={buttonStyle}>
                Aggregate
              </button>
            </div>
            {aggregated && (
              <div style={aggregatedStyle}>
                {Object.entries(aggregated).map(([key, value]) => (
                  <div key={key} style={groupStyle}>
                    <strong>{key}:</strong> {value.count} items
                  </div>
                ))}
              </div>
            )}
          </section>

          <section style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Data Preview (10 rows)</h2>
            <div style={tableContainerStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    {stats?.fields.slice(0, 5).map(field => (
                      <th key={field} style={thStyle}>{field}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, idx) => (
                    <tr key={idx}>
                      {stats?.fields.slice(0, 5).map(field => (
                        <td key={field} style={tdStyle}>
                          {typeof row[field] === 'object' 
                            ? JSON.stringify(row[field]).slice(0, 50) 
                            : String(row[field] || '').slice(0, 50)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

const containerStyle = {
  display: 'flex',
  minHeight: '100vh',
  background: '#0b1120',
  color: '#f8fafc',
  fontFamily: 'Inter, sans-serif'
};

const mainContentStyle = {
  flex: 1,
  marginLeft: 240,
  padding: '24px 32px'
};

const headerStyle = {
  marginBottom: 32
};

const titleStyle = {
  margin: 0,
  fontSize: 32,
  fontWeight: 700,
  color: '#f8fafc'
};

const subtitleStyle = {
  margin: '8px 0 0',
  fontSize: 16,
  color: '#94a3b8'
};

const contentStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 24
};

const sectionStyle = {
  background: '#111c33',
  borderRadius: 16,
  padding: 24,
  border: '1px solid rgba(56,189,248,0.25)'
};

const sectionTitleStyle = {
  margin: '0 0 16px',
  fontSize: 20,
  fontWeight: 700,
  color: '#f8fafc'
};

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 16
};

const statCardStyle = {
  background: '#0f172a',
  padding: 16,
  borderRadius: 12,
  border: '1px solid rgba(56,189,248,0.2)'
};

const statLabelStyle = {
  fontSize: 12,
  color: '#94a3b8',
  marginBottom: 8
};

const statValueStyle = {
  fontSize: 24,
  fontWeight: 700,
  color: '#38bdf8'
};

const controlsStyle = {
  display: 'flex',
  gap: 12,
  alignItems: 'center'
};

const selectStyle = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid rgba(56,189,248,0.3)',
  background: '#0f172a',
  color: '#f8fafc',
  fontSize: 14
};

const buttonStyle = {
  padding: '8px 16px',
  borderRadius: 8,
  border: 'none',
  background: 'linear-gradient(135deg,#38bdf8,#0ea5e9)',
  color: '#0b1120',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  minWidth: 120,
  minHeight: 36
};

const aggregatedStyle = {
  marginTop: 16,
  padding: 16,
  background: '#0f172a',
  borderRadius: 12,
  maxHeight: 300,
  overflowY: 'auto'
};

const groupStyle = {
  padding: '8px 0',
  borderBottom: '1px solid rgba(56,189,248,0.1)',
  color: '#cbd5f5'
};

const tableContainerStyle = {
  overflowX: 'auto',
  marginTop: 16
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 13
};

const thStyle = {
  padding: '12px 16px',
  textAlign: 'left',
  fontWeight: 600,
  color: '#94a3b8',
  borderBottom: '1px solid rgba(56,189,248,0.2)',
  textTransform: 'uppercase',
  fontSize: 12
};

const tdStyle = {
  padding: '12px 16px',
  borderBottom: '1px solid rgba(56,189,248,0.08)',
  color: '#e2e8f0'
};

