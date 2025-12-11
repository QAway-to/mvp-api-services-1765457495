# Инструкция по деплою Telegram Channel Monitor

## Быстрый деплой на Vercel

### 1. Подготовка

```bash
cd telegram-channel-monitor
npm install
```

### 2. Деплой через Vercel CLI

```bash
# Установите Vercel CLI (если еще не установлен)
npm i -g vercel

# Войдите в аккаунт
vercel login

# Деплой
vercel

# Для production
vercel --prod
```

### 3. Настройка переменных окружения в Vercel

1. Перейдите в настройки проекта на Vercel
2. Откройте раздел "Environment Variables"
3. Добавьте переменную:
   - **Name**: `TELEGRAM_BOT_SERBIA`
   - **Value**: токен бота из Render (уже есть в переменных Render)

### 4. Проверка деплоя

После деплоя приложение будет доступно по адресу:
- `https://your-project-name.vercel.app`

### 5. Настройка Cron Jobs

Cron job автоматически настроен в `vercel.json`:
- Запускается каждый час
- Endpoint: `/api/scan`
- Проверяет доступность Telegram бота

## Структура API

### Каналы
- `GET /api/channels` - список каналов
- `POST /api/channels` - добавить канал
- `GET /api/channels/[id]` - получить канал
- `PATCH /api/channels/[id]` - обновить канал
- `DELETE /api/channels/[id]` - удалить канал

### Правила
- `GET /api/rules` - список правил
- `POST /api/rules` - создать правило
- `GET /api/rules/[id]` - получить правило
- `PATCH /api/rules/[id]` - обновить правило
- `DELETE /api/rules/[id]` - удалить правило

### Совпадения
- `GET /api/matches` - список совпадений
- `GET /api/stats` - статистика

### Telegram
- `POST /api/telegram` - отправить сообщение через бота

### Сканирование
- `GET /api/scan` - запуск сканирования (cron)

## Важные замечания

1. **Переменная окружения**: `TELEGRAM_BOT_SERBIA` должна быть установлена в Vercel
2. **Cron Jobs**: Работают только на платных планах Vercel (Pro и выше)
3. **Mock данные**: В текущей версии используются mock данные, для продакшена нужна БД

## Локальная разработка

```bash
npm run dev
```

Приложение будет доступно на `http://localhost:3000`

