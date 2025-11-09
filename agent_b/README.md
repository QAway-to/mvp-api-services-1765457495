# 🤖 AI Multi-Agent MVP Generation System

[![Python](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/react-18+-61dafb.svg)](https://reactjs.org/)
[![Next.js](https://img.shields.io/badge/next.js-14+-000000.svg)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/fastapi-0.104+-009688.svg)](https://fastapi.tiangolo.com/)

## 🚀 Описание

Система AI-powered генерации MVP (Minimum Viable Products) на основе описаний проектов. Использует два агента:

- **Agent A**: Поиск и квалификация проектов на фриланс-платформах
- **Agent B**: Генерация продающих MVP с 60-80% готовности

## 🎯 Возможности

### 🤖 Agent A (Freelance Search)
- 🔍 Автоматизированный поиск проектов на Kwork
- 📊 AI-оценка релевантности проектов через Gemini
- 📱 Веб-dashboard с real-time логами
- 🚀 Интеграция с Telegram для уведомлений
- 📦 API для управления и получения данных

### 🎨 Agent B (MVP Generation)
- 🧠 AI-powered выбор шаблонов через семантический анализ
- 📱 Каталог готовых шаблонов (Telegram bots, parsers, dashboards)
- ⚡ Быстрая генерация (шаблоны + кастомизация)
- 🚀 Автоматический деплой на Vercel
- 💰 Продающие MVP с моковыми данными

## 🏗️ Архитектура

```
AI Multi-Agent System
├── 🤖 Agent A (FastAPI + Selenium)
│   ├── Web Dashboard (Real-time logs)
│   ├── Project Search (Kwork automation)
│   ├── AI Evaluation (Gemini API)
│   └── Telegram Notifications
├── 🎨 Agent B (AI + Templates)
│   ├── Template Selection (Semantic AI)
│   ├── MVP Generation (React/Next.js)
│   ├── GitHub Integration
│   └── Vercel Deployment
└── 📊 Shared Services
    ├── Database (Projects & Offers)
    ├── Logging (Real-time streams)
    └── API Communication
```

## 🛠️ Установка и запуск

### Предварительные требования
- Python 3.8+
- Node.js 18+
- GitHub Personal Access Token
- Gemini API Key
- Vercel CLI (опционально)

### 1. Agent A (Freelance Search)

```bash
# Клонирование
git clone <repo-url>
cd agent-a

# Установка зависимостей
pip install -r requirements.txt

# Настройка переменных окружения
cp .env.example .env
# Отредактируйте .env файл

# Запуск
python main.py
# Откройте http://localhost:8000
```

### 2. Agent B (MVP Generation)

```bash
# Клонирование
git clone <repo-url>
cd agent-b

# Установка зависимостей
pip install -r requirements.txt

# Настройка переменных окружения
cp .env.example .env
# Отредактируйте .env файл
```

### 3. Объединенная конфигурация

Создайте единый `.env` файл:

```bash
# === AGENT A ===
MODE=full
SEARCH_KEYWORDS=бот,данные,скрипт,парсер,api
KWORK_EMAIL=your_email@kwork.ru
KWORK_PASSWORD=your_password
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHANNEL_ID=@your_channel

# === AGENT B ===
GEMINI_API_KEY=your_gemini_key
GITHUB_USER=your_github_user
GITHUB_TOKEN=your_github_token
AGENT_B_TEST_MODE=true
AGENT_B_TEST_REPO=ai-mvp-test

# === SHARED ===
LOG_LEVEL=INFO
MAX_RETRIES=3
REQUEST_TIMEOUT=30
```

## 🎨 Доступные шаблоны MVP

### 🤖 Telegram Bots
- **Shop Assistant**: Интернет-магазин с каталогом, корзиной, оформлением заказов
- **Support Bot**: Система техподдержки с базой знаний

### 🕷️ Parsers
- **News Parser**: Сбор и анализ новостей с визуализацией
- **Product Parser**: Парсинг цен и товаров

### 📊 Dashboards
- **Analytics Dashboard**: Визуализация данных и метрик
- **Monitoring Board**: Система мониторинга и алертов

### 🔗 Integrations
- **API Client**: REST API клиент с документацией
- **Webhook Handler**: Обработчик webhook'ов

## 🚀 Использование

### Agent A Dashboard
1. Откройте веб-интерфейс Agent A
2. Запустите поиск проектов
3. Просматривайте найденные проекты в real-time
4. Используйте секцию "Генерация MVP" для создания прототипов

### Генерация MVP
1. Введите описание проекта в Agent A
2. Нажмите "🎯 Сгенерировать MVP"
3. AI выберет подходящий шаблон
4. MVP будет создан и развернут на Vercel

## 🔒 Безопасность MVP

- **Моковые данные**: Все приложения используют безопасные тестовые данные
- **Watermarks**: "DEMO VERSION" на всех страницах
- **Limited functionality**: Только демонстрация интерфейсов
- **No real APIs**: Нет подключения к реальным сервисам

## 💰 Бизнес-модель

### MVP как лид-магнит
1. **Показать готовый продукт** (60-80% функциональности)
2. **Демонстрировать возможности** (работающий интерфейс)
3. **Создать желание доплатить** (ограничения демо-версии)

### Ценообразование
- **MVP Generation**: $50-100 (шаблон + кастомизация)
- **Full Development**: $200-500 (реальные API + данные)
- **Maintenance**: $50/месяц

## 📊 Метрики успеха

- **Template Selection Accuracy**: 85%+ правильный выбор шаблона
- **MVP Generation Time**: < 5 минут
- **Conversion Rate**: 30%+ переход с MVP на полную разработку
- **User Satisfaction**: 4.5+ звезд

## 🔄 CI/CD Pipeline

```
Project Request → Agent A Analysis → Template Selection →
MVP Generation → GitHub Push → Vercel Deploy → Client Demo
```

## 🧪 Тестирование

```bash
# Unit tests
pytest tests/

# Integration tests
pytest tests/integration/

# E2E tests
pytest tests/e2e/
```

## 📚 API Documentation

### Agent A API
- `GET /` - Dashboard
- `POST /agent/start` - Запуск поиска
- `GET /status` - Статус агента
- `POST /api/generate-mvp` - Генерация MVP

### Agent B API
- Template selection через AI
- Project customization
- GitHub/Vercel integration

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new templates
4. Ensure all tests pass
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**🚀 Powered by AI Multi-Agent System**