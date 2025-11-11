import data from '../src/mock-data/mentions.json';

export default function BrandMentionMonitor() {
  return (
    <main style={{ fontFamily: 'Inter, sans-serif', padding: '24px 32px', background: '#0f172a', color: '#f8fafc', minHeight: '100vh' }}>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 36, margin: 0 }}>📈 Brand Mention Monitor</h1>
        <p style={{ marginTop: 8, color: '#94a3b8' }}>Отслеживание упоминаний бренда в режиме демо. Данные безопасные и моковые.</p>
      </header>

      <section style={{ background: '#1e293b', borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: '0 20px 35px rgba(15, 23, 42, 0.4)' }}>
        <h2 style={{ marginTop: 0, marginBottom: 12, fontSize: 22 }}>🔍 Текущие фильтры</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ padding: '6px 14px', borderRadius: 999, background: '#0ea5e9', color: '#0f172a', fontWeight: 600 }}>Ключевые слова: {data.query}</span>
          <span style={{ padding: '6px 14px', borderRadius: 999, background: '#38bdf8', color: '#0f172a', fontWeight: 600 }}>Источники: RSS · Blogs · Forums</span>
          <span style={{ padding: '6px 14px', borderRadius: 999, background: '#bae6fd', color: '#0f172a', fontWeight: 600 }}>
            Последний дайджест: {new Date(data.digest_ts).toLocaleString()}
          </span>
        </div>
      </section>

      <section style={{ display: 'grid', gap: 20 }}>
        {data.results.map((item, idx) => (
          <article key={idx} style={{ background: '#1e2134', borderRadius: 16, padding: 24, display: 'grid', gap: 12, border: '1px solid rgba(14,165,233,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
              <span style={{ padding: '6px 12px', borderRadius: 8, background: '#0ea5e91a', color: '#38bdf8', fontWeight: 600 }}>{item.source}</span>
              <span style={{ textTransform: 'uppercase', fontSize: 12, color: '#94a3b8' }}>{item.sentiment}</span>
            </div>
            <a href={item.url} target="_blank" rel="noreferrer" style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 600, textDecoration: 'none' }}>
              {item.title}
            </a>
            <p style={{ margin: 0, color: '#cbd5f5' }}>{item.snippet}</p>
            <button style={{
              justifySelf: 'flex-start',
              padding: '10px 18px',
              borderRadius: 12,
              background: 'linear-gradient(135deg,#38bdf8,#0ea5e9)',
              border: 'none',
              color: '#0f172a',
              fontWeight: 700,
              cursor: 'pointer'
            }}>
              Добавить в избранное
            </button>
          </article>
        ))}
      </section>

      <section style={{ marginTop: 32, background: '#131b2f', borderRadius: 16, padding: 24, border: '1px solid rgba(59,130,246,0.2)' }}>
        <h2 style={{ marginTop: 0, fontSize: 20 }}>📤 Экспорт дайджеста</h2>
        <p style={{ color: '#94a3b8', marginBottom: 16 }}>В реальной версии экспортируем PDF/Slack/Email с метриками и ссылками.</p>
        <button style={{
          padding: '10px 18px',
          borderRadius: 12,
          background: '#38bdf8',
          border: 'none',
          color: '#0f172a',
          fontWeight: 700,
          cursor: 'pointer'
        }}>
          Скачать пример дайджеста
        </button>
      </section>
    </main>
  );
}

