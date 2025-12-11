import mockRules from '../../mock-data/rules';

let rules = [...mockRules];

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json(rules);
  }

  if (req.method === 'POST') {
    const { name, rule_type, pattern, is_active = true } = req.body;
    const newRule = {
      id: Date.now(),
      name,
      rule_type,
      pattern,
      is_active,
      created_at: new Date().toISOString()
    };
    rules.push(newRule);
    return res.status(200).json(newRule);
  }

  if (req.method === 'PATCH') {
    const { id } = req.query;
    const updates = req.body;
    rules = rules.map(r => 
      r.id === parseInt(id) ? { ...r, ...updates, updated_at: new Date().toISOString() } : r
    );
    return res.status(200).json({ message: 'Updated' });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    rules = rules.filter(r => r.id !== parseInt(id));
    return res.status(200).json({ message: 'Deleted' });
  }

  res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE']);
  return res.status(405).json({ error: 'Method Not Allowed' });
}

