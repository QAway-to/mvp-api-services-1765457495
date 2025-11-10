const campaigns = [
  {
    id: "spring-promo",
    name: "Весенняя распродажа 2024",
    segment: "Активные клиенты • женская аудитория 25-34",
    status: "running",
    status_label: "Идёт",
    metrics: {
      sent: 18234,
      delivered: 98.4,
      open_rate: 42.6,
      click_rate: 9.8,
      unsubscribe_rate: 0.3,
    },
    automation: [
      {
        id: "step-1",
        title: "День 0 – Анонс распродажи",
        description: "Персонализированное письмо с подборкой товаров.",
        delay: "Отправлено 15 минут назад",
      },
      {
        id: "step-2",
        title: "День 2 – Социальное доказательство",
        description: "Отзывы и кейсы + купон «SPRING24».",
        delay: "Запланировано через 2 дня",
      },
      {
        id: "step-3",
        title: "День 5 – Последний шанс",
        description: "Таймер 12 часов, напоминание в Telegram.",
        delay: "Настроено",
      },
    ],
  },
  {
    id: "welcome-series",
    name: "Welcome-серия для новых подписчиков",
    segment: "Свежие лиды (<7 дней)",
    status: "queued",
    status_label: "В очереди",
    metrics: {
      sent: 0,
      delivered: 0,
      open_rate: 0,
      click_rate: 0,
      unsubscribe_rate: 0,
    },
    automation: [],
  },
];

export default campaigns;

