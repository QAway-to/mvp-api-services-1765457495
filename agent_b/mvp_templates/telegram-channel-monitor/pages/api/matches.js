import mockMatches from '../../mock-data/matches';

let matches = [...mockMatches];

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { channel_id, rule_id, limit = 100 } = req.query;
    
    let filtered = [...matches];
    
    if (channel_id) {
      filtered = filtered.filter(m => m.channel_id === parseInt(channel_id));
    }
    
    if (rule_id) {
      filtered = filtered.filter(m => m.rule_id === parseInt(rule_id));
    }
    
    filtered = filtered.slice(0, parseInt(limit));
    
    return res.status(200).json(filtered);
  }

  res.setHeader('Allow', ['GET']);
  return res.status(405).json({ error: 'Method Not Allowed' });
}

