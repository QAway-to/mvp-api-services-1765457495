# 🚀 Deployment Guide

## Общая архитектура развертывания

```
Internet
    ↓
Load Balancer (nginx/Caddy)
    ↓
┌─────────────────────────────────────┐
│           Agent A                   │
│   (Freelance Search Dashboard)      │
│   - FastAPI + Uvicorn               │
│   - Web Dashboard                   │
│   - Real-time logs                  │
│   - MVP Generation UI               │
│                                     │
│   Railway/Render (Python)           │
│   Port: 8000                        │
└─────────────────────────────────────┘
                  │
                  │ API calls
                  │
┌─────────────────────────────────────┐
│           Agent B                   │
│   (MVP Generation Service)          │
│   - AI Template Selection           │
│   - Code Generation                 │
│   - GitHub Integration              │
│   - Vercel Deployment               │
│                                     │
│   Railway/Render (Python)           │
│   Background service                │
└─────────────────────────────────────┘
                  │
                  │ Git push
                  │
┌─────────────────────────────────────┐
│          GitHub                     │
│   ai-mvp-test repository             │
│   - Public repository               │
│   - Vercel auto-deployment          │
└─────────────────────────────────────┘
                  │
                  │ Auto-deploy
                  │
┌─────────────────────────────────────┐
│          Vercel                     │
│   Generated MVP apps                │
│   - *.vercel.app URLs               │
│   - Client demos                    │
└─────────────────────────────────────┘
```

## Развертывание по компонентам

### 1. Agent A (Freelance Search Dashboard)

#### Railway (Рекомендуется)
```bash
# В корне проекта
railway login
railway init
railway up

# Переменные окружения в Railway Dashboard:
# Все переменные из .env (Agent A + Shared)
```

#### Render
```bash
# В папке agent_a/
# Dockerfile уже настроен
# Настроить переменные окружения в Render Dashboard
```

### 2. Agent B (MVP Generation Service)

#### Railway/Render
```bash
# В папке agent_b/
# Создать отдельный сервис для Agent B
# Переменные: Agent B + Shared
```

### 3. GitHub Repository

```bash
# Создать публичный репозиторий: ai-mvp-test
# Это будет репозиторий для всех генерируемых MVP
```

### 4. Vercel Integration

```bash
# Подключить GitHub к Vercel
# Настроить auto-deployment для ai-mvp-test
# Каждый push будет создавать новый deployment
```

## Переменные окружения

### Обязательные для всех сервисов:
```bash
# Shared
LOG_LEVEL=INFO
MAX_RETRIES=3
REQUEST_TIMEOUT=30

# Database (если используется)
DATABASE_URL=sqlite:///freelance_agent.db
```

### Agent A (Railway/Render):
```bash
# Agent A specific
MODE=demo  # или full
SEARCH_KEYWORDS=бот,данные,скрипт,парсер
KWORK_EMAIL=your_email@kwork.ru
KWORK_PASSWORD=your_password
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHANNEL_ID=@your_channel

# Agent B connection (URL Agent B сервиса)
AGENT_B_URL=https://agent-b-service.railway.app
```

### Agent B (Railway/Render):
```bash
# Agent B specific
GEMINI_API_KEY=your_gemini_key
GITHUB_USER=your_github_user
GITHUB_TOKEN=your_github_token
AGENT_B_TEST_MODE=true
AGENT_B_TEST_REPO=ai-mvp-test

# Vercel (опционально)
VERCEL_DEPLOY_HOOK=https://api.vercel.com/v1/integrations/deploy/...
```

## Мониторинг и логи

### Agent A Dashboard
- Встроенный веб-интерфейс: `/`
- Real-time логи: `/logs/stream`
- API статус: `/status`
- Health check: `/health`

### Agent B
- Логи в Railway/Render dashboard
- Отправка статусов в Agent A через API

### Vercel
- Автоматический мониторинг deployment'ов
- Analytics по использованию

## Безопасность

### Production Checklist:
- [ ] Все секреты в переменных окружения
- [ ] База данных с правильными правами
- [ ] HTTPS включен
- [ ] Rate limiting настроен
- [ ] CORS правильно настроен
- [ ] API ключи защищены

### MVP Security:
- [ ] Watermarks на демо-версиях
- [ ] Ограничение функциональности
- [ ] Временные ссылки (TTL)
- [ ] No real data exposure

## Troubleshooting

### Agent A не запускается:
```bash
# Проверить логи Railway/Render
# Проверить переменные окружения
# Проверить подключение к базе данных
```

### Agent B не генерирует MVP:
```bash
# Проверить Gemini API key
# Проверить GitHub token permissions
# Проверить Vercel webhook
```

### Vercel не деплоит:
```bash
# Проверить GitHub integration
# Проверить repository visibility (public)
# Проверить build logs
```

## Масштабирование

### Для роста нагрузки:
1. **Agent A**: Horizontal scaling через Railway/Render
2. **Agent B**: Queue-based processing (Redis/RabbitMQ)
3. **Database**: PostgreSQL вместо SQLite
4. **CDN**: Для статических ассетов MVP

### Для нескольких команд:
1. **Изоляция**: Разные репозитории для команд
2. **RBAC**: Система прав доступа
3. **Audit**: Логирование всех действий

## Резервное копирование

### Важные данные:
- База данных проектов/офферов
- Сгенерированные MVP (GitHub)
- Конфигурационные файлы
- Логи системы

### Автоматическое бэкапирование:
```bash
# Railway: автоматическое
# Render: через cron jobs
# Database: регулярные дампы
```
