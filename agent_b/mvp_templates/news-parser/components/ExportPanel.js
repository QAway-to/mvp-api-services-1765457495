import { useState } from 'react';

export default function ExportPanel({ filters }) {
  const [exportFormat, setExportFormat] = useState('json');
  const [dateRange, setDateRange] = useState('today');
  const [includeImages, setIncludeImages] = useState(false);

  const handleExport = () => {
    // Mock export functionality
    const exportData = {
      filters,
      format: exportFormat,
      dateRange,
      includeImages,
      timestamp: new Date().toISOString(),
      demo: true
    };

    // Create and download mock file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportLink = document.createElement("a");
    exportLink.setAttribute("href", dataUri);
    exportLink.setAttribute("download", `news-export-${Date.now()}.${exportFormat}`);
    exportLink.click();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">📤 Экспорт данных</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Export Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Настройки экспорта</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Формат файла
              </label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
                <option value="xml">XML</option>
                <option value="pdf">PDF (Отчет)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Период времени
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="today">Сегодня</option>
                <option value="yesterday">Вчера</option>
                <option value="week">Последняя неделя</option>
                <option value="month">Последний месяц</option>
                <option value="custom">Произвольный период</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeImages"
                checked={includeImages}
                onChange={(e) => setIncludeImages(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="includeImages" className="ml-2 text-sm text-gray-700">
                Включить изображения (увеличивает размер файла)
              </label>
            </div>

            <button
              onClick={handleExport}
              className="w-full bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 transition-colors font-semibold flex items-center justify-center space-x-2"
            >
              <span>📥</span>
              <span>Экспортировать данные</span>
            </button>
          </div>
        </div>

        {/* Export Preview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Предварительный просмотр</h2>

          <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
            <div className="text-gray-600 mb-2">Пример структуры экспорта:</div>
            <pre className="text-xs overflow-x-auto">
{`{
  "metadata": {
    "exported_at": "2025-01-09T12:00:00Z",
    "format": "${exportFormat}",
    "total_articles": 25,
    "filters_applied": {
      "keyword": "${filters.keyword || 'none'}",
      "category": "${filters.category}"
    }
  },
  "articles": [
    {
      "id": "article_1",
      "title": "Пример заголовка новости",
      "content": "Полный текст новости...",
      "category": "${filters.category === 'all' ? 'technology' : filters.category}",
      "source": "Example Source",
      "published_at": "2025-01-09T10:30:00Z",
      "metrics": {
        "views": 1250,
        "likes": 45,
        "comments": 12
      }
    }
  ]
}`}
            </pre>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <div className="flex justify-between mb-1">
              <span>Ожидаемый размер файла:</span>
              <span>~{exportFormat === 'pdf' ? '2.5' : '1.2'} MB</span>
            </div>
            <div className="flex justify-between">
              <span>Количество записей:</span>
              <span>25 статей</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Exports */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Недавние экспорты</h2>

        <div className="space-y-3">
          {[
            { name: 'news-export-daily.json', size: '1.2 MB', date: '2 часа назад' },
            { name: 'tech-news-week.csv', size: '3.8 MB', date: 'вчера' },
            { name: 'business-report.pdf', size: '2.1 MB', date: '3 дня назад' }
          ].map((export_item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">
                  {export_item.name.endsWith('.json') ? '📄' :
                   export_item.name.endsWith('.csv') ? '📊' : '📕'}
                </span>
                <div>
                  <div className="font-medium">{export_item.name}</div>
                  <div className="text-sm text-gray-600">{export_item.date}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">{export_item.size}</div>
                <button className="text-blue-600 hover:text-blue-800 text-sm">
                  Скачать снова
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Demo Notice */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 text-blue-600">
            <span className="text-lg">📤</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Это демо-версия экспорта
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                В полной версии будет настоящий экспорт данных в различные форматы,
                планировщик автоматических экспортов и интеграция с облачными хранилищами.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
