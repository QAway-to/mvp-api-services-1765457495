import Link from 'next/link';
import fallback from '../../src/mock-data/prices.json';

export default function ProductPage({ product, sourceUrl }) {
  return (
    <main style={container}>
      <header style={{ marginBottom: 24 }}>
        <Link href="/" style={{ color: '#38bdf8', textDecoration: 'none' }}>← Назад к списку</Link>
        <h1 style={{ margin: '12px 0 0', fontSize: 34 }}>{product.title}</h1>
        <p style={{ color: '#94a3b8', marginTop: 6 }}>
          Источник данных: <a href={sourceUrl} style={{ color: '#38bdf8' }}>{sourceUrl}</a>
        </p>
      </header>

      <section style={card}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <img src={product.image} alt={product.title} style={{ width: 200, height: 200, objectFit: 'contain', background: '#0f172a', borderRadius: 16 }} />
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <h3 style={{ margin: 0 }}>💵 Цена</h3>
              <p style={{ margin: '6px 0 0', fontSize: 24, fontWeight: 700 }}>{product.price.toFixed(2)} $</p>
            </div>
            <div>
              <h3 style={{ margin: 0 }}>🏷 Категория</h3>
              <p style={{ margin: '6px 0 0' }}>{product.category}</p>
            </div>
            <div>
              <h3 style={{ margin: 0 }}>⭐️ Рейтинг</h3>
              <p style={{ margin: '6px 0 0' }}>{product.rating.rate} / 5 (отзывов: {product.rating.count})</p>
            </div>
          </div>
        </div>
        <div>
          <h3 style={{ marginTop: 24 }}>📝 Описание</h3>
          <p style={{ color: '#cbd5f5' }}>{product.description || 'Описание отсутствует в API.'}</p>
        </div>
      </section>

      <section style={{ ...card, marginTop: 24 }}>
        <h2 style={{ marginTop: 0 }}>📈 Что включаем в продовую версию</h2>
        <ul style={{ margin: 0, paddingLeft: 18, color: '#94a3b8', lineHeight: 1.7 }}>
          <li>История изменений цены (график, сравнение с конкурентами)</li>
          <li>Алерты по условиям (цена ниже X, появилось в наличии)</li>
          <li>Интеграция с CRM / таблицами для автоматического обновления</li>
        </ul>
      </section>
    </main>
  );
}

export async function getServerSideProps({ params }) {
  const apiUrl = process.env.FAKESTORE_API_URL || 'https://fakestoreapi.com/products';
  const id = params.id;
  let product = null;

  try {
    const response = await fetch(`${apiUrl}/${id}`);
    if (response.ok) {
      const payload = await response.json();
      product = normalizeProduct(payload);
    }
  } catch (error) {
    console.warn('[ProductPage] Using fallback item:', error.message);
  }

  if (!product) {
    const fallbackRecord = fallback.records.find((item) => String(item.sku).endsWith(id)) || fallback.records[0];
    product = normalizeProduct({
      id,
      title: `Demo product ${fallbackRecord.sku}`,
      price: fallbackRecord.price,
      category: fallbackRecord.site,
      description: 'Fallback product description',
      image: 'https://via.placeholder.com/200',
      rating: { rate: 4.1, count: 120 },
      sku: fallbackRecord.sku
    });
  }

  return {
    props: {
      product,
      sourceUrl: apiUrl
    }
  };
}

function normalizeProduct(product) {
  return {
    id: product.id,
    sku: product.sku || `SKU-${product.id}`,
    title: product.title || 'Неизвестный товар',
    price: Number(product.price || 0),
    category: product.category || 'general',
    description: product.description || '',
    image: product.image || 'https://via.placeholder.com/200',
    rating: product.rating || { rate: 0, count: 0 }
  };
}

const container = {
  fontFamily: 'Inter, sans-serif',
  padding: '24px 32px',
  background: '#0f172a',
  color: '#f8fafc',
  minHeight: '100vh'
};

const card = {
  background: '#111c33',
  borderRadius: 16,
  padding: 24,
  border: '1px solid rgba(59,130,246,0.2)',
  boxShadow: '0 20px 35px rgba(15, 23, 42, 0.35)'
};

