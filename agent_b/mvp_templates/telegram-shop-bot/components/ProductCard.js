import { useState } from 'react';

export default function ProductCard({ product, onAddToCart }) {
  const [isHovered, setIsHovered] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const handleAddToCart = () => {
    onAddToCart(product);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image */}
      <div className="relative h-48 bg-gray-200 flex items-center justify-center">
        <span className="text-4xl">{product.emoji || '📦'}</span>
        {product.inStock === false && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
            Нет в наличии
          </div>
        )}
        {product.discount && (
          <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
            -{product.discount}%
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="mb-2">
          <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
            {product.category}
          </span>
        </div>

        <h3 className="font-semibold text-lg mb-2 text-gray-900">
          {product.name}
        </h3>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {product.description}
        </p>

        {/* Price */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-col">
            {product.oldPrice && (
              <span className="text-sm text-gray-500 line-through">
                {product.oldPrice.toLocaleString()} ₽
              </span>
            )}
            <span className="text-xl font-bold text-gray-900">
              {product.price.toLocaleString()} ₽
            </span>
          </div>

          {product.rating && (
            <div className="flex items-center">
              <span className="text-yellow-400">⭐</span>
              <span className="text-sm text-gray-600 ml-1">
                {product.rating} ({product.reviews || 0})
              </span>
            </div>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={product.inStock === false}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors duration-200 ${
            product.inStock === false
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : addedToCart
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {product.inStock === false ? 'Нет в наличии' :
           addedToCart ? '✓ Добавлено!' : 'Добавить в корзину'}
        </button>

        {/* Hover Details */}
        {isHovered && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500 space-y-1">
              {product.brand && <div>Бренд: {product.brand}</div>}
              {product.material && <div>Материал: {product.material}</div>}
              {product.size && <div>Размер: {product.size}</div>}
              {product.color && <div>Цвет: {product.color}</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
