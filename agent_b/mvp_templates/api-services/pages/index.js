import Head from 'next/head';
import ApiCard from '../src/components/ApiCard';

export default function Home() {
  const apis = [
    {
      icon: '📚',
      title: 'Wayback Machine',
      description: 'Получение архивных снимков сайтов. Поиск по CDX API и загрузка HTML из архива.',
      href: '/wayback',
      status: 'ready',
    },
    {
      icon: '🔌',
      title: 'More APIs',
      description: 'Дополнительные интеграции будут добавлены здесь. Можно легко расширить шаблон новыми API.',
      href: null,
      status: 'coming',
    },
  ];

  return (
    <>
      <Head>
        <title>API Services Manager</title>
        <meta name="description" content="Manage integrations with external APIs" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <main className="page">
        <header className="page-header">
          <div>
            <h1>🔌 API Services Manager</h1>
            <p className="subtitle">
              Управление интеграциями с внешними API. Выберите API для тестирования и работы.
            </p>
          </div>
          <div className="status-badge status-info">
            DEMO VERSION
          </div>
        </header>

        <section>
          <div className="api-grid">
            {apis.map((api, index) => (
              <ApiCard
                key={index}
                icon={api.icon}
                title={api.title}
                description={api.description}
                href={api.href}
                status={api.status}
              />
            ))}
          </div>
        </section>

        <section className="card" style={{ marginTop: '48px' }}>
          <header className="card-header">
            <h2>📖 About This Template</h2>
          </header>
          <div style={{ lineHeight: '1.7', color: '#9ca3af' }}>
            <p>
              Этот шаблон предоставляет удобную структуру для работы с различными внешними API.
              Каждый API реализован как адаптер в директории <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>src/lib/adapters/</code>.
            </p>
            <p style={{ marginTop: '16px' }}>
              <strong>Структура:</strong>
            </p>
            <ul style={{ marginTop: '8px', paddingLeft: '24px' }}>
              <li>Адаптеры содержат всю логику работы с API</li>
              <li>API endpoints в <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>pages/api/</code></li>
              <li>UI компоненты для каждого API в <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>src/components/</code></li>
              <li>Легко добавлять новые API по аналогии с Wayback Machine</li>
            </ul>
          </div>
        </section>

        <footer className="page-footer">
          <p>API Services MVP - Manage integrations with external APIs</p>
        </footer>
      </main>
    </>
  );
}

