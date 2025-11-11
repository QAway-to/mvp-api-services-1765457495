import Link from 'next/link';
import etlFallback from '../src/mock-data/etl.json';
import { loadLaunches, buildMetrics } from '../src/lib/spacex';

const container = {
  fontFamily: 'Inter, sans-serif',
  padding: '24px 32px',
  background: '#0b1120',
  color: '#f8fafc',
  minHeight: '100vh'
};

const card = {
  background: '#111c33',
  borderRadius: 16,
  padding: 24,
  marginBottom: 24,
  border: '1px solid rgba(56,189,248,0.25)',
  boxShadow: '0 20px 28px rgba(8, 47, 73, 0.45)'
};

export default function MiniETL({ metrics, launches }) {
  return (
    <main style={container}>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 36, margin: 0 }}>🔄 Mini‑ETL Pipeline</h1>
        <p style={{ color: '#94a3b8', marginTop: 8 }}>
          Proof-of-Concept: вытягиваем реальные данные из SpaceX API, прогоняем через шаги Extract → Transform → Load и показываем метрики.
        </p>
      </header>

      <section style={{ ...card, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {etlFallback.pipeline.map((step, idx) => (
          <div
            key={step}
            style={{
              padding: '10px 18px',
              borderRadius: 12,
              background: idx === 0 ? '#38bdf8' : idx === 1 ? '#0ea5e9' : '#0284c7',
              color: '#0b1120',
              fontWeight: 700
            }}
          >
            {idx + 1}. {step.toUpperCase()}
          </div>
        ))}
      </section>

      <section style={{ ...card }}>
        <h2 style={{ marginTop: 0 }}>📊 Metrics</h2>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <Metric label="Rows in (launches fetched)" value={metrics.rows_in} />
          <Metric label="Rows out (successful)" value={metrics.rows_out} />
          <Metric label="Removed (failed)" value={metrics.dedup_removed} />
          <Metric label="Upcoming launches" value={metrics.upcoming} />
        </div>
      </section>

      <section style={{ ...card }}>
        <h2 style={{ marginTop: 0 }}>📝 Logs</h2>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.6, color: '#cbd5f5' }}>
          <li>Extract → получено {metrics.rows_in} запусков с SpaceX API</li>
          <li>Transform → оставлено {metrics.rows_out} успешных миссий</li>
          <li>Load → загружено в аналитическое хранилище (демо)</li>
        </ul>
        <p style={{ color: '#94a3b8', marginTop: 12 }}>
          Посмотреть подробный аналитический отчёт можно на вкладке{' '}
          <Link href="/analytics" style={{ color: '#38bdf8' }}>Analytics</Link>.
        </p>
      </section>

      <section style={{ ...card, marginTop: 24 }}>
        <h2 style={{ marginTop: 0 }}>🚀 Последние миссии</h2>
        <p style={{ color: '#94a3b8' }}>
          Тянем данные напрямую с публичного SpaceX API. Нажмите на миссию, чтобы раскрыть детальную карточку.
        </p>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#cbd5f5', lineHeight: 1.7 }}>
          {launches.slice(-5).reverse().map((launch) => (
            <li key={launch.id}>
              <Link href={`/launch/${launch.id}`} style={{ color: '#38bdf8', textDecoration: 'none' }}>
                {launch.name}
              </Link>{' '}
              · {new Date(launch.date_utc).toLocaleString()} · {launch.success ? '✅ Success' : launch.upcoming ? '🕒 Upcoming' : '⚠️ Failed'}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ ...card, marginTop: 24 }}>
        <h2 style={{ marginTop: 0 }}>⚙️ Управление</h2>
        <p style={{ color: '#94a3b8' }}>
          Кнопки ниже демонстрируют перезапуск/откат. В проде интеграция с Airflow, Prefect, dbt Cloud.
        </p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <PrimaryButton>Перезапустить конвейер</PrimaryButton>
          <SecondaryButton>Посмотреть исходный файл</SecondaryButton>
          <SecondaryButton>Экспортировать отчёт</SecondaryButton>
        </div>
      </section>
    </main>
  );
}

export async function getServerSideProps() {
  const launches = await loadLaunches();
  const metrics = launches.length ? buildMetrics(launches) : etlFallback.metrics;

  return {
    props: {
      metrics,
      launches
    }
  };
}

function Metric({ label, value }) {
  return (
    <div style={{ background: '#0f172a', borderRadius: 12, padding: 16 }}>
      <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>{label}</p>
      <p style={{ margin: '6px 0 0', fontSize: 24, fontWeight: 700 }}>{value}</p>
    </div>
  );
}

function PrimaryButton({ children }) {
  return (
    <button
      style={{
        padding: '10px 18px',
        borderRadius: 12,
        background: 'linear-gradient(135deg,#38bdf8,#0ea5e9)',
        border: 'none',
        color: '#0b1120',
        fontWeight: 700,
        cursor: 'pointer'
      }}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children }) {
  return (
    <button
      style={{
        padding: '10px 18px',
        borderRadius: 12,
        background: '#1d293a',
        border: '1px solid rgba(56,189,248,0.3)',
        color: '#e2e8f0',
        fontWeight: 600,
        cursor: 'pointer'
      }}
    >
      {children}
    </button>
  );
}

