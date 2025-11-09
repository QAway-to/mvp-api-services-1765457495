const metrics = {
  kpis: [
    {
      title: 'Конверсия',
      value: '4.7%',
      trend: 18,
      description: 'Рост заявок после обновления лендинга'
    },
    {
      title: 'Активные клиенты',
      value: '1 248',
      trend: 12,
      description: 'Количество уникальных пользователей за месяц'
    },
    {
      title: 'Средний чек',
      value: '12 400 ₽',
      trend: 9,
      description: 'Средний доход на клиента (ARPU)'
    }
  ],
  conversion: [
    { label: 'Пн', value: 3.1 },
    { label: 'Вт', value: 3.8 },
    { label: 'Ср', value: 4.2 },
    { label: 'Чт', value: 4.5 },
    { label: 'Пт', value: 4.7 },
    { label: 'Сб', value: 4.9 },
    { label: 'Вс', value: 5.1 }
  ],
  activity: [
    { label: 'Неделя 1', value: 860 },
    { label: 'Неделя 2', value: 980 },
    { label: 'Неделя 3', value: 1120 },
    { label: 'Неделя 4', value: 1248 }
  ],
  events: [
    {
      time: '10:45',
      title: 'Подключен новый источник данных',
      description: 'CRM Bitrix24 синхронизирована с аналитикой'
    },
    {
      time: '09:20',
      title: 'Рост конверсии на 6%',
      description: 'A/B тестирование новой формы заявки'
    },
    {
      time: 'Вчера',
      title: 'Построен отчёт для маркетинга',
      description: 'Доступен дашборд эффективности рекламных кампаний'
    }
  ]
};

export default metrics;
