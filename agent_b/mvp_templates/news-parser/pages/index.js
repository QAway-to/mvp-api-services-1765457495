import { useState } from 'react';
import Head from 'next/head';
import NewsDashboard from '../components/NewsDashboard';
import NewsFeed from '../components/NewsFeed';
import AnalyticsPanel from '../components/AnalyticsPanel';
import ExportPanel from '../components/ExportPanel';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filters, setFilters] = useState({
    keyword: '',
    category: 'all',
    dateRange: 'today'
  });

  const tabs = [
    { id: 'dashboard', name: '📊 Дашборд', component: NewsDashboard },
    { id: 'feed', name: '📰 Лента новостей', component: NewsFeed },
    { id: 'analytics', name: '📈 Аналитика', component: AnalyticsPanel },
    { id: 'export', name: '📤 Экспорт', component: ExportPanel }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>News Parser MVP - Demo</title>
        <meta name="description" content="Demo version of News Parser Dashboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">📰 News Parser</h1>
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                DEMO VERSION
              </span>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Поиск по ключевым словам..."
                value={filters.keyword}
                onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Все категории</option>
                <option value="technology">Технологии</option>
                <option value="business">Бизнес</option>
                <option value="politics">Политика</option>
                <option value="sports">Спорт</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ActiveComponent filters={filters} />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-500 text-sm">
              🚀 News Parser MVP - Demo Version
            </p>
            <p className="text-gray-400 text-xs mt-2">
              Для полной версии с реальным парсингом и аналитикой свяжитесь с разработчиком
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
