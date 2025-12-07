/**
 * Map Shopify Order to Bitrix24 Deal
 * Returns both deal fields and product rows
 */

// SKU to Product ID mapping
const skuToProductId = {
  'ALB0002': 2900,       // Real IDs from Bitrix
  'ALB0005': 2901,
  'SHIPPING': 3000,      // Product/service "Доставка"
};

/**
 * Map Shopify order to Bitrix24 deal fields and product rows
 * @param {Object} order - Shopify order object
 * @returns {Object} { dealFields, productRows }
 */
export function mapShopifyOrderToBitrixDeal(order) {
  // Aggregates
  const totalPrice = Number(order.current_total_price || order.total_price || 0);
  const totalDiscount = Number(order.current_total_discounts || order.total_discounts || 0);
  const totalTax = Number(order.current_total_tax || 0);
  const shippingPrice = Number(
    order.current_total_shipping_price_set?.shop_money?.amount ||
    order.total_shipping_price_set?.shop_money?.amount ||
    order.shipping_price ||
    order.shipping_lines?.[0]?.price ||
    0
  );

  // Determine if preorder
  const isPreorder = order.source_name === 'pos'; // Add your conditions if needed
  const sourceName = isPreorder ? 'offline (pre-order)' : 'online (stock)';

  // Customer name
  const customerName = order.customer
    ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() || null
    : null;

  // Deal fields
  const dealFields = {
    TITLE: order.name || `Order #${order.id}`,
    OPPORTUNITY: totalPrice,
    CURRENCY_ID: order.currency || 'EUR',
    COMMENTS: `Shopify order ${order.name || order.id}`,
    CATEGORY_ID: 0,
    STAGE_ID: 'NEW', // Hardcoded for now, later move to config
    SOURCE_ID: 'WEB',
    SOURCE_DESCRIPTION: sourceName,

    // Key to Shopify order
    UF_SHOPIFY_ORDER_ID: String(order.id),
    UF_SHOPIFY_CUSTOMER_EMAIL: order.email || order.customer?.email || null,
    UF_SHOPIFY_CUSTOMER_NAME: customerName,

    // Aggregates for reports
    UF_SHOPIFY_TOTAL_DISCOUNT: totalDiscount,
    UF_SHOPIFY_SHIPPING_PRICE: shippingPrice,
    UF_SHOPIFY_TOTAL_TAX: totalTax,
  };

  // Product rows
  const productRows = [];

  if (order.line_items && Array.isArray(order.line_items)) {
    for (const item of order.line_items) {
      const productId = skuToProductId[item.sku];

      if (!productId) {
        console.warn(`[ORDER MAPPER] SKU ${item.sku} not found in mapping, skipping`);
        continue;
      }

      const lineDiscount = Number(item.total_discount || 0);
      const quantity = item.quantity || 1;
      const discountPerItem = quantity > 0 ? lineDiscount / quantity : 0;
      const price = Number(item.price); // Price before discount

      productRows.push({
        PRODUCT_ID: productId,
        PRICE: price - discountPerItem, // Actual price after discount
        QUANTITY: quantity,
        DISCOUNT_TYPE_ID: 1, // Monetary discount
        DISCOUNT_SUM: discountPerItem,
        TAX_INCLUDED: 'Y',
        TAX_RATE: 19, // Hardcoded for now
      });
    }
  }

  // Shipping as separate row
  if (shippingPrice > 0 && skuToProductId.SHIPPING) {
    productRows.push({
      PRODUCT_ID: skuToProductId.SHIPPING,
      PRICE: shippingPrice,
      QUANTITY: 1,
      DISCOUNT_TYPE_ID: 1,
      DISCOUNT_SUM: 0,
      TAX_INCLUDED: 'Y',
      TAX_RATE: 19,
    });
  }

  return { dealFields, productRows };
}

