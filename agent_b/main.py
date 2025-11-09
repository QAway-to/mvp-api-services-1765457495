"""
AI Multi-Agent System for Automated Project Generation
"""
import logging
import sys
from typing import Optional

from shared.config import config
from architect_agent import run_architect

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('ai_agent.log', encoding='utf-8')
    ]
)

logger = logging.getLogger(__name__)


def main():
    """Main entry point"""
    try:
        print("🤖 AI Multi-Agent System for Project Generation")
        print("=" * 50)

        # Get project description
        default_desc = "Freelance scraping tool with modular architecture"
        desc = input(f"🔹 Опиши проект (или Enter для '{default_desc}'): ").strip()
        if not desc:
            desc = default_desc

        logger.info(f"Starting project generation: {desc[:100]}...")

        # Run the architect
        run_architect(desc)

        print("\n🎉 Проект успешно сгенерирован!")
        logger.info("Project generation completed successfully")

    except KeyboardInterrupt:
        print("\n⏹️ Операция прервана пользователем")
        logger.info("Operation cancelled by user")
        sys.exit(1)

    except Exception as e:
        print(f"\n❌ Критическая ошибка: {e}")
        logger.error(f"Critical error in main: {e}", exc_info=True)
        sys.exit(1)


def setup_environment() -> bool:
    """Setup and validate environment"""
    try:
        issues = config.validate_agent_b()
        if issues:
            print("❌ Agent B configuration issues:")
            for issue in issues:
                print(f"  - {issue}")
            return
        logger.info("Environment configuration validated")
        return True
    except ValueError as e:
        print(f"❌ Конфигурация недействительна: {e}")
        print("Пожалуйста, создайте .env файл на основе SETUP.md")
        return False


if __name__ == "__main__":
    if setup_environment():
        main()
    else:
        sys.exit(1)
