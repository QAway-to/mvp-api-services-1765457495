import mockChannels from '../../mock-data/channels';

let channels = [...mockChannels];

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json(channels);
  }

  if (req.method === 'POST') {
    const { channel_id, name, is_active = true } = req.body;
    const newChannel = {
      id: Date.now(),
      channel_id,
      name,
      is_active,
      last_check_time: null,
      last_processed_message_id: null,
      created_at: new Date().toISOString()
    };
    channels.push(newChannel);
    return res.status(200).json(newChannel);
  }

  if (req.method === 'PATCH') {
    const { id } = req.query;
    const updates = req.body;
    channels = channels.map(ch => 
      ch.id === parseInt(id) ? { ...ch, ...updates, updated_at: new Date().toISOString() } : ch
    );
    return res.status(200).json({ message: 'Updated' });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    channels = channels.filter(ch => ch.id !== parseInt(id));
    return res.status(200).json({ message: 'Deleted' });
  }

  res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE']);
  return res.status(405).json({ error: 'Method Not Allowed' });
}

