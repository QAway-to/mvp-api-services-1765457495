"""
Configuration management for AI Multi-Agent System
"""
import os
from typing import Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Centralized configuration management"""

    # Gemini API
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    # GitHub
    GITHUB_USER: str = os.getenv("GITHUB_USER", "")
    GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN", "")

    # Processing settings
    REMOTE_ONLY: bool = os.getenv("REMOTE_ONLY", "true").lower() == "true"
    MAX_RETRIES: int = int(os.getenv("MAX_RETRIES", "3"))
    REQUEST_TIMEOUT: int = int(os.getenv("REQUEST_TIMEOUT", "30"))

    # Token optimization
    MAX_PROMPT_LENGTH: int = int(os.getenv("MAX_PROMPT_LENGTH", "4000"))
    MAX_CODE_LENGTH: int = int(os.getenv("MAX_CODE_LENGTH", "2000"))

    # Validation
    REQUIRED_VARS = ["GEMINI_API_KEY", "GITHUB_USER", "GITHUB_TOKEN"]

    @classmethod
    def validate(cls) -> None:
        """Validate required configuration"""
        missing = []
        for var in cls.REQUIRED_VARS:
            if not getattr(cls, var):
                missing.append(var)

        if missing:
            raise ValueError(f"Missing required environment variables: {', '.join(missing)}")

    @classmethod
    def get_settings(cls) -> Dict[str, Any]:
        """Get all configuration as dictionary"""
        return {
            "gemini_api_key": cls.GEMINI_API_KEY,
            "gemini_model": cls.GEMINI_MODEL,
            "github_user": cls.GITHUB_USER,
            "github_token": cls.GITHUB_TOKEN,
            "remote_only": cls.REMOTE_ONLY,
            "max_retries": cls.MAX_RETRIES,
            "request_timeout": cls.REQUEST_TIMEOUT,
            "max_prompt_length": cls.MAX_PROMPT_LENGTH,
            "max_code_length": cls.MAX_CODE_LENGTH,
        }

# Validate configuration on import
Config.validate()

