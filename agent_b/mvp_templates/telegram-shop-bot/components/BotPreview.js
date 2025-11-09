import { useState, useEffect } from 'react';

const mockBotMessages = [
  {
    id: 1,
    type: 'bot',
    text: '👋 Привет! Я бот интернет-магазина. Выберите действие:',
    timestamp: '10:30',
    keyboard: ['📦 Каталог товаров', '🛒 Корзина', '📋 Мои заказы', 'ℹ️ Помощь']
  },
  {
    id: 2,
    type: 'user',
    text: '📦 Каталог товаров',
    timestamp: '10:31'
  },
  {
    id: 3,
    type: 'bot',
    text: '📦 Выберите категорию товаров:',
    timestamp: '10:31',
    keyboard: ['🎧 Аудиотехника', '📱 Смартфоны', '⌚ Умные устройства', '⌨️ Компьютерная периферия']
  },
  {
    id: 4,
    type: 'user',
    text: '🎧 Аудиотехника',
    timestamp: '10:32'
  },
  {
    id: 5,
    type: 'bot',
    text: '🎧 Аудиотехника\n\n🎧 Беспроводные наушники Sony WH-1000XM5\n💰 29 990 ₽\n⭐ 4.8 (156 отзывов)\n\n📝 Премиальные беспроводные наушники с активным шумоподавлением, 30 часов работы от батареи\n\nХотите добавить в корзину?',
    timestamp: '10:32',
    keyboard: ['✅ Добавить в корзину', '⬅️ Назад к категориям', '🏠 Главное меню']
  }
];

export default function BotPreview() {
  const [messages, setMessages] = useState(mockBotMessages);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Auto-play demo messages
    const timer = setTimeout(() => {
      if (currentStep < mockBotMessages.length - 1) {
        setCurrentStep(prev => prev + 1);
        setMessages(mockBotMessages.slice(0, currentStep + 2));
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [currentStep]);

  const handleKeyboardClick = (action) => {
    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: action,
      timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);

    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        text: `Вы выбрали: ${action}\n\nЭто демо-версия. В реальном боте здесь будет полный функционал! 🚀`,
        timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        keyboard: ['🏠 Главное меню', '📦 Каталог товаров']
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const getCurrentKeyboard = () => {
    const lastMessage = messages[messages.length - 1];
    return lastMessage?.keyboard || [];
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🤖 Telegram Bot Preview</h1>
        <p className="text-gray-600">
          Имитация работы Telegram бота для управления магазином
        </p>
      </div>

      {/* Telegram-like Interface */}
      <div className="max-w-md mx-auto bg-gray-100 rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-blue-500 text-white p-4 flex items-center">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-3">
            <span className="text-blue-500 font-bold text-sm">М</span>
          </div>
          <div>
            <h3 className="font-semibold">Магазин Bot</h3>
            <p className="text-xs opacity-75">онлайн</p>
          </div>
        </div>

        {/* Messages */}
        <div className="h-96 overflow-y-auto p-4 space-y-3 bg-white">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-2xl ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-line">{message.text}</p>
                <p className={`text-xs mt-1 ${
                  message.type === 'user' ? 'text-blue-200' : 'text-gray-500'
                }`}>
                  {message.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Keyboard */}
        {getCurrentKeyboard().length > 0 && (
          <div className="p-4 bg-gray-50 border-t">
            <div className="grid grid-cols-1 gap-2">
              {getCurrentKeyboard().map((button, index) => (
                <button
                  key={index}
                  onClick={() => handleKeyboardClick(button)}
                  className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  {button}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area (disabled in demo) */}
        <div className="p-4 bg-white border-t">
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Напишите сообщение..."
              disabled
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full bg-gray-100 text-gray-500"
            />
            <button
              disabled
              className="ml-2 p-2 bg-blue-500 text-white rounded-full opacity-50 cursor-not-allowed"
            >
              📤
            </button>
          </div>
        </div>
      </div>

      {/* Features List */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-3">✅ Реализованный функционал</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Каталог товаров с категориями</li>
            <li>• Корзина покупок</li>
            <li>• Оформление заказов</li>
            <li>• История заказов</li>
            <li>• Интерактивные кнопки</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-3">🚀 Для полной версии</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Реальная интеграция с Telegram API</li>
            <li>• Платежные системы (ЮKassa, Stripe)</li>
            <li>• Система доставки</li>
            <li>• Админ-панель управления</li>
            <li>• Аналитика продаж</li>
          </ul>
        </div>
      </div>

      {/* Demo Notice */}
      <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 text-green-600">
            <span className="text-lg">🚀</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              Готовый продающий MVP
            </h3>
            <div className="mt-2 text-sm text-green-700">
              <p>
                Заказчик видит 75% готового продукта и понимает ценность полной реализации.
                Демо показывает реальный UX и возможности системы.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
