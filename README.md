# API Services MVP

Шаблон для управления интеграциями с внешними API. Предоставляет удобную структуру для работы с различными API сервисами.

<!-- Updated for Vercel deployment -->

## Структура

```
api-services/
├── pages/
│   ├── index.js              # Главная страница с выбором API
│   ├── shopify/
│   │   └── index.js          # Страница Shopify Webhook
│   ├── wayback/
│   │   └── index.js          # Страница Wayback Machine
│   └── api/
│       ├── send-to-bitrix.js # API endpoint для отправки в Bitrix
│       ├── webhook/
│       │   └── shopify.js    # Webhook endpoint для Shopify
│       └── wayback/
│           └── index.js      # API endpoint для Wayback Machine
├── src/
│   ├── lib/
│   │   └── adapters/
│   │       ├── shopify/      # Адаптер Shopify
│   │       └── wayback/      # Адаптер Wayback Machine
│   ├── components/
│   │   ├── ApiCard.js        # Карточка для выбора API
│   │   ├── shopify/          # Компоненты для Shopify
│   │   └── wayback/          # Компоненты для Wayback Machine
│   └── styles/
│       └── global.css        # Глобальные стили
└── package.json
```

## Установка и запуск

```bash
npm install
npm run dev
```

Приложение будет доступно на `http://localhost:3000`

## Реализованные API

### 🛍️ Shopify Webhook

Интеграция с Shopify для приема и обработки webhook событий. Позволяет:
- Получать webhook события от Shopify в реальном времени
- Просматривать детали заказов (товары, цены, покупатели)
- Выбирать и отправлять выбранные события в Bitrix24

**Использование:**
1. Откройте главную страницу
2. Выберите "Shopify Webhook"
3. Настройте webhook URL в Shopify на: `https://your-domain.vercel.app/api/webhook/shopify`
4. Выберите нужные события чекбоксами
5. Нажмите "Отправить в Bitrix" для отправки выбранных событий

### 📚 Wayback Machine

Интеграция с Wayback Machine для анализа исторических данных сайтов. Позволяет:
- Поиск архивных снимков сайтов через CDX API
- Получение HTML конкретного снимка
- Тестирование интеграции

**Использование:**
1. Откройте главную страницу
2. Выберите "Wayback Machine"
3. Введите URL или домен (например: `example.com`)
4. Нажмите "Test Wayback Machine"

## Добавление нового API

Чтобы добавить новый API:

1. **Создайте адаптер** в `src/lib/adapters/your-api/`:
   ```javascript
   // src/lib/adapters/your-api/index.js
   export class YourApiAdapter {
     getName() { return 'your-api'; }
     async yourMethod() { /* ... */ }
   }
   export const yourApiAdapter = new YourApiAdapter();
   ```

2. **Создайте API endpoint** в `pages/api/your-api/index.js`:
   ```javascript
   import { yourApiAdapter } from '../../../../src/lib/adapters/your-api/index.js';
   
   export default async function handler(req, res) {
     // Обработка запроса
   }
   ```

3. **Создайте UI компоненты** в `src/components/your-api/`:
   - Форма для ввода параметров
   - Компонент для отображения результатов
   - Логи (опционально)

4. **Создайте страницу** в `pages/your-api/index.js`:
   - Интеграция формы и результатов
   - Обработка ошибок
   - Логирование

5. **Добавьте карточку** на главную страницу (`pages/index.js`):
   ```javascript
   {
     icon: '🔌',
     title: 'Your API',
     description: 'Описание вашего API',
     href: '/your-api',
     status: 'ready',
   }
   ```

## Архитектура

- **Адаптеры** - содержат всю бизнес-логику работы с API
- **API Endpoints** - Next.js API routes для серверной части
- **Компоненты** - React компоненты для UI
- **Страницы** - Next.js pages, объединяющие компоненты

## Стили

Шаблон использует темную тему в стиле `email-campaign-manager`. Все стили находятся в `src/styles/global.css`.

## Deploy

Шаблон готов к деплою на Vercel. Файл `vercel.json` уже настроен.

**Настройка webhook в Shopify:**
1. В админке Shopify перейдите в Settings > Notifications > Webhooks
2. Создайте новый webhook для события "Order creation"
3. URL: `https://your-vercel-app.vercel.app/api/webhook/shopify`
4. Format: JSON

## License

MIT

