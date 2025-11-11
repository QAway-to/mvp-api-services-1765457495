import Link from 'next/link';
import { loadArticles } from '../../src/lib/news';

export default function ArticleDetail({ article, query }) {
  return (
    <main style={{ fontFamily: 'Inter,sans-serif', padding: '24px 32px', background: '#0f172a', color: '#f8fafc', minHeight: '100vh' }}>
      <header style={{ marginBottom: 24 }}>
        <Link href={{ pathname: '/', query: { q: query } }} style={{ color: '#38bdf8', textDecoration: 'none' }}>
          ← Назад к дайджесту
        </Link>
        <h1 style={{ fontSize: 32, margin: '12px 0 0' }}>{article.title}</h1>
        <p style={{ color: '#94a3b8', marginTop: 6 }}>
          {article.source?.name || 'Unknown'} · {new Date(article.publishedAt).toLocaleString()}
        </p>
      </header>

      <section style={{ display: 'grid', gap: 24, background: '#1e2134', borderRadius: 16, padding: 24, border: '1px solid rgba(14,165,233,0.2)' }}>
        <div>
          <h2 style={{ margin: '0 0 10px' }}>🧾 Summary</h2>
          <p style={{ margin: 0, color: '#cbd5f5' }}>{article.summary}</p>
        </div>

        <div>
          <h2 style={{ margin: '0 0 10px' }}>🔍 Sentiment score</h2>
          <p style={{ margin: 0 }}>
            {article.sentiment.label} ({article.sentiment.score})
          </p>
          <p style={{ margin: '6px 0 0', color: '#94a3b8' }}>
            Простая эвристика: считаем количество позитивных и негативных слов. В полной версии подключим NLU модели.
          </p>
        </div>

        <div>
          <h2 style={{ margin: '0 0 10px' }}>📌 Action items</h2>
          <ul style={{ margin: 0, paddingLeft: 18, color: '#cbd5f5', lineHeight: 1.6 }}>
            <li>Завести тикет в CRM → квалифицировать упоминание</li>
            <li>Настроить Google Alerts / Slack webhook для будущих упоминаний</li>
            <li>Сформировать ответ PR-команде при негативной тональности</li>
          </ul>
        </div>

        <div>
          <a
            href={article.url}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 18px',
              borderRadius: 12,
              background: 'linear-gradient(135deg,#38bdf8,#0ea5e9)',
              color: '#0f172a',
              fontWeight: 700,
              textDecoration: 'none'
            }}
          >
            Перейти к публикации ↗
          </a>
        </div>
      </section>

      <section style={{ marginTop: 32, background: '#131b2f', borderRadius: 16, padding: 24, border: '1px solid rgba(59,130,246,0.2)' }}>
        <h2 style={{ marginTop: 0 }}>🚀 Что предлагается в Full версии</h2>
        <ul style={{ margin: 0, paddingLeft: 18, color: '#94a3b8', lineHeight: 1.7 }}>
          <li>Автоклассификация (PR / лид / спам) и маршрутизация в CRM</li>
          <li>Настройка ручных и автоматических ответов (email, Telegram, Slack)</li>
          <li>Построение недельного/месячного отчёта по охвату и тональности</li>
        </ul>
      </section>
    </main>
  );
}

export async function getServerSideProps({ params, query }) {
  const requestedQuery = query.q || 'AI startup funding';
  const idx = Number(params.idx);
  const { articles } = await loadArticles(requestedQuery);
  const article = articles[idx] || articles[0];

  return {
    props: {
      article,
      query: requestedQuery
    }
  };
}

