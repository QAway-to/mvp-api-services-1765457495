"""
Unified configuration for AI Multi-Agent MVP Generation System
Combines settings from both Agent A and Agent B
"""
import os
import warnings
from typing import List

class Config:
    """Unified configuration class"""

    # Agent A settings
    _mode = os.getenv('MODE', 'demo').lower().strip()
    if _mode not in ['demo', 'full']:
        warnings.warn(f"Invalid MODE value: {os.getenv('MODE')}. Using 'demo' instead. Valid values: 'demo', 'full'")
        _mode = 'demo'
    MODE: str = _mode

    LOG_LEVEL: str = os.getenv('LOG_LEVEL', 'INFO')

    # Kwork settings
    KWORK_BASE_URL: str = "https://kwork.ru"
    KWORK_PROJECTS_URL: str = f"{KWORK_BASE_URL}/projects"
    SEARCH_KEYWORDS: str = os.getenv('SEARCH_KEYWORDS', 'бот, данные, скрипт, скрипты, сканер, парсер')
    _legacy_keyword = os.getenv('SEARCH_KEYWORD')
    if _legacy_keyword:
        SEARCH_KEYWORDS = _legacy_keyword
    SEARCH_KEYWORDS_LIST: List[str] = [kw.strip() for kw in SEARCH_KEYWORDS.split(',') if kw.strip()]
    SEARCH_KEYWORD: str = SEARCH_KEYWORDS_LIST[0] if SEARCH_KEYWORDS_LIST else 'бот'

    # Credentials
    KWORK_EMAIL = os.getenv('KWORK_EMAIL')
    KWORK_PASSWORD = os.getenv('KWORK_PASSWORD')

    # Telegram
    TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
    TELEGRAM_CHANNEL_ID = os.getenv('TELEGRAM_CHANNEL_ID')

    # Agent B settings
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    GITHUB_USER = os.getenv("GITHUB_USER")
    GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
    AGENT_B_TEST_MODE = os.getenv("AGENT_B_TEST_MODE", "true").lower() == "true"
    AGENT_B_TEST_REPO = os.getenv("AGENT_B_TEST_REPO", "test-mvp-repo")

    # Common settings
    GEMINI_MODEL = "gemini-1.5-flash"
    MAX_RETRIES = 3
    REQUEST_TIMEOUT = 30
    MAX_PROMPT_LENGTH = 100000
    MAX_CODE_LENGTH = 50000

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
    MOUSE_MOVEMENT_STEPS: int = 10

    @classmethod
    def validate(cls):
        """Validate required environment variables"""
        print(f"🔧 Config validation - MODE: {cls.MODE}, TEST_MODE: {cls.AGENT_B_TEST_MODE}")
        print(f"🔧 Environment vars - GITHUB_USER: {'***' if cls.GITHUB_USER else 'NOT SET'}, GITHUB_TOKEN: {'***' if cls.GITHUB_TOKEN else 'NOT SET'}")

        required_vars = []

        # Agent A required vars
        if cls.MODE not in ["demo"]:
            if not cls.KWORK_EMAIL:
                required_vars.append("KWORK_EMAIL")
            if not cls.KWORK_PASSWORD:
                required_vars.append("KWORK_PASSWORD")

        if cls.TELEGRAM_BOT_TOKEN:
            if not cls.TELEGRAM_CHANNEL_ID:
                required_vars.append("TELEGRAM_CHANNEL_ID")

        # Agent B required vars (only if not in test mode)
        if not cls.AGENT_B_TEST_MODE:
            print("🔧 Agent B not in test mode - validating GitHub credentials")
            if not cls.GEMINI_API_KEY:
                required_vars.append("GEMINI_API_KEY")
            if not cls.GITHUB_USER:
                required_vars.append("GITHUB_USER")
            if not cls.GITHUB_TOKEN:
                required_vars.append("GITHUB_TOKEN")
        else:
            print("🔧 Agent B in test mode - skipping GitHub validation")

        if required_vars:
            raise ValueError(f"Missing required environment variables: {', '.join(required_vars)}")

        print(f"✅ Configuration validated (Mode: {cls.MODE}, Test Mode: {cls.AGENT_B_TEST_MODE})")

# Validate configuration on import
Config.validate()

# Export single instance
config = Config()