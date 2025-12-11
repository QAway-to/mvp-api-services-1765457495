// Dynamic route for individual rule operations
import mockRules from '../../../mock-data/rules';

let rules = [...mockRules];

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    const rule = rules.find(r => r.id === parseInt(id));
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    return res.status(200).json(rule);
  }

  if (req.method === 'PATCH') {
    const updates = req.body;
    const index = rules.findIndex(r => r.id === parseInt(id));
    if (index === -1) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    rules[index] = { ...rules[index], ...updates, updated_at: new Date().toISOString() };
    return res.status(200).json(rules[index]);
  }

  if (req.method === 'DELETE') {
    const index = rules.findIndex(r => r.id === parseInt(id));
    if (index === -1) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    rules.splice(index, 1);
    return res.status(200).json({ message: 'Deleted' });
  }

  res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
  return res.status(405).json({ error: 'Method Not Allowed' });
}

