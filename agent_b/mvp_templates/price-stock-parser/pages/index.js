import data from '../src/mock-data/prices.json';

const container = {
  fontFamily: 'Inter, sans-serif',
  padding: '24px 32px',
  background: '#0f172a',
  color: '#f8fafc',
  minHeight: '100vh'
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'separate',
  borderSpacing: '0 12px'
};

const headerCell = {
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontSize: 12,
  color: '#94a3b8',
  padding: '10px 16px',
  textAlign: 'left'
};

export default function PriceStockParser() {
  return (
    <main style={container}>
      <header style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 36, margin: 0 }}>🛒 Price & Stock Parser</h1>
        <p style={{ color: '#94a3b8', marginTop: 8 }}>
          Моковая демо-версия мониторинга цен и наличия по SKU. В полной версии данные тянутся из маркетплейсов и CMS.
        </p>
      </header>

      <section style={{ marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {data.sku_list.map((sku) => (
          <span key={sku} style={{ padding: '6px 14px', borderRadius: 999, background: '#1d4ed8', fontWeight: 600 }}>
            SKU: {sku}
          </span>
        ))}
        <span style={{ padding: '6px 14px', borderRadius: 999, background: '#0ea5e9', fontWeight: 600 }}>
          Alerts configured: {data.alerts.length}
        </span>
      </section>

      <section style={{ background: '#111c33', borderRadius: 16, padding: 24, boxShadow: '0 20px 35px rgba(15, 23, 42, 0.35)' }}>
        <h2 style={{ marginTop: 0, fontSize: 22 }}>📊 Текущие данные</h2>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={headerCell}>SKU</th>
              <th style={headerCell}>Site</th>
              <th style={headerCell}>Price</th>
              <th style={headerCell}>Stock</th>
              <th style={headerCell}>Discount</th>
              <th style={headerCell}>Updated</th>
            </tr>
          </thead>
          <tbody>
            {data.records.map((row, idx) => (
              <tr key={idx} style={{ background: '#1f2943', borderRadius: 12 }}>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{row.sku}</td>
                <td style={{ padding: '12px 16px' }}>{row.site}</td>
                <td style={{ padding: '12px 16px' }}>{row.price.toFixed(2)} {row.currency}</td>
                <td style={{ padding: '12px 16px' }}>{row.in_stock ? '✅ In stock' : '❌ Out of stock'}</td>
                <td style={{ padding: '12px 16px' }}>{row.discount ? `${row.discount}%` : '-'}</td>
                <td style={{ padding: '12px 16px' }}>{new Date(row.ts).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ marginTop: 32, background: '#131b2f', borderRadius: 16, padding: 24, border: '1px solid rgba(59,130,246,0.2)' }}>
        <h2 style={{ marginTop: 0 }}>🚨 Alerts</h2>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#cbd5f5' }}>
          {data.alerts.map((alert, idx) => (
            <li key={idx}>
              {alert.sku}: {alert.rule} → канал: {alert.channel}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

