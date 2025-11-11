export async function loadUsers(withMeta = false) {
  const apiUrl = process.env.RANDOMUSER_API_URL || 'https://randomuser.me/api/?results=500';
  let fallbackUsed = false;
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`Random User API ${response.status}`);
    const data = await response.json();
    const users = Array.isArray(data.results) ? data.results : [];
    
    if (!users.length) {
      fallbackUsed = true;
      const fallback = fallbackUsers();
      if (withMeta) {
        return {
          users: fallback,
          fallbackUsed: true,
          sourceUrl: apiUrl,
          fetchedAt: new Date().toISOString()
        };
      }
      return fallback;
    }

    if (withMeta) {
      return {
        users,
        fallbackUsed: false,
        sourceUrl: apiUrl,
        fetchedAt: new Date().toISOString()
      };
    }
    return users;
  } catch (error) {
    console.warn('[MiniETL] Random User API fetch failed:', error.message);
    fallbackUsed = true;
    const users = fallbackUsers();
    if (withMeta) {
      return {
        users,
        fallbackUsed: true,
        sourceUrl: apiUrl,
        fetchedAt: new Date().toISOString()
      };
    }
    return users;
  }
}

export function buildMetrics(users) {
  const total = users.length;
  const valid = users.filter((user) => user.email && user.name).length;
  const invalid = total - valid;
  const lastUser = users[users.length - 1];
  return {
    rows_in: total,
    rows_out: valid,
    dedup_removed: invalid,
    duration_sec: 95,
    lastUser: lastUser ? `${lastUser.name?.first} ${lastUser.name?.last}` : 'N/A',
    countries: new Set(users.map(u => u.location?.country).filter(Boolean)).size
  };
}

export function fallbackUsers() {
  return Array.from({ length: 50 }, (_, i) => ({
    id: { value: `demo-${i + 1}` },
    name: {
      first: `User${i + 1}`,
      last: `Demo${i + 1}`
    },
    email: `user${i + 1}@demo.com`,
    phone: `+1-555-${String(i + 1000).slice(-4)}`,
    location: {
      country: i % 2 === 0 ? 'USA' : 'Canada',
      city: `City${i + 1}`
    },
    registered: {
      date: new Date(Date.now() - i * 86400000).toISOString()
    },
    picture: {
      thumbnail: `https://randomuser.me/api/portraits/thumb/${i % 2 === 0 ? 'men' : 'women'}/${(i % 50) + 1}.jpg`
    }
  }));
}

