import Link from 'next/link';
import { loadQuotes } from '../src/lib/quotes';
import { detectMapping, normalizeDataset } from '../lib/normalize';

const container = {
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

export default function DataFormatter({ rawData, mapping, normalized, sourceUrl }) {
  return (
    <main style={container}>
      <header style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 36, margin: 0 }}>🧹 Data Formatter / Normalizer</h1>
        <p style={{ color: '#94a3b8', marginTop: 8 }}>
          Proof-of-Concept: парсим реальные данные из <a href={sourceUrl} style={{ color: '#38bdf8' }}>{sourceUrl}</a>, детектим маппинг и показываем нормализацию.
        </p>
      </header>

      <nav style={{ marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link href="/" style={pill('#38bdf8', '#0b1120')}>Шаг 1 — Загрузка данных</Link>
        <Link href="/mapping" style={pill('#0ea5e9', '#0b1120')}>Шаг 2 — Настройка маппинга</Link>
        <Link href="/preview" style={pill('#f97316', '#0b1120')}>Шаг 3 — Просмотр и экспорт</Link>
      </nav>

      <section style={{ ...card, marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>🔗 Источник данных</h2>
        <p style={{ color: '#94a3b8' }}>
          {sourceUrl}
        </p>
        <pre style={{ margin: 0, background: '#11162a', borderRadius: 12, padding: 16, overflowX: 'auto', maxHeight: 220 }}>
          {JSON.stringify(rawData.slice(0, 3), null, 2)}
        </pre>
      </section>

      <section style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <article style={card}>
          <h3 style={{ marginTop: 0 }}>🤖 Автомаппинг</h3>
          <pre style={{ margin: 0, background: '#11162a', borderRadius: 12, padding: 16, overflowX: 'auto' }}>
            {JSON.stringify(mapping, null, 2)}
          </pre>
        </article>
        <article style={card}>
          <h3 style={{ marginTop: 0 }}>✅ Пример нормализованной записи</h3>
          <pre style={{ margin: 0, background: '#11162a', borderRadius: 12, padding: 16, overflowX: 'auto' }}>
            {JSON.stringify(normalized[0], null, 2)}
          </pre>
        </article>
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
      rawData,
      mapping,
      normalized,
      sourceUrl: process.env.QUOTES_API_URL || 'http://quotes.toscrape.com/'
    }
  };
}

function pill(bg, color) {
  return {
    padding: '8px 16px',
    borderRadius: 999,
    background: bg,
    color,
    fontWeight: 600,
    textDecoration: 'none'
  };
}
