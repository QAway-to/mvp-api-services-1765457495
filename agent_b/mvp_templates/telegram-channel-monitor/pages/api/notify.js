// API endpoint для отправки уведомлений о найденных совпадениях
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

  const { match } = req.body;

  if (!match) {
    return res.status(400).json({ 
      error: 'Missing match data',
      required: ['match']
    });
  }

  // Получаем chat_id из переменной окружения или используем дефолтный
  // В продакшене это должно быть настраиваемым
  const chatId = process.env.TELEGRAM_NOTIFICATION_CHAT_ID || match.chat_id;

  if (!chatId) {
    return res.status(400).json({ 
      error: 'Chat ID not configured',
      message: 'Set TELEGRAM_NOTIFICATION_CHAT_ID environment variable or provide chat_id in match data'
    });
  }

  // Формируем сообщение
  const message = `🔔 <b>Найдено совпадение!</b>\n\n` +
    `📺 <b>Канал:</b> ${match.channel_name || 'N/A'}\n` +
    `🔍 <b>Правило:</b> ${match.rule_name || 'N/A'}\n` +
    `📝 <b>Сообщение:</b>\n${(match.message_text || '').substring(0, 500)}\n\n` +
    (match.message_url ? `🔗 <a href="${match.message_url}">Открыть сообщение</a>` : '');

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: false
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

