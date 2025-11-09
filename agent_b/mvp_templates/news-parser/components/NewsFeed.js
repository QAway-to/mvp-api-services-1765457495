import { useState } from 'react';
import { mockRecentNews } from '../mock-data/newsData';

export default function NewsFeed({ filters }) {
  const [selectedArticle, setSelectedArticle] = useState(null);

  const filteredNews = mockRecentNews.filter(news => {
    if (filters.keyword && !news.title.toLowerCase().includes(filters.keyword.toLowerCase())) {
      return false;
    }
    if (filters.category !== 'all' && news.category !== filters.category) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">📰 Лента новостей</h1>
        <div className="text-sm text-gray-600">
          Показано {filteredNews.length} новостей
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* News List */}
        <div className="space-y-4">
          {filteredNews.map((news, index) => (
            <div
              key={news.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedArticle?.id === news.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedArticle(news)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900 line-clamp-2">
                  {news.title}
                </h3>
                <span className={`inline-block px-2 py-1 text-xs rounded ${
                  news.category === 'technology' ? 'bg-blue-100 text-blue-800' :
                  news.category === 'business' ? 'bg-green-100 text-green-800' :
                  news.category === 'politics' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {news.category}
                </span>
              </div>

              <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                {news.content}
              </p>

              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{news.source}</span>
                <span>{new Date(news.publishedAt).toLocaleDateString('ru-RU')}</span>
              </div>

              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                <span>👁️ {news.views}</span>
                <span>❤️ {news.likes}</span>
                <span>💬 {news.comments}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Article Detail */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          {selectedArticle ? (
            <div>
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedArticle.title}
                </h2>
                <span className={`inline-block px-2 py-1 text-xs rounded ${
                  selectedArticle.category === 'technology' ? 'bg-blue-100 text-blue-800' :
                  selectedArticle.category === 'business' ? 'bg-green-100 text-green-800' :
                  selectedArticle.category === 'politics' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedArticle.category}
                </span>
              </div>

              <div className="text-sm text-gray-600 mb-4">
                <span className="font-medium">{selectedArticle.source}</span> •
                <span className="ml-2">{new Date(selectedArticle.publishedAt).toLocaleString('ru-RU')}</span>
              </div>

              <div className="prose prose-sm mb-6">
                <p className="text-gray-700 leading-relaxed">
                  {selectedArticle.content}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>👁️ {selectedArticle.views} просмотров</span>
                  <span>❤️ {selectedArticle.likes} лайков</span>
                  <span>💬 {selectedArticle.comments} комментариев</span>
                </div>

                <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
                  Читать полностью
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">📰</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Выберите новость
              </h3>
              <p className="text-gray-600">
                Нажмите на любую новость слева, чтобы прочитать полную версию
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Demo Notice */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 text-blue-600">
            <span className="text-lg">ℹ️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Это демо-версия новостной ленты
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                В полной версии будут подключены реальные источники новостей,
                автоматическое обновление, фильтрация по ключевым словам и экспорт данных.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
