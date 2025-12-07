/**
 * Map Shopify Order to Bitrix24 Deal
 * Returns both deal fields and product rows
 */

import { BITRIX_CONFIG, financialStatusToStageId, sourceNameToSourceId } from './config.js';

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

  // Map financial status to stage ID
  const stageId = financialStatusToStageId(order.financial_status) || BITRIX_CONFIG.STAGES.DEFAULT;
  
  // Map source name to source ID
  const sourceId = sourceNameToSourceId(order.source_name);

  // Deal fields (matching Python script structure)
  const dealFields = {
    TITLE: order.name || `Order #${order.id}`,
    OPPORTUNITY: totalPrice, // Final amount as in Shopify
    CURRENCY_ID: order.currency || 'EUR',
    COMMENTS: `Shopify order ${order.name || order.id}`,
    CATEGORY_ID: BITRIX_CONFIG.CATEGORY_ID > 0 ? BITRIX_CONFIG.CATEGORY_ID : 0, // Use 0 if not configured
    STAGE_ID: stageId || 'NEW', // Default to 'NEW' if not mapped
    SOURCE_ID: sourceId || 'WEB', // Default to 'WEB' if not mapped
    SOURCE_DESCRIPTION: sourceName,

    // Key to Shopify order
    UF_SHOPIFY_ORDER_ID: String(order.id),
    UF_SHOPIFY_CUSTOMER_EMAIL: order.email || order.customer?.email || null,
    UF_SHOPIFY_CUSTOMER_NAME: customerName,

    // Aggregates for reports (as in Python script)
    UF_SHOPIFY_TOTAL_DISCOUNT: totalDiscount,
    UF_SHOPIFY_SHIPPING_PRICE: shippingPrice,
    UF_SHOPIFY_TOTAL_TAX: totalTax,
  };

  // Product rows
  const productRows = [];

  if (order.line_items && Array.isArray(order.line_items)) {
    for (const item of order.line_items) {
      // Try to get product ID from SKU mapping
      let productId = BITRIX_CONFIG.SKU_TO_PRODUCT_ID[item.sku];
      
      // If not found, try to use a default product ID (e.g., for socks)
      // This is a fallback - ideally all SKUs should be mapped
      if (!productId || productId === 0) {
        // Default product ID for socks (as per Python script example)
        productId = 2900; // PRODUCT_ID_SOCK
        console.warn(`[ORDER MAPPER] SKU ${item.sku} not found in mapping, using default product ID ${productId}`);
      }

      // Calculate discount per item
      const lineDiscount = Number(item.total_discount || item.discount_allocations?.[0]?.amount || 0);
      const quantity = Number(item.quantity || 1);
      const discountPerItem = quantity > 0 ? lineDiscount / quantity : 0;
      
      // Get price - try different fields
      const priceBeforeDiscount = Number(item.price || item.price_set?.shop_money?.amount || 0);
      const priceAfterDiscount = priceBeforeDiscount - discountPerItem;

      // Get tax rate from item or order
      let taxRate = 19.0; // Default
      if (item.tax_lines && item.tax_lines.length > 0) {
        taxRate = Number(item.tax_lines[0].rate || 0) * 100;
      } else if (order.tax_lines && order.tax_lines.length > 0) {
        taxRate = Number(order.tax_lines[0].rate || 0) * 100;
      }

      // Add one row per quantity (as in Python script example)
      for (let i = 0; i < quantity; i++) {
        productRows.push({
          PRODUCT_ID: productId,
          PRICE: priceAfterDiscount, // Price after discount
          QUANTITY: 1,
          DISCOUNT_TYPE_ID: 1, // Monetary discount
          DISCOUNT_SUM: discountPerItem,
          TAX_INCLUDED: order.taxes_included ? 'Y' : 'N',
          TAX_RATE: taxRate,
        });
      }
    }
  }

  // Shipping as separate row (use hardcoded ID as per Python script)
  if (shippingPrice > 0) {
    const shippingProductId = BITRIX_CONFIG.SHIPPING_PRODUCT_ID > 0 
      ? BITRIX_CONFIG.SHIPPING_PRODUCT_ID 
      : 3000; // Default shipping product ID
    
    productRows.push({
      PRODUCT_ID: shippingProductId,
      PRICE: shippingPrice,
      QUANTITY: 1,
      DISCOUNT_TYPE_ID: 1,
      DISCOUNT_SUM: 0.0,
      TAX_INCLUDED: order.taxes_included ? 'Y' : 'N',
      TAX_RATE: 19.0, // Default tax rate for shipping
    });
  }

  return { dealFields, productRows };
}
