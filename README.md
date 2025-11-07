# 🤖 AI Multi-Agent MVP Generation System

[![Python](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/fastapi-0.104+-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/react-18+-61dafb.svg)](https://reactjs.org/)
[![Next.js](https://img.shields.io/badge/next.js-14+-000000.svg)](https://nextjs.org/)

## 🚀 Описание

Унифицированная система AI-powered генерации MVP (Minimum Viable Products) на основе описаний проектов. Объединяет два агента:

- **Agent A**: Поиск и квалификация проектов на фриланс-платформах (Kwork)
- **Agent B**: Генерация продающих MVP с 60-80% готовности

## 🏗️ Архитектура

```
ai-multiagent-mvp-system/
├── 📁 agents/                  # Core agents
│   ├── agent_a.py              # Freelance Search Agent
│   └── agent_b.py              # MVP Generation Agent (future)
├── 📁 evaluation/              # AI-оценка проектов
│   └── evaluator.py            # Relevance scoring
├── 📁 shared/                  # Общие компоненты
│   ├── config.py               # Унифицированная конфигурация
│   └── logger.py               # Логирование
├── 📁 templates/               # Web templates
│   └── dashboard.html          # Веб-интерфейс
├── 📁 static/                  # Static assets
│   ├── css/style.css           # Styles
│   └── js/dashboard.js         # JavaScript
└── 📁 docs/                    # Документация
```

## 🎯 Возможности

### 🤖 Agent A (Freelance Search)
- 🔍 Автоматизированный поиск проектов на Kwork
- 📊 AI-оценка релевантности через алгоритмы
- 📱 Веб-dashboard с real-time логами
- 🚀 Интеграция с Telegram для уведомлений
- 📦 API для управления и получения данных

### 🎨 Agent B (MVP Generation - Future)
- 🧠 AI-powered выбор шаблонов (семантический анализ)
- 📱 Каталог готовых шаблонов (Telegram bots, parsers, dashboards)
- ⚡ Быстрая генерация (шаблоны + AI кастомизация)
- 🚀 Автоматический деплой на Vercel
- 💰 Продающие MVP с моковыми данными

## 🛠️ Быстрый старт

### 1. Клонирование и установка

```bash
git clone <repository-url>
cd ai-multiagent-mvp-system

# Создание виртуального окружения
python -m venv venv
venv\Scripts\activate  # Windows
# или
source venv/bin/activate  # Linux/Mac

# Установка зависимостей
pip install -r requirements.txt
```

### 2. Конфигурация

Создайте `.env` файл на основе `env.example`:

```bash
# === AGENT A ===
MODE=demo  # или full для реального поиска на Kwork
SEARCH_KEYWORD=бот  # ключевое слово для поиска проектов
KWORK_EMAIL=your_email@kwork.ru  # требуется только для MODE=full
KWORK_PASSWORD=your_password     # требуется только для MODE=full
TELEGRAM_BOT_TOKEN=your_bot_token  # опционально для уведомлений
TELEGRAM_CHANNEL_ID=@your_channel   # опционально для уведомлений

# === AGENT B (будущий функционал) ===
GEMINI_API_KEY=your_gemini_key
GITHUB_USER=your_github_user
GITHUB_TOKEN=your_github_token

# === SHARED ===
LOG_LEVEL=INFO
MAX_RETRIES=3
```

### 3. Создание Telegram бота (опционально)

1. Напишите [@BotFather](https://t.me/botfather) в Telegram
2. Создайте бота командой `/newbot`
3. Скопируйте токен в `.env`
4. Создайте канал и добавьте бота как администратора
5. Получите channel ID через [@userinfobot](https://t.me/userinfobot)

### 4. Запуск

```bash
# Локальный запуск
python main.py

# Откройте http://localhost:8000 в браузере
```

## 🏗️ Архитектура системы

```
ai-multiagent-mvp-system/
├── main.py                 # FastAPI веб-сервер
├── config.py               # Унифицированная конфигурация
├── agents/agent_a.py       # Freelance Search Agent (Kwork)
├── evaluation/evaluator.py # AI-оценка релевантности проектов
├── telegram_bot.py         # Telegram уведомления
├── utils/logger.py         # Система логирования
├── templates/dashboard.html # Веб-интерфейс
├── static/css/style.css    # Стили
├── static/js/dashboard.js  # JavaScript
└── requirements.txt
```

## 🔧 Деплой на Render

### 1. Создание аккаунта
Перейдите на [render.com](https://render.com) и зарегистрируйтесь.

### 2. Создание веб-сервиса
1. Нажмите "New" → "Web Service"
2. Подключите ваш GitHub репозиторий
3. Настройте параметры:
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python main.py`
   - **Environment Variables**: Добавьте переменные из `.env`

### 3. Переменные окружения для продакшена
```
MODE=demo
LOG_LEVEL=INFO
SEARCH_KEYWORD=бот
```

## 📊 Dashboard и возможности

### Agent A Dashboard:
- **Real-time статус** агента в реальном времени
- **Управление поиском** (запуск/остановка)
- **Статистика проектов** найденных и оцененных
- **Live логи** всех действий агента
- **Server-Sent Events** для мгновенных обновлений

### Алгоритм оценки проектов:
Проект считается подходящим если:

1. **Ключевые слова ботов** (вес 0.5):
   - бот, telegram, discord, vk, чатбот, автоматизация

2. **Технические навыки** (вес 0.3):
   - python, javascript, api, webhook

3. **Бюджет** (вес 0.2):
   - Предпочтительно 1000-30000 ₽

**Порог релевантности**: 0.7 (70%)

## 🎨 Будущие возможности Agent B

### MVP Generation:
- **AI-powered анализ** описаний проектов
- **Автоматический выбор шаблонов** (Telegram bots, parsers, dashboards)
- **Генерация MVP** с 60-80% готовности
- **Автоматический деплой** на Vercel/GitHub

### Шаблоны MVP:
- **🤖 Telegram Bots**: Shop Assistant, Support Bot
- **🕷️ Parsers**: News Parser, Product Parser
- **📊 Analytics**: Dashboard, Data Visualization

## 🛡️ Безопасность

- **Stealth режим** с рандомным User-Agent
- **Имитация человека** (паузы, движения мыши)
- **Демо-режим** без реального доступа к Kwork
- **Анти-детект** меры для безопасного парсинга

## 📝 Мониторинг и логи

Логи доступны с уровнями:
- `INFO`: Основные действия агента
- `WARNING`: Предупреждения
- `ERROR`: Ошибки выполнения
- `DEBUG`: Детальная отладка

## 🔄 Рабочие режимы

### Demo режим (рекомендуется):
- Имитация поиска без реального Kwork
- Полностью безопасно для тестирования
- Идеально для разработки и демонстрации

### Full режим:
- Реальный поиск проектов на Kwork
- Требует учетных данных
- Соблюдение лимитов для безопасности

## 🧪 Тестирование

```bash
# Запуск с авто-перезагрузкой для разработки
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Unit tests (планируется)
pytest tests/

# Локальное тестирование
python main.py
```

## 🚀 Будущий рабочий процесс

1. **Agent A** находит и квалифицирует проекты на Kwork
2. **Agent A** отправляет данные через Telegram/API
3. **Agent B** анализирует описание через AI (Gemini)
4. **Agent B** выбирает подходящий шаблон
5. **Agent B** генерирует MVP с кастомизацией
6. **Agent B** деплоит на GitHub/Vercel
7. **Заказчик** получает ссылку на готовый MVP

## 💰 Бизнес-модель (планируется)

- **MVP Generation**: $50-100 за проект
- **Full Development**: $200-500 за полную разработку
- **ROI**: 30%+ конверсия через демонстрацию

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit pull request

## 📄 License

MIT License - свободное использование для личных целей.

## 🤝 Поддержка

При возникновении проблем:
1. Проверьте логи в dashboard
2. Убедитесь в корректности `.env` файла
3. Проверьте подключение к интернету
4. Создайте issue в репозитории

---

**🚀 Powered by AI Multi-Agent MVP Generation System**
