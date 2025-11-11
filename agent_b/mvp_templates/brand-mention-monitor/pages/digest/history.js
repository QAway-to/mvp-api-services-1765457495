import digestFallback from '../../src/mock-data/mentions.json';
import { loadArticles } from '../../src/lib/news';

export default function DigestHistory({ digests }) {
  return (
    <main style={{ fontFamily: 'Inter,sans-serif', padding: '24px 32px', background: '#0f172a', color: '#f8fafc', minHeight: '100vh' }}>
      <header style={{ marginBottom: 24 }}>
        <a href="/" style={{ color: '#38bdf8', textDecoration: 'none' }}>← Назад</a>
        <h1 style={{ fontSize: 32, margin: '12px 0 0' }}>🧾 Saved digests</h1>
        <p style={{ color: '#94a3b8', marginTop: 6 }}>
          Пример сохранённого дайджеста (моковые данные). В полный продукт добавим хранение в базе + фильтры по датам.
        </p>
      </header>

      <section style={{ display: 'grid', gap: 16 }}>
        {digests.map((digest) => (
          <article key={digest.date} style={{ background: '#1d2338', borderRadius: 16, padding: 24, border: '1px solid rgba(14,165,233,0.2)' }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 22 }}>{digest.dateHuman}</h2>
            <ul style={{ margin: '12px 0 0', paddingLeft: 20, color: '#cbd5f5', lineHeight: 1.6 }}>
              {digest.items.map((item, idx) => (
                <li key={idx}>
                  {item.title} — <em>{item.source?.name || 'Unknown'}</em> ({item.sentiment.label})
                  <a href={item.url} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', marginLeft: 8 }}>перейти ↗</a>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </main>
  );
}

export async function getServerSideProps() {
  const { articles } = await loadArticles('brand monitoring');
  const dataset = articles.length ? articles : digestFallback.results.map((item) => ({
    title: item.title,
    source: { name: item.source },
    url: item.url,
    sentiment: { label: 'Neutral' },
    publishedAt: digestFallback.digest_ts
  }));

  const grouped = dataset.reduce((acc, item) => {
    const day = (item.publishedAt || '').slice(0, 10) || 'demo';
    if (!acc[day]) acc[day] = [];
    acc[day].push(item);
    return acc;
  }, {});

  const digests = Object.entries(grouped).map(([date, items]) => ({
    date,
    dateHuman: new Date(date).toLocaleDateString(),
    items
  }));

  return {
    props: {
      digests
    }
  };
}

