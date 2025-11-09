"""
Unified configuration for AI Multi-Agent MVP System
"""
import os
from typing import Optional, List
from dotenv import load_dotenv

# Try to load .env file, but don't fail if it doesn't exist
try:
    load_dotenv()
except:
    pass

class Config:
    """Unified configuration for both agents"""

    # === SHARED SETTINGS ===
    LOG_LEVEL: str = os.getenv('LOG_LEVEL', 'INFO')
    MAX_RETRIES: int = int(os.getenv('MAX_RETRIES', '3'))
    REQUEST_TIMEOUT: int = int(os.getenv('REQUEST_TIMEOUT', '30'))

    # === DATABASE ===
    DATABASE_URL: str = os.getenv('DATABASE_URL', 'sqlite:///freelance_agent.db')

    # === AGENT A (Freelance Search) ===
    # App settings
    MODE: str = os.getenv('MODE', 'demo').lower().strip()
    if MODE not in ['demo', 'full']:
        import warnings
        warnings.warn(f"Invalid MODE value: {os.getenv('MODE')}. Using 'demo' instead.")
        MODE = 'demo'

    # Kwork settings
    KWORK_BASE_URL: str = "https://kwork.ru"
    KWORK_PROJECTS_URL: str = f"{KWORK_BASE_URL}/projects"

    # Search keywords
    SEARCH_KEYWORDS: str = os.getenv('SEARCH_KEYWORDS', 'бот,данные,скрипт,скрипты,сканер,парсер,api,интеграция')
    SEARCH_KEYWORDS_LIST: List[str] = [kw.strip() for kw in SEARCH_KEYWORDS.split(',') if kw.strip()]
    SEARCH_KEYWORD: str = SEARCH_KEYWORDS_LIST[0] if SEARCH_KEYWORDS_LIST else 'бот'

    # Credentials
    KWORK_EMAIL: Optional[str] = os.getenv('KWORK_EMAIL')
    KWORK_PASSWORD: Optional[str] = os.getenv('KWORK_PASSWORD')

    # Telegram
    TELEGRAM_BOT_TOKEN: Optional[str] = os.getenv('TELEGRAM_BOT_TOKEN')
    TELEGRAM_CHANNEL_ID: Optional[str] = os.getenv('TELEGRAM_CHANNEL_ID')

    # Search limits
    MAX_PROJECTS_PER_SESSION: int = int(os.getenv('MAX_PROJECTS_PER_SESSION', '5'))
    EVALUATION_THRESHOLD: float = float(os.getenv('EVALUATION_THRESHOLD', '0.4'))

    # Timing (seconds)
    SESSION_DURATION_MAX: int = int(os.getenv('SESSION_DURATION_MAX', '300'))
    PAUSE_BETWEEN_CHECKS: int = int(os.getenv('PAUSE_BETWEEN_CHECKS', '3600'))
    READING_TIME_MIN: int = int(os.getenv('READING_TIME_MIN', '10'))
    READING_TIME_MAX: int = int(os.getenv('READING_TIME_MAX', '30'))

    # Human behavior
    DELAY_BETWEEN_ACTIONS_MIN: float = 2.0
    DELAY_BETWEEN_ACTIONS_MAX: float = 8.0

    # === AGENT B (MVP Generation) ===
    # Gemini AI
    GEMINI_API_KEY: Optional[str] = os.getenv('GEMINI_API_KEY')
    GEMINI_MODEL: str = os.getenv('GEMINI_MODEL', 'gemini-2.5-flash')
    SEMANTIC_SIMILARITY_THRESHOLD: float = float(os.getenv('SEMANTIC_SIMILARITY_THRESHOLD', '0.75'))

    # GitHub
    GITHUB_USER: Optional[str] = os.getenv('GITHUB_USER')
    GITHUB_TOKEN: Optional[str] = os.getenv('GITHUB_TOKEN')

    # Test settings
    AGENT_B_TEST_MODE: bool = os.getenv('AGENT_B_TEST_MODE', 'true').lower() == 'true'
    AGENT_B_TEST_REPO: str = os.getenv('AGENT_B_TEST_REPO', 'ai-mvp-test')

    # Queue settings
    MAX_CONCURRENT_MVPS: int = int(os.getenv('MAX_CONCURRENT_MVPS', '2'))

    # Token optimization
    MAX_PROMPT_LENGTH: int = int(os.getenv('MAX_PROMPT_LENGTH', '4000'))
    MAX_CODE_LENGTH: int = int(os.getenv('MAX_CODE_LENGTH', '2000'))

    # === INTEGRATIONS ===
    # n8n (legacy)
    N8N_WEBHOOK_URL: Optional[str] = os.getenv('N8N_WEBHOOK_URL')

    # Vercel
    VERCEL_DEPLOY_HOOK: Optional[str] = os.getenv('VERCEL_DEPLOY_HOOK')

    # === VALIDATION ===
    def validate_agent_a(self) -> List[str]:
        """Validate Agent A configuration"""
        issues = []

        if self.MODE == 'full':
            if not self.KWORK_EMAIL:
                issues.append("KWORK_EMAIL required for full mode")
            if not self.KWORK_PASSWORD:
                issues.append("KWORK_PASSWORD required for full mode")

        if not self.SEARCH_KEYWORDS_LIST:
            issues.append("SEARCH_KEYWORDS cannot be empty")

        return issues

    def validate_agent_b(self) -> List[str]:
        """Validate Agent B configuration"""
        issues = []

        if not self.GEMINI_API_KEY:
            issues.append("GEMINI_API_KEY required for Agent B")
        if not self.GITHUB_USER:
            issues.append("GITHUB_USER required for Agent B")
        if not self.GITHUB_TOKEN:
            issues.append("GITHUB_TOKEN required for Agent B")

        return issues

    def validate_all(self) -> List[str]:
        """Validate all configuration"""
        issues = []
        issues.extend(self.validate_agent_a())
        issues.extend(self.validate_agent_b())
        return issues

# Global config instance
config = Config()
