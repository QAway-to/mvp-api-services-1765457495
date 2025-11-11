import Link from 'next/link';
import { loadQuotes } from '../src/lib/quotes';
import { detectMapping, normalizeDataset } from '../lib/normalize';

export default function PreviewScreen({ normalized }) {
  return (
    <main style={pageStyle}>
      <header style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 32 }}>📤 Шаг 3 — Предпросмотр / экспорт</h1>
          <p style={{ color: '#94a3b8' }}>Показываем финальный набор данных. Кнопки экспортов — демо, в проде привяжем S3, Google Sheets, API.</p>
        </div>
        <Link href="/mapping" style={{ color: '#38bdf8', textDecoration: 'none' }}>← Назад</Link>
      </header>

      <section style={card}>
        <h2 style={{ marginTop: 0 }}>📄 Предпросмотр первых записей</h2>
        <pre style={{ margin: 0, background: '#11162a', borderRadius: 12, padding: 16, overflowX: 'auto', maxHeight: 260 }}>
          {JSON.stringify(normalized.slice(0, 5), null, 2)}
        </pre>
      </section>

      <section style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button style={primaryButton}>Экспорт CSV</button>
        <button style={primaryButton}>Отправить в Google Sheets</button>
        <button style={secondaryButton}>Создать webhook</button>
      </section>
    </main>
  );
}

export async function getServerSideProps() {
  const quotes = await loadQuotes();
  const rawData = quotes.map((quote) => ({
    text: quote.text,
    author: quote.author,
    tags: quote.tags
  }));
  const mapping = detectMapping(rawData[0]);
  const normalized = normalizeDataset(rawData, mapping);

  return {
    props: {
      normalized
    }
  };
}

const pageStyle = {
  fontFamily: 'Inter, sans-serif',
  padding: '24px 32px',
  background: '#0f172a',
  color: '#f8fafc',
  minHeight: '100vh'
};

const card = {
  background: '#1e1f33',
  borderRadius: 16,
  padding: 24,
  border: '1px solid rgba(59,130,246,0.2)',
  boxShadow: '0 20px 35px rgba(15, 23, 42, 0.35)'
};

const primaryButton = {
  padding: '10px 18px',
  borderRadius: 12,
  background: 'linear-gradient(135deg,#38bdf8,#0ea5e9)',
  border: 'none',
  color: '#0b1120',
  fontWeight: 700,
  cursor: 'pointer'
};

const secondaryButton = {
  padding: '10px 18px',
  borderRadius: 12,
  background: '#1d293a',
  border: '1px solid rgba(56,189,248,0.3)',
  color: '#e2e8f0',
  fontWeight: 600,
  cursor: 'pointer'
};

