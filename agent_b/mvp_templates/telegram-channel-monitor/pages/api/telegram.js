// API endpoint для работы с Telegram ботом
// Использует TELEGRAM_BOT_SERBIA для отправки уведомлений

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const botToken = process.env.TELEGRAM_BOT_SERBIA;

  if (!botToken) {
    return res.status(400).json({ 
      error: 'Telegram bot token not configured',
      message: 'Set TELEGRAM_BOT_SERBIA environment variable'
    });
  }

  const { chat_id, text } = req.body;

  if (!chat_id || !text) {
    return res.status(400).json({ 
      error: 'Missing required parameters',
      required: ['chat_id', 'text']
    });
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id,
        text,
        parse_mode: 'HTML'
      })
    });

    const result = await response.json();

    if (result.ok) {
      return res.status(200).json({
        success: true,
        message_id: result.result.message_id
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.description
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

