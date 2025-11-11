import Link from 'next/link';
import fallback from '../src/mock-data/prices.json';

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

export default function PriceStockParser({ products, alerts, sourceUrl }) {
  return (
    <main style={container}>
      <header style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 36, margin: 0 }}>🛒 Price & Stock Parser</h1>
        <p style={{ color: '#94a3b8', marginTop: 8 }}>
          Proof-of-Concept: данные из <a href={sourceUrl} style={{ color: '#38bdf8' }}>{sourceUrl}</a>, автоматическое построение SKU-аналитики и переход к карточке товара.
        </p>
      </header>

      <section style={{ marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ padding: '6px 14px', borderRadius: 999, background: '#1d4ed8', fontWeight: 600 }}>
          Продуктов: {products.length}
        </span>
        <span style={{ padding: '6px 14px', borderRadius: 999, background: '#0ea5e9', fontWeight: 600 }}>
          Средняя цена: {avgPrice(products).toFixed(2)} $
        </span>
        <span style={{ padding: '6px 14px', borderRadius: 999, background: '#22d3ee', fontWeight: 600 }}>
          Alerts активны: {alerts.length}
        </span>
      </section>

      <section style={{ background: '#111c33', borderRadius: 16, padding: 24, boxShadow: '0 20px 35px rgba(15, 23, 42, 0.35)' }}>
        <h2 style={{ marginTop: 0, fontSize: 22 }}>📊 Лента товаров</h2>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={headerCell}>SKU</th>
              <th style={headerCell}>Product</th>
              <th style={headerCell}>Price</th>
              <th style={headerCell}>Category</th>
              <th style={headerCell}>Rating</th>
              <th style={headerCell}></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} style={{ background: '#1f2943', borderRadius: 12 }}>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{product.sku}</td>
                <td style={{ padding: '12px 16px' }}>{product.title}</td>
                <td style={{ padding: '12px 16px' }}>{product.price.toFixed(2)} $</td>
                <td style={{ padding: '12px 16px' }}>{product.category}</td>
                <td style={{ padding: '12px 16px' }}>{product.rating.rate} / 5</td>
                <td style={{ padding: '12px 16px' }}>
                  <Link href={`/product/${product.id}`} style={{ color: '#38bdf8', textDecoration: 'none' }}>
                    Детали →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ marginTop: 32, background: '#131b2f', borderRadius: 16, padding: 24, border: '1px solid rgba(59,130,246,0.2)' }}>
        <h2 style={{ marginTop: 0 }}>🚨 Alerts (demo)</h2>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#cbd5f5' }}>
          {alerts.map((alert) => (
            <li key={alert.sku}>
              SKU {alert.sku}: {alert.rule} → канал: {alert.channel}
            </li>
          ))}
        </ul>
        <p style={{ color: '#94a3b8', marginTop: 12 }}>
          В продовой версии интегрируем Slack/Telegram уведомления, cron-джобы и аналитику по изменениям.
        </p>
      </section>
    </main>
  );
}

function avgPrice(products) {
  if (!products.length) return 0;
  return products.reduce((sum, item) => sum + item.price, 0) / products.length;
}

export async function getServerSideProps() {
  const apiUrl = process.env.FAKESTORE_API_URL || 'https://fakestoreapi.com/products';
  let payload = [];

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`FakeStore responded with ${response.status}`);
    payload = await response.json();
  } catch (error) {
    console.warn('[PriceStockParser] Using fallback data:', error.message);
    payload = fallback.records.map((record, idx) => ({
      id: idx + 1,
      sku: record.sku,
      title: `Demo product ${record.sku}`,
      price: record.price,
      category: record.site,
      rating: { rate: 4.1, count: 120 },
      description: 'Fallback item description',
      image: 'https://via.placeholder.com/200'
    }));
  }

  const products = payload.map((product) => ({
    id: product.id,
    sku: product.sku || `SKU-${product.id}`,
    title: product.title,
    price: Number(product.price || 0),
    category: product.category || 'general',
    rating: product.rating || { rate: 0, count: 0 },
    description: product.description || '',
    image: product.image || 'https://via.placeholder.com/200',
    raw: product
  }));

  return {
    props: {
      products,
      alerts: fallback.alerts,
      sourceUrl: apiUrl
    }
  };
}
