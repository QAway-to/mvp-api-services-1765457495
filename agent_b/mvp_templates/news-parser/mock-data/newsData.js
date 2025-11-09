// Mock data for News Parser MVP

export const mockNewsStats = {
  totalArticles: 1247,
  newToday: 23,
  sourcesCount: 15,
  lastUpdate: "2 мин назад"
};

export const mockRecentNews = [
  {
    id: 1,
    title: "OpenAI анонсировала GPT-5 с улучшенным пониманием контекста",
    content: "Компания OpenAI представила пятую версию своего языкового модели GPT-5. Новинка демонстрирует значительные улучшения в понимании контекста и генерации кода. Эксперты отмечают, что модель на 40% лучше справляется с задачами программирования.",
    category: "technology",
    source: "TechCrunch",
    publishedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
    image: "/api/mock-image/tech-1",
    views: 15420,
    likes: 892,
    comments: 234,
    tags: ["AI", "OpenAI", "GPT-5", "технологии"]
  },
  {
    id: 2,
    title: "Apple представила новый MacBook Pro с чипом M4",
    content: "Компания Apple анонсировала обновление линейки MacBook Pro с новым процессором M4. Ноутбук получил улучшенную автономность работы и более производительную графику. Цена стартует от 2499 долларов.",
    category: "technology",
    source: "Apple News",
    publishedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    image: "/api/mock-image/tech-2",
    views: 12890,
    likes: 654,
    comments: 187,
    tags: ["Apple", "MacBook", "M4", "технологии"]
  },
  {
    id: 3,
    title: "Курс биткоина превысил отметку в 100 тысяч долларов",
    content: "Криптовалюта биткоин установила новый исторический максимум, превысив отметку в 100 тысяч долларов. Аналитики связывают рост с увеличением институциональных инвестиций и принятием BTC крупными компаниями.",
    category: "business",
    source: "CoinDesk",
    publishedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 minutes ago
    image: "/api/mock-image/business-1",
    views: 23100,
    likes: 1240,
    comments: 567,
    tags: ["Bitcoin", "криптовалюта", "финансы", "бизнес"]
  },
  {
    id: 4,
    title: "NASA объявило о новом проекте колонизации Марса",
    content: "Космическое агентство NASA представило амбициозный план колонизации Марса к 2040 году. Проект включает строительство постоянной базы и разработку систем жизнеобеспечения для длительного пребывания астронавтов.",
    category: "technology",
    source: "NASA News",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
    image: "/api/mock-image/space-1",
    views: 18750,
    likes: 987,
    comments: 345,
    tags: ["NASA", "Марс", "космос", "технологии"]
  },
  {
    id: 5,
    title: "Международный саммит по климату собрал лидеров 50 стран",
    content: "В Давосе завершился международный саммит по климату, где лидеры 50 стран мира обсудили меры по борьбе с глобальным потеплением. Были достигнуты соглашения о сокращении выбросов CO2 на 30% к 2030 году.",
    category: "politics",
    source: "Reuters",
    publishedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 1.5 hours ago
    image: "/api/mock-image/politics-1",
    views: 15200,
    likes: 756,
    comments: 298,
    tags: ["климат", "экология", "саммит", "политика"]
  },
  {
    id: 6,
    title: "Tesla представила новый кибертрак Semi",
    content: "Компания Tesla анонсировала обновленную версию электрического грузовика Semi. Новый Cybertruck Semi получил увеличенный запас хода и улучшенную систему автономного вождения.",
    category: "business",
    source: "Tesla Motors",
    publishedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    image: "/api/mock-image/business-2",
    views: 14500,
    likes: 623,
    comments: 189,
    tags: ["Tesla", "Cybertruck", "электромобили", "бизнес"]
  },
  {
    id: 7,
    title: "Чемпионат мира по футболу: неожиданная победа",
    content: "В матче группового этапа чемпионата мира по футболу команда underdog одержала сенсационную победу над фаворитом. Этот результат стал главным сюрпризом турнира на данный момент.",
    category: "sports",
    source: "Sports News",
    publishedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
    image: "/api/mock-image/sports-1",
    views: 19800,
    likes: 1120,
    comments: 423,
    tags: ["футбол", "чемпионат мира", "спорт"]
  },
  {
    id: 8,
    title: "Google анонсировала революционный ИИ для медицины",
    content: "Компания Google представила новую ИИ-систему для диагностики заболеваний. Технология демонстрирует точность 98% в выявлении раковых образований на ранних стадиях.",
    category: "technology",
    source: "Google AI Blog",
    publishedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4 hours ago
    image: "/api/mock-image/health-1",
    views: 22100,
    likes: 1340,
    comments: 678,
    tags: ["Google", "ИИ", "медицина", "диагностика"]
  }
];

export const mockAnalyticsData = {
  categories: {
    technology: 35,
    business: 25,
    politics: 20,
    sports: 12,
    health: 8
  },
  sources: {
    "TechCrunch": 120,
    "Reuters": 95,
    "CoinDesk": 78,
    "NASA News": 65,
    "Sports News": 52
  },
  hourlyActivity: [
    { hour: '00:00', articles: 12 },
    { hour: '04:00', articles: 8 },
    { hour: '08:00', articles: 45 },
    { hour: '12:00', articles: 67 },
    { hour: '16:00', articles: 89 },
    { hour: '20:00', articles: 56 }
  ]
};
