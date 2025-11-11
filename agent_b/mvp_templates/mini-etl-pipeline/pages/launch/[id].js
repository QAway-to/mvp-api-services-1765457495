import Link from 'next/link';
import { loadUsers, fallbackUsers } from '../../src/lib/randomuser';

export default function UserDetail({ user }) {
  if (!user) {
    return (
      <main style={container}>
        <header style={{ marginBottom: 24 }}>
          <Link href="/analytics" style={{ color: '#38bdf8', textDecoration: 'none' }}>← К аналитике</Link>
          <h1 style={{ margin: '12px 0 0', fontSize: 32 }}>Пользователь не найден</h1>
        </header>
      </main>
    );
  }

  return (
    <main style={container}>
      <header style={{ marginBottom: 24 }}>
        <Link href="/analytics" style={{ color: '#38bdf8', textDecoration: 'none' }}>← К аналитике</Link>
        <h1 style={{ margin: '12px 0 0', fontSize: 32 }}>{user?.name?.first} {user?.name?.last}</h1>
        <p style={{ color: '#94a3b8', marginTop: 6 }}>{user?.email || 'Email не указан'}</p>
      </header>

      <section style={card}>
        <h2 style={{ marginTop: 0 }}>Основные данные</h2>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Email: {user?.email || 'N/A'}</li>
          <li>Телефон: {user?.phone || 'N/A'}</li>
          <li>Страна: {user?.location?.country || 'N/A'}</li>
          <li>Город: {user?.location?.city || 'N/A'}</li>
          <li>Дата регистрации: {user?.registered?.date ? new Date(user.registered.date).toLocaleString() : 'N/A'}</li>
        </ul>
      </section>

      <section style={card}>
        <h2 style={{ marginTop: 0 }}>Дополнительная информация</h2>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {user?.picture?.thumbnail && (
            <img src={user.picture.thumbnail} alt="User avatar" style={{ width: 96, height: 96, borderRadius: '50%' }} />
          )}
          <div>
            <p style={{ color: '#cbd5f5', margin: 0 }}>ID: {user?.id?.value || user?.login?.uuid || 'N/A'}</p>
            <p style={{ color: '#cbd5f5', margin: '8px 0 0' }}>Пол: {user?.gender || 'N/A'}</p>
          </div>
        </div>
      </section>
    </main>
  );
}

export async function getServerSideProps({ params }) {
  try {
    const users = await loadUsers();
    const userArray = Array.isArray(users) ? users : [];
    let user = userArray.find((item) => {
      const itemId = item?.id?.value || item?.login?.uuid;
      return String(itemId) === String(params.id);
    });

    if (!user) {
      // Try fallback users
      const fallback = fallbackUsers();
      user = fallback.find((item) => {
        const itemId = item?.id?.value || item?.login?.uuid;
        return String(itemId) === String(params.id);
      });
    }

    if (!user) {
      return { notFound: true };
    }

    return {
      props: {
        user: {
          ...user,
          name: user?.name || { first: '', last: '' },
          location: user?.location || {},
          registered: user?.registered || {}
        }
      }
    };
  } catch (error) {
    console.error('[UserDetail] getServerSideProps error:', error);
    return { notFound: true };
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

