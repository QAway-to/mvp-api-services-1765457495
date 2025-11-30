"""
AI-powered template selector for MVP generation
"""
import json
import logging
from typing import Dict, Any, Tuple, List, Optional
from dataclasses import dataclass
import os

import google.generativeai as genai
# Import from root config
from config import Config

# Import shared logger
from shared_logger import logger, log_agent_action

# Configure Gemini
genai.configure(api_key=Config.GEMINI_API_KEY)

@dataclass
class TemplateMatch:
    """Result of template matching"""
    template_id: str
    confidence: float
    reasoning: str
    category: str
    features: List[str]

@dataclass
class TemplateInfo:
    """Template metadata"""
    id: str
    name: str
    category: str
    description: str
    features: List[str]
    complexity: str
    estimated_completion: str

class AITemplateSelector:
    """AI-powered template selection using semantic analysis"""

    def __init__(self):
        self.templates = self._load_templates()
        self.model = genai.GenerativeModel(Config.GEMINI_MODEL)

    def _load_templates(self) -> Dict[str, TemplateInfo]:
        """Load available templates"""
        return {
            # Telegram Bots
            "telegram-shop-bot": TemplateInfo(
                id="telegram-shop-bot",
                name="Telegram Shop Assistant",
                category="telegram-bots",
                description="Интеллектуальный помощник для интернет-магазина в Telegram",
                features=["каталог товаров", "оформление заказов", "уведомления", "админ-панель"],
                complexity="medium",
                estimated_completion="75%"
            ),

            # Parsers
            "news-parser": TemplateInfo(
                id="news-parser",
                name="News Parser Dashboard",
                category="parsers",
                description="Веб-приложение для парсинга и анализа новостей",
                features=["парсинг RSS", "фильтрация", "экспорт данных", "визуализация"],
                complexity="low",
                estimated_completion="80%"
            ),

            # Analytics
            "analytics-dashboard": TemplateInfo(
                id="analytics-dashboard",
                name="Analytics Dashboard",
                category="analytics",
                description="Дашборд для визуализации данных и аналитики",
                features=["графики", "отчеты", "фильтры", "экспорт"],
                complexity="medium",
                estimated_completion="70%"
            ),

            # Email marketing
            "email-campaign-manager": TemplateInfo(
                id="email-campaign-manager",
                name="Email Campaign Manager",
                category="marketing",
                description="Панель управления email-рассылками с автоматизацией и мониторингом ответов",
                features=["дашборд кампаний", "ротация шаблонов", "автоответы", "SendGrid интеграция"],
                complexity="medium",
                estimated_completion="80%"
            ),

            # Brand Mention Monitor
            "brand-mention-monitor": TemplateInfo(
                id="brand-mention-monitor",
                name="Brand Mention Monitor",
                category="parsers",
                description="Мониторинг упоминаний бренда в новостях, блогах и форумах",
                features=["rss", "sentiment", "digest", "favorites"],
                complexity="low",
                estimated_completion="80%"
            ),

            # Data Formatter
            "data-formatter": TemplateInfo(
                id="data-formatter",
                name="Data Formatter / Normalizer",
                category="tools",
                description="Нормализация CSV/Excel с маппингом и предпросмотром",
                features=["mapping", "rules", "preview", "export"],
                complexity="low",
                estimated_completion="80%"
            ),

            # Mini ETL
            "mini-etl-pipeline": TemplateInfo(
                id="mini-etl-pipeline",
                name="Mini ETL Pipeline",
                category="etl",
                description="Минимальный ETL-конвейер с визуализацией шагов и метриками",
                features=["steps", "logs", "metrics"],
                complexity="low",
                estimated_completion="75%"
            ),

            # Price & Stock Parser
            "price-stock-parser": TemplateInfo(
                id="price-stock-parser",
                name="Price & Stock Parser",
                category="parsers",
                description="Мониторинг цен и наличия товаров по SKU с экспортом и алертами",
                features=["sku tracking", "alerts", "history", "export"],
                complexity="low",
                estimated_completion="80%"
            ),

            # Web Scraper (Universal)
            "web-scraper": TemplateInfo(
                id="web-scraper",
                name="Universal Web Scraper",
                category="parsers",
                description="Универсальный веб-скрапер для парсинга любых сайтов с поддержкой сезонов и отдельных страниц",
                features=["scraping", "season support", "data export", "table view"],
                complexity="low",
                estimated_completion="75%"
            ),

            # API Services
            "api-services": TemplateInfo(
                id="api-services",
                name="API Services Manager",
                category="api",
                description="Менеджер для интеграций с внешними API. Работа с Wayback Machine и другими API сервисами",
                features=["wayback machine", "api integration", "snapshots", "cdx api"],
                complexity="low",
                estimated_completion="75%"
            ),

            # Freelance Project Search
            "freelance-project-search": TemplateInfo(
                id="freelance-project-search",
                name="Freelance Project Search",
                category="parsers",
                description="Поиск и парсинг проектов с фриланс платформ (Kwork) с фильтрацией и оценкой релевантности",
                features=["search", "parsing", "filtering", "evaluation", "kwork integration"],
                complexity="medium",
                estimated_completion="70%"
            ),
        }

    async def select_template(self, project_description: str) -> TemplateMatch:
        """Select best template using AI analysis"""

        prompt = f"""
Ты - эксперт по выбору шаблонов для MVP проектов. Проанализируй описание проекта и выбери наиболее подходящий шаблон.

Описание проекта: "{project_description}"

Доступные шаблоны:
{chr(10).join(f"- {t.id}: {t.description} (категория: {t.category})" for t in self.templates.values())}

Проанализируй:
1. Основную функциональность проекта
2. Технологии и платформы
3. Бизнес-логику

Верни JSON:
{{
  "selected_template": "template_id",
  "confidence": 0.0-1.0,
  "reasoning": "подробное объяснение выбора",
  "key_features": ["feature1", "feature2"],
  "category": "category_name"
}}
"""

        try:
            response = await self.model.generate_content_async(prompt)
            result = self._parse_ai_response(response.text)

            if result and result.template_id in self.templates:
                log_agent_action("Agent B", f"🤖 AI selected template: {result.template_id} (confidence: {result.confidence:.2f})")
                return result
            else:
                # Fallback to keyword matching
                log_agent_action("Agent B", "AI selection failed, using keyword fallback")
                return self._keyword_fallback(project_description)

        except Exception as e:
            log_agent_action("Agent B", f"AI template selection failed: {e}")
            return self._keyword_fallback(project_description)

    def _parse_ai_response(self, response_text: str) -> Optional[TemplateMatch]:
        """Parse AI response"""
        try:
            # Clean response
            text = response_text.replace("```json", "").replace("```", "").strip()

            # Extract JSON
            start = text.find("{")
            end = text.rfind("}") + 1
            if start >= 0 and end > start:
                json_text = text[start:end]
                data = json.loads(json_text)

                return TemplateMatch(
                    template_id=data["selected_template"],
                    confidence=float(data["confidence"]),
                    reasoning=data["reasoning"],
                    category=data["category"],
                    features=data.get("key_features", [])
                )

        except Exception as e:
            log_agent_action("Agent B", f"Failed to parse AI response: {e}")

        return None

    def _keyword_fallback(self, project_description: str) -> TemplateMatch:
        """Fallback keyword-based selection"""
        desc_lower = project_description.lower()

        # Priority matching rules
        if "telegram" in desc_lower or "телеграм" in desc_lower:
            if "магазин" in desc_lower or "shop" in desc_lower or "товар" in desc_lower:
                return TemplateMatch("telegram-shop-bot", 0.8, "Keyword match: Telegram + shop", "telegram-bots", ["catalog", "orders"])
            else:
                return TemplateMatch("telegram-support-bot", 0.7, "Keyword match: Telegram bot", "telegram-bots", ["support", "chat"])

        elif "discord" in desc_lower:
            return TemplateMatch("discord-moderation-bot", 0.8, "Keyword match: Discord bot", "discord-bots", ["moderation", "chat"])

        elif "email" in desc_lower or "рассыл" in desc_lower or "campaign" in desc_lower:
            return TemplateMatch(
                "email-campaign-manager",
                0.85,
                "Keyword match: email/campaign manager",
                "marketing",
                ["sendgrid", "templates", "statistics"],
            )

        elif "парсер" in desc_lower or "parser" in desc_lower:
            if "новост" in desc_lower or "news" in desc_lower:
                return TemplateMatch("news-parser", 0.8, "Keyword match: News parser", "parsers", ["scraping", "news"])
            else:
                return TemplateMatch("product-parser", 0.7, "Keyword match: Data parser", "parsers", ["scraping", "data"])

        elif any(keyword in desc_lower for keyword in ["brand", "упомин", "mention", "pr мониторинг", "мониторинг прессы"]):
            return TemplateMatch(
                "brand-mention-monitor",
                0.85,
                "Keyword match: brand/news monitor",
                "parsers",
                ["rss", "sentiment", "digest"]
            )

        elif any(keyword in desc_lower for keyword in ["formatter", "normalize", "нормализ", "очист", "csv", "excel", "etl файл"]):
            return TemplateMatch(
                "data-formatter",
                0.85,
                "Keyword match: data formatter",
                "tools",
                ["mapping", "rules", "preview"]
            )

        elif "etl" in desc_lower or "pipeline" in desc_lower or "конвейер" in desc_lower:
            return TemplateMatch(
                "mini-etl-pipeline",
                0.8,
                "Keyword match: ETL pipeline",
                "etl",
                ["steps", "metrics"]
            )

        elif any(keyword in desc_lower for keyword in ["price", "цен", "stock", "sku", "налич"]):
            return TemplateMatch(
                "price-stock-parser",
                0.8,
                "Keyword match: price/stock tracking",
                "parsers",
                ["sku tracking", "alerts"]
            )

        elif "аналитик" in desc_lower or "dashboard" in desc_lower or "дашборд" in desc_lower:
            return TemplateMatch("analytics-dashboard", 0.8, "Keyword match: Analytics dashboard", "analytics", ["charts", "reports"])

        elif any(keyword in desc_lower for keyword in ["api", "wayback", "архив", "снимок", "snapshot", "archive"]):
            return TemplateMatch(
                "api-services",
                0.85,
                "Keyword match: API services / Wayback Machine",
                "api",
                ["wayback", "api integration"]
            )

        else:
            return TemplateMatch("analytics-dashboard", 0.5, "Fallback: General analytics dashboard", "analytics", ["charts", "reports"])

    def get_template_info(self, template_id: str) -> Optional[TemplateInfo]:
        """Get template information"""
        return self.templates.get(template_id)

    def get_available_templates(self) -> List[TemplateInfo]:
        """Get all available templates"""
        return list(self.templates.values())

    def get_templates_by_category(self, category: str) -> List[TemplateInfo]:
        """Get templates by category"""
        return [t for t in self.templates.values() if t.category == category]
