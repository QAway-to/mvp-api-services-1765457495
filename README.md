<<<<<<< HEAD
# 🤖 AI Multi-Agent MVP Generation System

[![Python](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/fastapi-0.104+-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/react-18+-61dafb.svg)](https://reactjs.org/)
[![Next.js](https://img.shields.io/badge/next.js-14+-000000.svg)](https://nextjs.org/)

## 🚀 Описание

Унифицированная система AI-powered генерации MVP (Minimum Viable Products) на основе описаний проектов. Объединяет два агента:

- **Agent A**: Поиск и квалификация проектов на фриланс-платформах
- **Agent B**: Генерация продающих MVP с 60-80% готовности

## 🏗️ Архитектура

```
ai-multiagent-mvp-system/
├── 📁 agent_a/                 # Freelance Search Agent
│   ├── main.py                 # FastAPI веб-приложение
│   ├── agents/agent_a.py       # Core поисковый агент
│   ├── templates/dashboard.html # Веб-интерфейс
│   └── evaluation/             # AI-оценка проектов
├── 📁 agent_b/                 # MVP Generation Agent
│   ├── template_selector.py    # AI выбор шаблонов
│   ├── mvp_generator.py        # Генерация приложений
│   ├── mvp_templates/          # Шаблоны MVP
│   └── architect_agent.py      # Архитектор проектов
├── 📁 shared/                  # Общие компоненты
│   ├── config.py               # Унифицированная конфигурация
│   └── logger.py               # Логирование
└── 📁 docs/                    # Документация
```

## 🎯 Возможности

### 🤖 Agent A (Freelance Search)
- 🔍 Автоматизированный поиск проектов на Kwork
- 📊 AI-оценка релевантности через Gemini
- 📱 Веб-dashboard с real-time логами
- 🚀 Интеграция с Telegram для уведомлений
- 📦 API для управления и получения данных

### 🎨 Agent B (MVP Generation)
- 🧠 AI-powered выбор шаблонов (семантический анализ)
- 📱 Каталог готовых шаблонов (Telegram bots, parsers, dashboards)
- ⚡ Быстрая генерация (шаблоны + AI кастомизация)
- 🚀 Автоматический деплой на Vercel
- 💰 Продающие MVP с моковыми данными

## 🛠️ Быстрый старт
=======
# 🤖 Freelance Agents MVP

Минимальный жизнеспособный продукт для автоматизации поиска проектов на Kwork с оценкой релевантности и отправкой уведомлений в Telegram.

## 🎯 Возможности

- 🔍 **Поиск проектов** на Kwork по ключевому слову "бот"
- 📊 **Оценка релевантности** на основе алгоритма (ключевые слова, бюджет, описание)
- 📱 **Real-time dashboard** с логами и управлением
- 📢 **Telegram уведомления** о подходящих проектах
- 🚀 **Автоматический деплой** на Render

## 🚀 Быстрый старт
>>>>>>> 9da0c3e (Initial MVP implementation with real-time dashboard)

### 1. Клонирование и установка

```bash
<<<<<<< HEAD
git clone <repository-url>
cd ai-multiagent-mvp-system
=======
git clone <your-repo-url>
cd freelance-mvp

# Создание виртуального окружения
python -m venv venv
venv\Scripts\activate  # Windows
# или
source venv/bin/activate  # Linux/Mac
>>>>>>> 9da0c3e (Initial MVP implementation with real-time dashboard)

# Установка зависимостей
pip install -r requirements.txt
```

<<<<<<< HEAD
### 2. Конфигурация

Создайте `.env` файл на основе `env-example.txt`:

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
```

### 3. Запуск Agent A

```bash
cd agent_a
python main.py
# Откройте http://localhost:8000
```

### 4. Запуск Agent B (опционально)

```bash
cd agent_b
python main.py
```

## 🎨 MVP Шаблоны

### 🤖 Telegram Bots
- **Shop Assistant**: Интернет-магазин с корзиной и оформлением заказов
- **Support Bot**: Система техподдержки с базой знаний

### 🕷️ Parsers
- **News Parser**: Дашборд для анализа новостей
- **Product Parser**: Парсер цен и товаров

### 📊 Analytics
- **Dashboard**: Визуализация данных и метрик

## 🔄 Рабочий процесс

1. **Agent A** находит и квалифицирует проекты
2. **Agent A** отправляет данные через API
3. **Agent B** анализирует описание через AI
4. **Agent B** выбирает подходящий шаблон
5. **Agent B** генерирует MVP с кастомизацией
6. **Agent B** пушит на GitHub и деплоит на Vercel
7. **Заказчик** получает ссылку на готовый MVP

## 💰 Бизнес-модель

### MVP как лид-магнит:
1. **Показать готовый продукт** (60-80% функциональности)
2. **Демонстрировать возможности** (работающий интерфейс)
3. **Создать желание доплатить** (ограничения демо-версии)

### Ценообразование:
- **MVP Generation**: $50-100
- **Full Development**: $200-500
- **ROI**: 30%+ конверсия

## 🔒 Безопасность

- **Моковые данные**: Все приложения используют безопасные тестовые данные
- **Watermarks**: "DEMO VERSION" на всех страницах
- **Limited functionality**: Только демонстрация интерфейсов
- **No real APIs**: Нет подключения к реальным сервисам

## 📊 Мониторинг

### Agent A Dashboard:
- Real-time логи всех операций
- Статистика найденных проектов
- Управление поиском (старт/стоп)
- Генерация MVP через UI

### Agent B Metrics:
- AI accuracy выбора шаблонов
- Время генерации MVP
- Успешность деплоя
- Конверсия в продажи

## 🧪 Тестирование

```bash
# Unit tests
pytest agent_a/tests/
pytest agent_b/tests/

# Integration tests
pytest tests/integration/

# E2E tests
pytest tests/e2e/
```

## 🚀 Деплой

### Agent A (Railway/Render):
```bash
cd agent_a
# Dockerfile уже настроен для production
```

### Agent B (GitHub Actions):
- Автоматический деплой MVP на Vercel
- CI/CD через GitHub Actions

## 📚 API Documentation

### Agent A API
- `GET /` - Dashboard
- `POST /agent/start` - Запуск поиска
- `GET /status` - Статус агента
- `POST /api/generate-mvp` - Генерация MVP

### Agent B API
- MVP generation через template selector
- GitHub/Vercel deployment hooks

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new templates
4. Ensure all tests pass
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**🚀 Powered by AI Multi-Agent MVP Generation System**
=======
### 2. Настройка переменных окружения

Создайте файл `.env` на основе `env.example`:

```bash
# Для демо-режима (без реального Kwork)
MODE=demo

# Для полного режима (с Kwork)
MODE=full
KWORK_EMAIL=your_email@kwork.ru
KWORK_PASSWORD=your_password

# Telegram бот (опционально)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHANNEL_ID=@your_channel
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

## 🏗️ Архитектура

```
freelance-mvp/
├── main.py                 # FastAPI сервер
├── config.py              # Конфигурация
├── agents/
│   └── agent_a.py         # Агент поиска на Kwork
├── evaluation/
│   └── evaluator.py       # Оценка проектов
├── telegram_bot.py        # Telegram уведомления
├── utils/
│   └── logger.py          # Система логирования
├── templates/
│   └── dashboard.html     # Веб-интерфейс
├── static/
│   ├── css/style.css      # Стили
│   └── js/dashboard.js    # JavaScript
└── requirements.txt
```

## 🔧 Настройка деплоя на Render

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

### 3. Дополнительные настройки
- **Plan**: Starter ($7/месяц) для постоянной работы
- **Region**: Выберите ближайший
- **Health Check**: `/status`

### 4. Переменные окружения
В настройках сервиса добавьте:
```
MODE=demo
LOG_LEVEL=INFO
SEARCH_KEYWORD=бот
```

## 📊 Dashboard

Веб-интерфейс доступен по адресу вашего деплоя и предоставляет:

- **Статус агента** в реальном времени
- **Управление** (запуск/остановка)
- **Статистика** найденных проектов
- **Live логи** всех действий агента
- **Real-time обновления** через Server-Sent Events

## 🔍 Алгоритм оценки проектов

Проект считается подходящим если:

1. **Ключевые слова ботов** (вес 0.5):
   - бот, telegram, discord, vk, чатбот, автоматизация

2. **Технические навыки** (вес 0.3):
   - python, javascript, api, webhook

3. **Бюджет** (вес 0.2):
   - Предпочтительно 1000-30000 ₽

4. **Дополнительно**:
   - Отсутствие негативных слов (дизайн, текст, видео)
   - Подробное описание

**Порог релевантности**: 0.7 (70%)

## 🛡️ Безопасность и анти-детект

- **Stealth браузер** с рандомным User-Agent
- **Имитация человека** (паузы, движения мыши)
- **Ограничение сессий** (демо-режим без реального Kwork)
- **Отключение WebRTC** для защиты IP

## 📝 Логи и мониторинг

Все действия логируются с уровнями:
- `INFO`: Основные действия агента
- `WARNING`: Предупреждения
- `ERROR`: Ошибки выполнения
- `DEBUG`: Детальная отладка

Логи доступны:
- В терминале (локально)
- В веб-dashboard (real-time)
- В Render logs (при деплое)

## 🔄 Рабочие режимы

### Demo режим (рекомендуется)
- Без реального доступа к Kwork
- Имитация поиска и оценки
- Полностью безопасно для тестирования

### Full режим
- Реальный поиск на Kwork
- Требует учетных данных
- Соблюдение лимитов для безопасности

## 🚧 Ограничения MVP

- Только поиск по одному ключевому слову
- Базовый алгоритм оценки
- Демо-режим без реальных предложений
- Ограниченная обработка ошибок

## 🛠️ Разработка

### Добавление нового функционала
1. Создайте ветку: `git checkout -b feature/new-feature`
2. Внесите изменения
3. Протестируйте локально
4. Создайте PR на GitHub

### Локальное тестирование
```bash
# Запуск с авто-перезагрузкой
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Запуск тестов (если добавите)
pytest
```

## 📄 Лицензия

MIT License - свободное использование для личных целей.

## 🤝 Поддержка

При возникновении проблем:
1. Проверьте логи в dashboard
2. Убедитесь в корректности `.env` файла
3. Проверьте подключение к интернету
4. Создайте issue в репозитории

---

**Happy freelancing! 🚀**
>>>>>>> 9da0c3e (Initial MVP implementation with real-time dashboard)
