import asyncio
from typing import Dict, Any
from telegram import Bot
from telegram.error import TelegramError

from config import config
from utils.logger import log_agent_action

class TelegramNotifier:
    def __init__(self):
        self.bot = None
        self.channel_id = config.TELEGRAM_CHANNEL_ID
        self.last_send_time = 0
        self.min_delay = 1  # Minimum delay between messages in seconds

        if config.TELEGRAM_BOT_TOKEN:
            # Create bot with custom HTTP client settings
            from telegram.request import HTTPXRequest
            request = HTTPXRequest(
                connection_pool_size=10,  # Increase connection pool
                read_timeout=30,
                write_timeout=30,
                connect_timeout=10
            )
            self.bot = Bot(token=config.TELEGRAM_BOT_TOKEN, request=request)
            log_agent_action("Telegram", "Bot initialized with enhanced connection settings")
        else:
            log_agent_action("Telegram", "Bot token not configured - notifications disabled")

    async def send_project_notification(self, project: Dict[str, Any]):
        """Send project notification to Telegram channel"""
        if not self.bot or not self.channel_id:
            log_agent_action("Telegram", "Bot not configured - skipping notification")
            return

        try:
            # Add delay to prevent rate limiting
            current_time = asyncio.get_event_loop().time()
            time_since_last_send = current_time - self.last_send_time

            if time_since_last_send < self.min_delay:
                delay = self.min_delay - time_since_last_send
                log_agent_action("Telegram", f"Rate limiting: waiting {delay:.1f}s before sending")
                await asyncio.sleep(delay)
            evaluation = project.get('evaluation', {})
            score = evaluation.get('score', 0)
            reasons = evaluation.get('reasons', [])

            # Format message
            message = "🎯 <b>Найден подходящий проект!</b>\n\n"

            message += f"📋 <b>Название:</b> {project.get('title', 'N/A')}\n"
            message += f"💰 <b>Бюджет:</b> {project.get('budget', 'N/A')}\n"
            message += f"📊 <b>Релевантность:</b> {score:.2f}/1.0\n"
            message += f"📊 <b>Предложений:</b> {project.get('proposals', 0)}\n"
            message += f"👥 <b>Нанято:</b> {project.get('hired', 0)}\n\n"

            # Send FULL description without truncation
            description = project.get('description', 'N/A')
            message += f"📝 <b>Описание:</b>\n{description}"

            message += "\n\n🔗 <b>Ссылка:</b> " + project.get('url', 'N/A')

            message += "\n\n📈 <b>Причины оценки:</b>\n"
            for reason in reasons[-3:]:  # Show last 3 reasons
                message += f"• {reason}\n"

            # Send message
            await self.bot.send_message(
                chat_id=self.channel_id,
                text=message,
                parse_mode='HTML',
                disable_web_page_preview=True
            )

            # Update last send time
            self.last_send_time = asyncio.get_event_loop().time()

            log_agent_action("Telegram", f"✅ Notification sent for project: {project.get('title', 'N/A')[:50]}...")

        except TelegramError as e:
            log_agent_action("Telegram", f"❌ Failed to send notification: {str(e)}")
        except Exception as e:
            log_agent_action("Telegram", f"❌ Unexpected error sending notification: {str(e)}")

    async def send_summary_notification(self, session_stats: Dict[str, Any]):
        """Send session summary to Telegram"""
        if not self.bot or not self.channel_id:
            return

        try:
            message = "📊 <b>Итоги сессии поиска</b>\n\n"

            message += f"🔍 <b>Проверено проектов:</b> {session_stats.get('checked', 0)}\n"
            message += f"✅ <b>Подходящих:</b> {session_stats.get('suitable', 0)}\n"
            message += f"⏱️ <b>Время сессии:</b> {session_stats.get('duration', 'N/A')}\n"
            message += f"🕐 <b>Время:</b> {session_stats.get('timestamp', 'N/A')}\n"

            await self.bot.send_message(
                chat_id=self.channel_id,
                text=message,
                parse_mode='HTML'
            )

            log_agent_action("Telegram", "Session summary sent")

        except Exception as e:
            log_agent_action("Telegram", f"Failed to send summary: {str(e)}")
