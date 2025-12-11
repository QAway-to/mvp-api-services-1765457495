// Endpoint для сканирования каналов и отправки уведомлений о совпадениях
// Использует TELEGRAM_BOT_SERBIA для работы с Telegram API

import mockChannels from '../../mock-data/channels';
import mockRules from '../../mock-data/rules';
import mockMatches from '../../mock-data/matches';

let matches = [...mockMatches];

// Функция для отправки уведомления о совпадении
async function sendMatchNotification(match) {
  const botToken = process.env.TELEGRAM_BOT_SERBIA;
  const chatId = process.env.TELEGRAM_NOTIFICATION_CHAT_ID;

  if (!botToken || !chatId) {
    console.log('Bot token or chat ID not configured, skipping notification');
    return false;
  }

  try {
    const message = `🔔 <b>Найдено совпадение!</b>\n\n` +
      `📺 <b>Канал:</b> ${match.channel_name || 'N/A'}\n` +
      `🔍 <b>Правило:</b> ${match.rule_name || 'N/A'}\n` +
      `📝 <b>Сообщение:</b>\n${(match.message_text || '').substring(0, 500)}\n\n` +
      (match.message_url ? `🔗 <a href="${match.message_url}">Открыть сообщение</a>` : '');

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
    return result.ok;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const botToken = process.env.TELEGRAM_BOT_SERBIA;

  if (!botToken) {
    return res.status(200).json({
      message: 'Telegram bot token not configured',
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Проверяем доступность бота
    const botInfoResponse = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const botInfo = await botInfoResponse.json();

    if (!botInfo.ok) {
      return res.status(200).json({
        message: 'Bot API error',
        error: botInfo.description,
        timestamp: new Date().toISOString()
      });
    }

    // Здесь должна быть логика сканирования каналов
    // В демо-версии проверяем новые совпадения и отправляем уведомления
    
    const activeChannels = mockChannels.filter(ch => ch.is_active);
    const activeRules = mockRules.filter(r => r.is_active);
    
    let newMatchesCount = 0;
    let notificationsSent = 0;

    // Имитация поиска совпадений (в реальной версии здесь будет реальное сканирование)
    // Проверяем, есть ли новые совпадения, которые еще не были отправлены
    const recentMatches = matches.filter(m => {
      const matchTime = new Date(m.detected_at);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return matchTime >= oneHourAgo;
    });

    // Отправляем уведомления о новых совпадениях
    for (const match of recentMatches) {
      const notificationSent = await sendMatchNotification(match);
      if (notificationSent) {
        notificationsSent++;
      }
      newMatchesCount++;
    }

    return res.status(200).json({
      message: 'Scan completed successfully',
      bot_username: botInfo.result.username,
      channels_scanned: activeChannels.length,
      rules_active: activeRules.length,
      new_matches: newMatchesCount,
      notifications_sent: notificationsSent,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(200).json({
      message: 'Scan error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

