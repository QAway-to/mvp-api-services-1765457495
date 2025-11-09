import { useState } from 'react';
import Head from 'next/head';
import ProductCatalog from '../components/ProductCatalog';
import ShoppingCart from '../components/ShoppingCart';
import OrderForm from '../components/OrderForm';
import BotPreview from '../components/BotPreview';

export default function Home() {
  const [cart, setCart] = useState([]);
  const [currentView, setCurrentView] = useState('catalog');
  const [orders, setOrders] = useState([]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const placeOrder = (orderData) => {
    const order = {
      id: `DEMO-${Date.now()}`,
      ...orderData,
      items: [...cart],
      total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      status: 'processing',
      createdAt: new Date().toISOString()
    };

    setOrders(prev => [order, ...prev]);
    setCart([]);
    setCurrentView('orders');
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Telegram Shop Bot MVP - Demo</title>
        <meta name="description" content="Demo version of Telegram Shop Bot" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">🛍️ Shop Bot MVP</h1>
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                DEMO VERSION
              </span>
            </div>

            <nav className="flex space-x-4">
              <button
                onClick={() => setCurrentView('catalog')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'catalog'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Каталог
              </button>
              <button
                onClick={() => setCurrentView('cart')}
                className={`px-3 py-2 rounded-md text-sm font-medium relative ${
                  currentView === 'cart'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Корзина
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
              <button
                onClick={() => setCurrentView('orders')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'orders'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Заказы ({orders.length})
              </button>
              <button
                onClick={() => setCurrentView('bot')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'bot'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🤖 Bot Preview
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'catalog' && (
          <ProductCatalog onAddToCart={addToCart} />
        )}

        {currentView === 'cart' && (
          <ShoppingCart
            cart={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromCart}
            onPlaceOrder={() => setCurrentView('checkout')}
            totalPrice={totalPrice}
          />
        )}

        {currentView === 'checkout' && (
          <OrderForm
            cart={cart}
            totalPrice={totalPrice}
            onPlaceOrder={placeOrder}
            onBack={() => setCurrentView('cart')}
          />
        )}

        {currentView === 'orders' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Мои заказы</h2>
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">У вас пока нет заказов</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="bg-white p-6 rounded-lg shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold">Заказ #{order.id}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-sm ${
                        order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.status === 'processing' ? 'В обработке' :
                         order.status === 'completed' ? 'Выполнен' : 'Ошибка'}
                      </span>
                    </div>

                    <div className="border-t pt-4">
                      <div className="space-y-2">
                        {order.items.map(item => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.name} × {item.quantity}</span>
                            <span>{(item.price * item.quantity).toLocaleString()} ₽</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t mt-4 pt-4 flex justify-between font-semibold">
                        <span>Итого:</span>
                        <span>{order.total.toLocaleString()} ₽</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentView === 'bot' && <BotPreview />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-500 text-sm">
              🚀 Telegram Shop Bot MVP - Demo Version
            </p>
            <p className="text-gray-400 text-xs mt-2">
              Для полной версии с реальными интеграциями свяжитесь с разработчиком
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
