import Link from 'next/link';
import { fetchQuoteOfTheDay, loadArticles, sentimentStats } from '../src/lib/news';

export default function BrandMentionMonitor({ query, generatedAt, articles, quote, stats }) {
  return (
    <main style={{ fontFamily: 'Inter, sans-serif', padding: '24px 32px', background: '#0f172a', color: '#f8fafc', minHeight: '100vh' }}>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 36, margin: 0 }}>📈 Brand Mention Monitor</h1>
        <p style={{ marginTop: 8, color: '#94a3b8' }}>
          Proof-of-Concept: живая интеграция с NewsAPI и быстрый дайджест упоминаний бренда.
        </p>
      </header>

      <section style={{ background: '#1e293b', borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: '0 20px 35px rgba(15, 23, 42, 0.4)' }}>
        <h2 style={{ marginTop: 0, marginBottom: 12, fontSize: 22 }}>🔍 Текущие фильтры</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ padding: '6px 14px', borderRadius: 999, background: '#0ea5e9', color: '#0f172a', fontWeight: 600 }}>Ключевые слова: {query}</span>
          <span style={{ padding: '6px 14px', borderRadius: 999, background: '#38bdf8', color: '#0f172a', fontWeight: 600 }}>Источники: NewsAPI (web)</span>
          <span style={{ padding: '6px 14px', borderRadius: 999, background: '#bae6fd', color: '#0f172a', fontWeight: 600 }}>
            Последний запрос: {new Date(generatedAt).toLocaleString()}
          </span>
        </div>
      </section>

      <section style={{ display: 'grid', gap: 18 }}>
        {articles.map((item, idx) => (
          <article key={item.hash} style={{ background: '#1e2134', borderRadius: 16, padding: 24, display: 'grid', gap: 14, border: '1px solid rgba(14,165,233,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
              <span style={{ padding: '6px 12px', borderRadius: 8, background: '#0ea5e91a', color: '#38bdf8', fontWeight: 600 }}>{item.source}</span>
              <span style={{ textTransform: 'uppercase', fontSize: 12, color: '#94a3b8' }}>{item.sentiment.label}</span>
            </div>
            <Link href={{ pathname: `/article/${idx}`, query: { q: query } }} style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 600, textDecoration: 'none' }}>
              {item.title}
            </Link>
            <p style={{ margin: 0, color: '#cbd5f5' }}>{item.summary}</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 18px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg,#38bdf8,#0ea5e9)',
                  color: '#0f172a',
                  fontWeight: 700,
                  textDecoration: 'none'
                }}
              >
                Читать источник ↗
              </a>
              <Link
                href={{ pathname: `/article/${idx}`, query: { q: query, view: 'digest' } }}
                style={{
                  padding: '10px 18px',
                  borderRadius: 12,
                  background: '#1d293a',
                  border: '1px solid rgba(56,189,248,0.3)',
                  color: '#e2e8f0',
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
              >
                Карточка кампании
              </Link>
            </div>
          </article>
        ))}
      </section>

      <section style={{ marginTop: 32, display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <article style={{ background: '#131b2f', borderRadius: 16, padding: 24, border: '1px solid rgba(59,130,246,0.2)' }}>
          <h3 style={{ marginTop: 0 }}>📊 Sentiment overview</h3>
          <ul style={{ margin: 0, paddingLeft: 18, color: '#cbd5f5' }}>
            {Object.entries(stats).map(([label, value]) => (
              <li key={label}>{label}: {value}</li>
            ))}
          </ul>
        </article>
        <article style={{ background: '#131b2f', borderRadius: 16, padding: 24, border: '1px solid rgba(59,130,246,0.2)' }}>
          <h3 style={{ marginTop: 0 }}>🧠 Inspiration</h3>
          <blockquote style={{ margin: 0, fontStyle: 'italic', color: '#e2e8f0' }}>
            “{quote.text}”
          </blockquote>
          <p style={{ marginTop: 12, color: '#94a3b8' }}>— {quote.author}</p>
        </article>
        <article style={{ background: '#131b2f', borderRadius: 16, padding: 24, border: '1px solid rgba(59,130,246,0.2)' }}>
          <h3 style={{ marginTop: 0 }}>🗂 Дайджесты</h3>
          <p style={{ color: '#94a3b8' }}>
            Историю дайджестов можно посмотреть на вкладке{' '}
            <Link href="/digest/history" style={{ color: '#38bdf8' }}>Digest History</Link>.
          </p>
        </article>
      </section>
    </main>
  );
}

export async function getServerSideProps({ query }) {
  const requestedQuery = query.q || 'AI startup funding';
  const { articles } = await loadArticles(requestedQuery);
  const quote = await fetchQuoteOfTheDay();

  return {
    props: {
      query: requestedQuery,
      generatedAt: new Date().toISOString(),
      articles,
      quote,
      stats: sentimentStats(articles)
    }
  };
}
