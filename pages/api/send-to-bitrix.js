export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { selectedEvents } = req.body;

  if (!selectedEvents || !Array.isArray(selectedEvents) || selectedEvents.length === 0) {
    return res.status(400).json({ error: 'No selected events provided' });
  }

  const BITRIX_WEBHOOK_URL = 'https://bfcshoes.bitrix24.eu/rest/52/fan7d3m1ylod3mqg/';

  try {
    const results = [];

    for (const event of selectedEvents) {
      const response = await fetch(BITRIX_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      });

      const result = await response.json();
      results.push({
        eventId: event.id,
        success: response.ok,
        response: result
      });
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    res.status(200).json({
      message: `Отправлено ${successful} событий успешно, ${failed} неудачно`,
      results
    });

  } catch (error) {
    console.error('Error sending to Bitrix:', error);
    res.status(500).json({ error: 'Failed to send data to Bitrix' });
  }
}
