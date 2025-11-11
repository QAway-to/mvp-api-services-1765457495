import Link from 'next/link';
import { loadUsers } from '../src/lib/randomuser';

export default function Analytics({ users }) {
  return (
    <main style={container}>
      <header style={{ marginBottom: 24 }}>
        <Link href="/" style={{ color: '#38bdf8', textDecoration: 'none' }}>← Назад</Link>
        <h1 style={{ margin: '12px 0 0', fontSize: 32 }}>📈 Analytics — Users Data</h1>
        <p style={{ color: '#94a3b8', marginTop: 6 }}>Демонстрация шага Transform: агрегируем данные перед загрузкой.</p>
      </header>

      <section style={card}>
        <h2 style={{ marginTop: 0 }}>Users overview</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Name</th>
              <th style={th}>Email</th>
              <th style={th}>Country</th>
              <th style={th}>Registered</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(users) && users.length > 0 ? (
              users.slice(0, 50).map((user, idx) => (
                <tr key={user?.id?.value || user?.login?.uuid || `user-${idx}`}>
                  <td style={td}>
                    {user?.name?.first} {user?.name?.last}
                  </td>
                  <td style={td}>{user?.email || 'N/A'}</td>
                  <td style={td}>{user?.location?.country || 'N/A'}</td>
                  <td style={td}>{user?.registered?.date ? new Date(user.registered.date).toLocaleString() : 'N/A'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ ...td, textAlign: 'center', color: '#94a3b8' }}>Нет данных для отображения</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section style={card}>
        <h2 style={{ marginTop: 0 }}>Что будет в полной версии</h2>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7, color: '#94a3b8' }}>
          <li>Интеграция с ClickHouse / BigQuery для аналитики и виджетов</li>
          <li>Задачи на Airflow/Prefect для регулярного обновления данных</li>
          <li>Инкрементальная загрузка + дедупликация на уровне dbt</li>
        </ul>
      </section>
    </main>
  );
}

export async function getServerSideProps() {
  try {
    const users = await loadUsers();
    return {
      props: {
        users: Array.isArray(users) ? users : []
      }
    };
  } catch (error) {
    console.error('[Analytics] getServerSideProps error:', error);
    return {
      props: {
        users: []
      }
    };
  }
}

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
  border: '1px solid rgba(56,189,248,0.25)',
  boxShadow: '0 20px 28px rgba(8, 47, 73, 0.45)',
  marginBottom: 24
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

