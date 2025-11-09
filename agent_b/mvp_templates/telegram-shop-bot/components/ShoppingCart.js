import { Minus, Plus, Trash2 } from 'lucide-react';

export default function ShoppingCart({ cart, onUpdateQuantity, onRemoveItem, onPlaceOrder, totalPrice }) {
  if (cart.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Корзина пуста</h2>
        <p className="text-gray-600 mb-6">Добавьте товары из каталога</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Перейти в каталог
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">🛒 Корзина</h1>
        <span className="text-lg text-gray-600">
          {cart.length} товар{cart.length !== 1 ? 'ов' : ''}
        </span>
      </div>

      {/* Cart Items */}
      <div className="bg-white rounded-lg shadow mb-6">
        {cart.map(item => (
          <div key={item.id} className="flex items-center p-6 border-b border-gray-200 last:border-b-0">
            {/* Product Image */}
            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mr-4">
              <span className="text-xl">{item.emoji || '📦'}</span>
            </div>

            {/* Product Info */}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{item.name}</h3>
              <p className="text-gray-600 text-sm">{item.price.toLocaleString()} ₽</p>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center mr-4">
              <button
                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                className="p-1 rounded hover:bg-gray-100"
              >
                <Minus className="w-4 h-4" />
              </button>

              <span className="mx-3 font-semibold min-w-[2rem] text-center">
                {item.quantity}
              </span>

              <button
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                className="p-1 rounded hover:bg-gray-100"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Item Total */}
            <div className="text-right mr-4">
              <div className="font-semibold">
                {(item.price * item.quantity).toLocaleString()} ₽
              </div>
            </div>

            {/* Remove Button */}
            <button
              onClick={() => onRemoveItem(item.id)}
              className="p-2 text-red-500 hover:bg-red-50 rounded"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Сумма заказа</h2>

        <div className="space-y-2 mb-4">
          {cart.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.name} × {item.quantity}</span>
              <span>{(item.price * item.quantity).toLocaleString()} ₽</span>
            </div>
          ))}
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between text-lg font-semibold">
            <span>Итого:</span>
            <span className="text-blue-600">{totalPrice.toLocaleString()} ₽</span>
          </div>

          <div className="text-sm text-gray-600 mt-1">
            Доставка: Бесплатно при заказе от 3000 ₽
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => window.history.back()}
          className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors"
        >
          Продолжить покупки
        </button>

        <button
          onClick={onPlaceOrder}
          className="flex-1 bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 transition-colors"
        >
          Оформить заказ
        </button>
      </div>

      {/* Demo Notice */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 text-yellow-600">
            <span className="text-lg">⚠️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Это демо-версия
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                В полной версии будет интеграция с платежными системами,
                реальная доставка и автоматические уведомления в Telegram.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
