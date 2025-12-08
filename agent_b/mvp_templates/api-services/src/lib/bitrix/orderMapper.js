/**
 * Map Shopify Order to Bitrix24 Deal
 * Returns both deal fields and product rows
 */

import { BITRIX_CONFIG, financialStatusToStageId, sourceNameToSourceId } from './config.js';
import skuMapping from './skuMapping.json' assert { type: 'json' };
import handleMapping from './handleMapping.json' assert { type: 'json' };
import { resolveResponsibleId } from './responsible.js';

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

  // Resolve responsible (ASSIGNED_BY_ID) based on mapping
  const assigneeId = resolveResponsibleId(order);
  if (assigneeId) {
    dealFields.ASSIGNED_BY_ID = assigneeId;
  }

  // Product rows
  const productRows = [];
  
  // Shipping variables (defined early for final validation)
  let actualShippingPrice = 0;
  let shippingLineTitle = null;

  if (order.line_items && Array.isArray(order.line_items)) {
    // Get shipping product ID to avoid confusion
    const shippingProductId = BITRIX_CONFIG.SHIPPING_PRODUCT_ID > 0 
      ? BITRIX_CONFIG.SHIPPING_PRODUCT_ID 
      : 3000; // Default shipping product ID
    
    for (const item of order.line_items) {
      // CRITICAL: line_items are ALWAYS products, NEVER shipping
      // Even if a product has the same ID as shipping, it's still a product from line_items
      
      // Try SKU mapping first
      const productIdFromFile = item.sku ? skuMapping[item.sku] : null;
      const productIdFromConfig = item.sku ? BITRIX_CONFIG.SKU_TO_PRODUCT_ID[item.sku] : null;

      // Try handle-based mapping (with a small normalization removing "barefoot-")
      const rawHandle = item.handle || item.product_handle || null;
      const normHandle = rawHandle ? rawHandle.toLowerCase().replace('barefoot-', '') : null;
      const productIdFromHandle = normHandle ? (handleMapping[normHandle] || handleMapping[rawHandle]) : null;

      let productId = productIdFromFile || productIdFromHandle || productIdFromConfig || null;
      
      // Safety check: if product ID matches shipping ID, log warning but keep it as product
      // (line_items are always products, even if they accidentally have shipping ID)
      if (productId && productId == shippingProductId) {
        console.warn(`[ORDER MAPPER] WARNING: Product from line_items (SKU: ${item.sku || 'N/A'}, Title: ${item.title || 'N/A'}) has PRODUCT_ID ${productId} which matches shipping ID. Treating as product (not shipping).`);
      }

      // Extract size and properties from Shopify line_item
      // variant_title usually contains the size (e.g., "31", "36-39", "S", "M")
      const variantTitle = item.variant_title || null;
      
      // Extract properties (array of {name, value} objects)
      const properties = item.properties || [];
      const sizeProperty = properties.find(p => 
        p.name && (
          p.name.toLowerCase().includes('size') || 
          p.name.toLowerCase().includes('размер') ||
          p.name.toLowerCase() === 'size'
        )
      );
      const colorProperty = properties.find(p => 
        p.name && (
          p.name.toLowerCase().includes('color') || 
          p.name.toLowerCase().includes('цвет') ||
          p.name.toLowerCase() === 'color'
        )
      );
      
      // Get size from variant_title or properties
      const size = variantTitle || sizeProperty?.value || null;
      
      // Build descriptive name with size/variant/vendor/color/model if available
      const parts = [item.title || ''];
      
      // Add size if available (most important - should be visible)
      if (size) {
        parts.push(`Size: ${size}`);
      }
      
      // Add color if available
      if (colorProperty?.value) {
        parts.push(`Color: ${colorProperty.value}`);
      }
      
      // Add other options if they differ from variant_title
      if (item.option1 && item.option1 !== variantTitle && item.option1 !== size) {
        parts.push(item.option1);
      }
      if (item.option2 && item.option2 !== variantTitle && item.option2 !== size) {
        parts.push(item.option2);
      }
      if (item.option3) {
        parts.push(item.option3);
      }
      
      // Add vendor/brand if available
      if (item.vendor) {
        parts.push(`Brand: ${item.vendor}`);
      }
      
      // Join all parts with separator
      const productName = parts.filter(Boolean).join(' | ');

      // Prices and discounts
      const priceBrutto = Number(item.price || item.price_set?.shop_money?.amount || 0);
      const discountAmount = Number(
        item.discount_allocations?.[0]?.amount ||
        item.discount_allocations?.[0]?.amount_set?.shop_money?.amount ||
        item.total_discount ||
        0
      );
      const priceAfterDiscount = priceBrutto - discountAmount;
      const discountRate = priceBrutto > 0 ? (discountAmount / priceBrutto) * 100 : 0;

      // Tax
      let taxRate = 19.0;
      if (item.tax_lines && item.tax_lines.length > 0) {
        taxRate = Number(item.tax_lines[0].rate || 0) * 100;
      } else if (order.tax_lines && order.tax_lines.length > 0) {
        taxRate = Number(order.tax_lines[0].rate || 0) * 100;
      }

      const quantity = Number(item.quantity || 1);

      // Add one row per quantity
      // IMPORTANT: Always include PRODUCT_NAME even when PRODUCT_ID is set
      // This ensures size and properties are visible in Bitrix24 product card
      for (let i = 0; i < quantity; i++) {
        const row = {
          PRICE: priceAfterDiscount,
          PRICE_BRUTTO: priceBrutto,
          QUANTITY: 1,
          DISCOUNT_TYPE_ID: 1,
          DISCOUNT_SUM: discountAmount,
          DISCOUNT_RATE: discountRate,
          TAX_INCLUDED: order.taxes_included ? 'Y' : 'N',
          TAX_RATE: taxRate,
        };
        
        // Always set PRODUCT_NAME with size and properties for visibility in Bitrix24
        row.PRODUCT_NAME = productName || item.title || item.sku || 'Shopify item';
        
        // Set PRODUCT_ID if mapped (for linking to catalog)
        if (productId && productId !== 0) {
          row.PRODUCT_ID = productId;
        } else {
          console.warn(`[ORDER MAPPER] SKU ${item.sku || 'N/A'} not mapped, sending as custom row with name: ${productName}`);
        }
        
        productRows.push(row);
      }
    }
  }

  // Shipping as separate row - ONLY from shipping_lines, NEVER from line_items
  // Extract shipping price STRICTLY from shipping_lines to avoid confusion with regular products
  if (order.shipping_lines && Array.isArray(order.shipping_lines) && order.shipping_lines.length > 0) {
    // Get shipping from the first shipping_line (most reliable source)
    const shippingLine = order.shipping_lines[0];
    actualShippingPrice = Number(
      shippingLine.price ||
      shippingLine.price_set?.shop_money?.amount ||
      shippingLine.amount ||
      0
    );
    shippingLineTitle = shippingLine.title || shippingLine.code || 'Shipping';
  } else {
    // Fallback: try to get from order-level shipping fields (less reliable)
    actualShippingPrice = Number(
      order.current_total_shipping_price_set?.shop_money?.amount ||
      order.total_shipping_price_set?.shop_money?.amount ||
      order.shipping_price ||
      0
    );
    shippingLineTitle = 'Shipping';
  }
  
  // Only add shipping row if we have actual shipping_lines OR explicit shipping price > 0
  // AND shipping price matches what we calculated (to avoid confusion with products)
  const hasShippingLines = order.shipping_lines && Array.isArray(order.shipping_lines) && order.shipping_lines.length > 0;
  const hasExplicitShippingPrice = actualShippingPrice > 0 && Math.abs(actualShippingPrice - shippingPrice) < 0.01;
  
  if (actualShippingPrice > 0 && (hasShippingLines || hasExplicitShippingPrice)) {
    const shippingProductId = BITRIX_CONFIG.SHIPPING_PRODUCT_ID > 0 
      ? BITRIX_CONFIG.SHIPPING_PRODUCT_ID 
      : 3000; // Default shipping product ID (WARNING: ensure this ID is NOT used for regular products!)
    
    // CRITICAL: Always include PRODUCT_NAME for shipping to avoid confusion
    // This ensures shipping is clearly identified in Bitrix24
    productRows.push({
      PRODUCT_ID: shippingProductId,
      PRODUCT_NAME: `Shipping: ${shippingLineTitle}`, // Explicit name to avoid confusion
      PRICE: actualShippingPrice,
      QUANTITY: 1,
      DISCOUNT_TYPE_ID: 1,
      DISCOUNT_SUM: 0.0,
      TAX_INCLUDED: order.taxes_included ? 'Y' : 'N',
      TAX_RATE: 19.0, // Default tax rate for shipping
    });
    
    console.log(`[ORDER MAPPER] Added shipping row: ${shippingLineTitle}, Price: ${actualShippingPrice}, Product ID: ${shippingProductId}`);
  } else if (shippingPrice > 0 && !hasShippingLines) {
    // Log warning if we have shipping price but no shipping_lines (potential data issue)
    console.warn(`[ORDER MAPPER] Shipping price detected (${shippingPrice}) but no shipping_lines found. Skipping shipping row to avoid confusion.`);
  }

  // Final validation: count products vs shipping
  const productRowsCount = productRows.length;
  const shippingRowsCount = productRows.filter(r => 
    r.PRODUCT_NAME && r.PRODUCT_NAME.toLowerCase().includes('shipping')
  ).length;
  const regularProductRowsCount = productRowsCount - shippingRowsCount;
  
  // Count expected items from Shopify
  const expectedLineItemsCount = order.line_items 
    ? order.line_items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
    : 0;
  const expectedShippingCount = (order.shipping_lines && order.shipping_lines.length > 0 && actualShippingPrice > 0) ? 1 : 0;
  const expectedTotalRows = expectedLineItemsCount + expectedShippingCount;
  
  // Log summary for debugging
  console.log(`[ORDER MAPPER] Order ${order.name || order.id} mapping summary:`);
  console.log(`  - Line items in Shopify: ${order.line_items?.length || 0} (total quantity: ${expectedLineItemsCount})`);
  console.log(`  - Shipping lines in Shopify: ${order.shipping_lines?.length || 0}`);
  console.log(`  - Product rows created: ${regularProductRowsCount}`);
  console.log(`  - Shipping rows created: ${shippingRowsCount}`);
  console.log(`  - Total rows: ${productRowsCount} (expected: ${expectedTotalRows})`);
  
  if (regularProductRowsCount !== expectedLineItemsCount) {
    console.warn(`[ORDER MAPPER] WARNING: Product rows count mismatch! Expected ${expectedLineItemsCount} from line_items, got ${regularProductRowsCount}`);
  }
  
  if (shippingRowsCount !== expectedShippingCount) {
    console.warn(`[ORDER MAPPER] WARNING: Shipping rows count mismatch! Expected ${expectedShippingCount}, got ${shippingRowsCount}`);
  }

  return { dealFields, productRows };
}
