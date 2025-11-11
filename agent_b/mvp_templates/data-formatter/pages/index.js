import demo from '../src/mock-data/sample.json';

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
  marginBottom: 24,
  border: '1px solid rgba(59,130,246,0.2)',
  boxShadow: '0 20px 35px rgba(15, 23, 42, 0.35)'
};

export default function DataFormatter() {
  return (
    <main style={container}>
      <header style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 36, margin: 0 }}>🧹 Data Formatter / Normalizer</h1>
        <p style={{ color: '#94a3b8', marginTop: 8 }}>
          Демонстрационная панель очистки и нормализации данных. Настоящие интеграции (Airbyte, Snowflake и т.д.)
          подключаются после оплаты.
        </p>
      </header>

      <section style={{ ...card, display: 'grid', gap: 16 }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>🔗 Mapping</h2>
        <pre style={{ margin: 0, background: '#11162a', borderRadius: 12, padding: 16, overflowX: 'auto' }}>
          {JSON.stringify(demo.mapping, null, 2)}
        </pre>
      </section>

      <section style={{ ...card, display: 'grid', gap: 16 }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>⚙️ Rules</h2>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {demo.rules.map((rule, idx) => (
            <li key={idx}>{rule}</li>
          ))}
        </ul>
      </section>

      <section style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <article style={card}>
          <h3 style={{ marginTop: 0 }}>📥 Sample Input</h3>
          <pre style={{ margin: 0, background: '#11162a', borderRadius: 12, padding: 16 }}>{JSON.stringify(demo.sample_in, null, 2)}</pre>
        </article>
        <article style={card}>
          <h3 style={{ marginTop: 0 }}>📤 Sample Output</h3>
          <pre style={{ margin: 0, background: '#11162a', borderRadius: 12, padding: 16 }}>{JSON.stringify(demo.sample_out, null, 2)}</pre>
        </article>
      </section>

      <section style={{ ...card }}>
        <h2 style={{ marginTop: 0 }}>📦 Экспорт</h2>
        <p style={{ color: '#cbd5f5' }}>
          В продающей версии добавляем экспорт в CSV, Google Sheets, REST API. Здесь демонстрационный блок показывает,
          что экспорт доступен и готов к подключению.
        </p>
        <button
          style={{
            padding: '10px 18px',
            borderRadius: 12,
            background: 'linear-gradient(135deg,#f97316,#fb923c)',
            border: 'none',
            color: '#0f172a',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Скачать пример отчёта
        </button>
      </section>
    </main>
  );
}

