import { useState, useEffect } from 'react';
import { TrendingUp, Newspaper, Clock, Users } from 'lucide-react';
import { mockNewsStats, mockRecentNews } from '../mock-data/newsData';

export default function NewsDashboard({ filters }) {
  const [stats, setStats] = useState(mockNewsStats);
  const [recentNews, setRecentNews] = useState(mockRecentNews.slice(0, 5));

  // Update stats based on filters
  useEffect(() => {
    let filteredNews = mockRecentNews;

    if (filters.keyword) {
      filteredNews = filteredNews.filter(news =>
        news.title.toLowerCase().includes(filters.keyword.toLowerCase()) ||
        news.content.toLowerCase().includes(filters.keyword.toLowerCase())
      );
    }

    if (filters.category !== 'all') {
      filteredNews = filteredNews.filter(news => news.category === filters.category);
    }

    // Update stats
    const newStats = {
      ...mockNewsStats,
      totalArticles: filteredNews.length,
      newToday: filteredNews.filter(news => {
        const today = new Date().toDateString();
        return new Date(news.publishedAt).toDateString() === today;
      }).length
    };

    setStats(newStats);
    setRecentNews(filteredNews.slice(0, 5));
  }, [filters]);

  const statCards = [
    {
      title: 'Всего статей',
      value: stats.totalArticles,
      icon: Newspaper,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Новых сегодня',
      value: stats.newToday,
      icon: TrendingUp,
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      title: 'Источников',
      value: stats.sourcesCount,
      icon: Users,
      color: 'bg-purple-500',
      change: '0%'
    },
    {
      title: 'Обновлено',
      value: stats.lastUpdate,
      icon: Clock,
      color: 'bg-orange-500',
      change: 'только что'
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Дашборд новостей</h1>
        <p className="text-gray-600">
          Мониторинг и анализ новостного потока в реальном времени
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className={`text-sm ${stat.change.includes('+') ? 'text-green-600' : 'text-gray-600'}`}>
                  {stat.change}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent News */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">📰 Последние новости</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {recentNews.map((news, index) => (
            <div key={index} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                      news.category === 'technology' ? 'bg-blue-100 text-blue-800' :
                      news.category === 'business' ? 'bg-green-100 text-green-800' :
                      news.category === 'politics' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {news.category}
                    </span>
                    <span className="text-sm text-gray-500">{news.source}</span>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-500">
                      {new Date(news.publishedAt).toLocaleTimeString('ru-RU')}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {news.title}
                  </h3>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {news.content}
                  </p>

                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>👁️ {news.views} просмотров</span>
                    <span>❤️ {news.likes} лайков</span>
                    <span>💬 {news.comments} комментариев</span>
                  </div>
                </div>

                {news.image && (
                  <div className="ml-4 flex-shrink-0">
                    <img
                      src={news.image}
                      alt={news.title}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-gray-200">
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Посмотреть все новости →
          </button>
        </div>
      </div>

      {/* Demo Notice */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-2xl">ℹ️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Это демо-версия дашборда
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                В полной версии будут подключены реальные источники новостей,
                автоматическое обновление, продвинутая аналитика и экспорт данных.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
