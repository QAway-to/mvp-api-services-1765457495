import { mockAnalyticsData } from '../mock-data/newsData';

export default function AnalyticsPanel({ filters }) {
  const { categories, sources, hourlyActivity } = mockAnalyticsData;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">📈 Аналитика новостей</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Categories Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Распределение по категориям</h2>
          <div className="space-y-3">
            {Object.entries(categories).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`w-3 h-3 rounded ${
                    category === 'technology' ? 'bg-blue-500' :
                    category === 'business' ? 'bg-green-500' :
                    category === 'politics' ? 'bg-red-500' :
                    'bg-gray-500'
                  }`}></span>
                  <span className="capitalize">{category}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        category === 'technology' ? 'bg-blue-500' :
                        category === 'business' ? 'bg-green-500' :
                        category === 'politics' ? 'bg-red-500' :
                        'bg-gray-500'
                      }`}
                      style={{ width: `${(count / Math.max(...Object.values(categories))) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sources Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Источники новостей</h2>
          <div className="space-y-3">
            {Object.entries(sources).map(([source, count]) => (
              <div key={source} className="flex items-center justify-between">
                <span className="text-sm">{source}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${(count / Math.max(...Object.values(sources))) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-6 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Активность по часам</h2>
        <div className="h-64 flex items-end justify-between space-x-1">
          {hourlyActivity.map((hour, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className="bg-blue-500 w-full rounded-t"
                style={{ height: `${(hour.articles / Math.max(...hourlyActivity.map(h => h.articles))) * 200}px` }}
              ></div>
              <span className="text-xs mt-2 text-gray-600">{hour.hour}</span>
              <span className="text-xs text-gray-500">{hour.articles}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Demo Notice */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 text-blue-600">
            <span className="text-lg">📊</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Это демо-версия аналитики
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                В полной версии будет реальный анализ новостного потока,
                интерактивные графики, экспорт отчетов и продвинная фильтрация.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
