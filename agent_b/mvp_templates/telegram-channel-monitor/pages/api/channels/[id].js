// Dynamic route for individual channel operations
import mockChannels from '../../../mock-data/channels';

let channels = [...mockChannels];

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    const channel = channels.find(ch => ch.id === parseInt(id));
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    return res.status(200).json(channel);
  }

  if (req.method === 'PATCH') {
    const updates = req.body;
    const index = channels.findIndex(ch => ch.id === parseInt(id));
    if (index === -1) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    channels[index] = { ...channels[index], ...updates, updated_at: new Date().toISOString() };
    return res.status(200).json(channels[index]);
  }

  if (req.method === 'DELETE') {
    const index = channels.findIndex(ch => ch.id === parseInt(id));
    if (index === -1) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    channels.splice(index, 1);
    return res.status(200).json({ message: 'Deleted' });
  }

  res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
  return res.status(405).json({ error: 'Method Not Allowed' });
}

