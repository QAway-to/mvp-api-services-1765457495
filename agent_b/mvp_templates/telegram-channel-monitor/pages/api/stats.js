import mockChannels from '../../mock-data/channels';
import mockRules from '../../mock-data/rules';
import mockMatches from '../../mock-data/matches';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const stats = {
    channels: {
      total: mockChannels.length,
      active: mockChannels.filter(ch => ch.is_active).length
    },
    messages: {
      total: 1250 // Mock value
    },
    rules: {
      total: mockRules.length,
      active: mockRules.filter(r => r.is_active).length
    },
    matches: {
      total: mockMatches.length,
      last_24h: mockMatches.filter(m => 
        new Date(m.detected_at) >= yesterday
      ).length
    }
  };

  return res.status(200).json(stats);
}

