import Link from 'next/link';
import { loadQuotes } from '../src/lib/quotes';
import { detectMapping } from '../lib/normalize';

export default function MappingScreen({ rawData, mapping }) {
  const headers = Object.keys(rawData[0] || {});

  return (
    <main style={pageStyle}>
      <header style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 32 }}>🧭 Шаг 2 — Настройка маппинга</h1>
          <p style={{ color: '#94a3b8' }}>Показываем, как система автоматически сопоставляет колонки и позволяет их изменить.</p>
        </div>
        <Link href="/" style={{ color: '#38bdf8', textDecoration: 'none' }}>← Назад</Link>
      </header>

      <section style={card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Целевая колонка</th>
              <th style={th}>Автоопределение</th>
              <th style={th}>Выбрать вручную</th>
              <th style={th}>Пример значения</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(mapping).map(([target, source]) => (
              <tr key={target}>
                <td style={td}>{target}</td>
                <td style={td}>{source}</td>
                <td style={td}>
                  <select defaultValue={source} style={selectStyle}>
                    {headers.map((header) => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </td>
                <td style={td}>{String(rawData[0]?.[source] ?? '—')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer style={{ marginTop: 24, display: 'flex', gap: 12 }}>
        <Link href="/preview" style={primaryButton}>Продолжить ➜ Предпросмотр</Link>
        <Link href="/" style={secondaryButton}>Назад к загрузке</Link>
      </footer>
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

  return {
    props: {
      rawData,
      mapping
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

const th = {
  textAlign: 'left',
  padding: '12px 16px',
  textTransform: 'uppercase',
  fontSize: 12,
  color: '#94a3b8',
  borderBottom: '1px solid rgba(148,163,184,0.2)'
};

const td = {
  padding: '12px 16px',
  borderBottom: '1px solid rgba(148,163,184,0.08)',
  color: '#e2e8f0'
};

const selectStyle = {
  background: '#0b1120',
  color: '#e2e8f0',
  border: '1px solid rgba(56,189,248,0.3)',
  borderRadius: 8,
  padding: '6px 10px'
};

const primaryButton = {
  padding: '10px 18px',
  borderRadius: 12,
  background: 'linear-gradient(135deg,#38bdf8,#0ea5e9)',
  color: '#0b1120',
  fontWeight: 700,
  textDecoration: 'none'
};

const secondaryButton = {
  padding: '10px 18px',
  borderRadius: 12,
  background: '#1d293a',
  border: '1px solid rgba(56,189,248,0.3)',
  color: '#e2e8f0',
  fontWeight: 600,
  textDecoration: 'none'
};

