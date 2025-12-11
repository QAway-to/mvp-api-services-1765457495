// Shopify Webhook endpoint
import { shopifyAdapter } from '../../../src/lib/adapters/shopify/index.js';
import { callBitrix, getBitrixWebhookBase } from '../../../src/lib/bitrix/client.js';
import { mapShopifyOrderToBitrixDeal } from '../../../src/lib/bitrix/orderMapper.js';
import { upsertBitrixContact } from '../../../src/lib/bitrix/contact.js';
import { financialStatusToStageId, financialStatusToPaymentStatus } from '../../../src/lib/bitrix/config.js';

// Configure body parser to accept raw JSON
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

/**
 * Handle order created event - create deal in Bitrix
 */
async function handleOrderCreated(order) {
  console.log(`[SHOPIFY WEBHOOK] Handling order created: ${order.name || order.id}`);

  // Map order to Bitrix deal
  const { dealFields, productRows } = mapShopifyOrderToBitrixDeal(order);

  // Log dealFields before sending for debugging
  console.log(`[SHOPIFY WEBHOOK] Deal fields to send:`, JSON.stringify(dealFields, null, 2));
  console.log(`[SHOPIFY WEBHOOK] Product rows count: ${productRows.length}`);

  // Upsert contact (non-blocking)
  let contactId = null;
  try {
    const bitrixBase = getBitrixWebhookBase();
    contactId = await upsertBitrixContact(bitrixBase, order);
    if (contactId) {
      dealFields.CONTACT_ID = contactId;
      console.log(`[SHOPIFY WEBHOOK] Contact ID set: ${contactId}`);
    }
  } catch (contactError) {
    console.error('[SHOPIFY WEBHOOK] Contact upsert failed (non-blocking):', contactError);
  }

  // Remove null/undefined values to avoid sending empty fields (but keep 0 and false as valid values)
  const cleanedFields = {};
  for (const [key, value] of Object.entries(dealFields)) {
    if (value !== null && value !== undefined && value !== '') {
      cleanedFields[key] = value;
    }
  }

  console.log(`[SHOPIFY WEBHOOK] Cleaned deal fields (removed null/undefined/empty):`, Object.keys(cleanedFields));
  console.log(`[SHOPIFY WEBHOOK] Key fields check:`, {
    OPPORTUNITY: cleanedFields.OPPORTUNITY,
    ORDER_TYPE_ID: cleanedFields.UF_CRM_1739183268662,
    DELIVERY_METHOD_ID: cleanedFields.UF_CRM_1739183302609,
    PAYMENT_STATUS_ID: cleanedFields.UF_CRM_1739183959976,
    SOURCE_DESCRIPTION: cleanedFields.SOURCE_DESCRIPTION,
    UF_SHOPIFY_TOTAL_DISCOUNT: cleanedFields.UF_SHOPIFY_TOTAL_DISCOUNT,
    UF_SHOPIFY_SHIPPING_PRICE: cleanedFields.UF_SHOPIFY_SHIPPING_PRICE,
    UF_SHOPIFY_TOTAL_TAX: cleanedFields.UF_SHOPIFY_TOTAL_TAX,
    CATEGORY_ID: cleanedFields.CATEGORY_ID,
    STAGE_ID: cleanedFields.STAGE_ID,
    SOURCE_ID: cleanedFields.SOURCE_ID
  });

  // 1. Create deal
  console.log(`[SHOPIFY WEBHOOK] Sending to Bitrix /crm.deal.add.json with fields:`, JSON.stringify(cleanedFields, null, 2));
  
  const dealAddResp = await callBitrix('/crm.deal.add.json', {
    fields: cleanedFields,
  });

  console.log(`[SHOPIFY WEBHOOK] Bitrix response:`, JSON.stringify(dealAddResp, null, 2));

  if (!dealAddResp.result) {
    console.error(`[SHOPIFY WEBHOOK] ❌ Failed to create deal. Response:`, dealAddResp);
    throw new Error(`Failed to create deal: ${JSON.stringify(dealAddResp)}`);
  }

  const dealId = dealAddResp.result;
  console.log(`[SHOPIFY WEBHOOK] ✅ Deal created successfully: ${dealId}`);

  // 2. Set product rows
  if (productRows.length > 0) {
    try {
      // Log product rows before sending (especially check shipping rows)
      console.log(`[SHOPIFY WEBHOOK] Sending ${productRows.length} product rows to Bitrix:`);
      productRows.forEach((row, index) => {
        const isShipping = row.PRODUCT_NAME && row.PRODUCT_NAME.toLowerCase().includes('shipping');
        console.log(`[SHOPIFY WEBHOOK] Row ${index + 1}: ${isShipping ? '🚚 SHIPPING' : '📦 PRODUCT'}`, {
          PRODUCT_NAME: row.PRODUCT_NAME,
          PRODUCT_ID: row.PRODUCT_ID || 'NOT SET (correct for shipping)',
          PRICE: row.PRICE,
          QUANTITY: row.QUANTITY,
          DISCOUNT_SUM: row.DISCOUNT_SUM
        });
      });
      
      await callBitrix('/crm.deal.productrows.set.json', {
        id: dealId,
        rows: productRows,
      });
      console.log(`[SHOPIFY WEBHOOK] ✅ Product rows set for deal ${dealId}: ${productRows.length} rows`);
    } catch (productRowsError) {
      console.error(`[SHOPIFY WEBHOOK] ❌ Product rows error (non-blocking):`, productRowsError);
      // Don't throw - deal is already created
    }
  }

  return dealId;
}

/**
 * Handle order updated event - update deal in Bitrix
 * Updates: amount, payment status, stage, category (if tags changed), product rows
 */
async function handleOrderUpdated(order) {
  console.log(`[SHOPIFY WEBHOOK] Handling order updated: ${order.name || order.id}`);

  const shopifyOrderId = String(order.id);

  // 1. Find deal by UF_SHOPIFY_ORDER_ID
  const listResp = await callBitrix('/crm.deal.list.json', {
    filter: { 'UF_SHOPIFY_ORDER_ID': shopifyOrderId },
    select: ['ID', 'OPPORTUNITY', 'STAGE_ID', 'CATEGORY_ID'],
  });

  const deal = listResp.result?.[0];
  if (!deal) {
    console.log(`[SHOPIFY WEBHOOK] Deal not found for Shopify order ${shopifyOrderId}`);
    return;
  }

  const dealId = deal.ID;
  const currentCategoryId = Number(deal.CATEGORY_ID) || 2;
  console.log(`[SHOPIFY WEBHOOK] Found deal ${dealId} for order ${shopifyOrderId}, current category: ${currentCategoryId}`);

  // 2. Map order to get updated fields (including category, stage, payment status)
  const { dealFields, productRows } = mapShopifyOrderToBitrixDeal(order);
  const newCategoryId = dealFields.CATEGORY_ID;

  // 3. Prepare update fields
  const fields = {};

  // Update amount if changed
  const newAmount = Number(order.current_total_price || order.total_price || 0);
  if (newAmount !== Number(deal.OPPORTUNITY)) {
    fields.OPPORTUNITY = newAmount;
    console.log(`[SHOPIFY WEBHOOK] Amount changed: ${deal.OPPORTUNITY} → ${newAmount}`);
  }

  // Update payment status (enumeration ID) - UF_CRM_1739183959976
  if (dealFields.UF_CRM_1739183959976) {
    fields.UF_CRM_1739183959976 = dealFields.UF_CRM_1739183959976;
    console.log(`[SHOPIFY WEBHOOK] Payment status ID: ${fields.UF_CRM_1739183959976}`);
  }

  // Update order type (enumeration ID) - UF_CRM_1739183268662
  if (dealFields.UF_CRM_1739183268662) {
    fields.UF_CRM_1739183268662 = dealFields.UF_CRM_1739183268662;
    console.log(`[SHOPIFY WEBHOOK] Order type ID: ${fields.UF_CRM_1739183268662}`);
  }

  // Update delivery method (enumeration ID) - UF_CRM_1739183302609
  if (dealFields.UF_CRM_1739183302609) {
    fields.UF_CRM_1739183302609 = dealFields.UF_CRM_1739183302609;
    console.log(`[SHOPIFY WEBHOOK] Delivery method ID: ${fields.UF_CRM_1739183302609}`);
  }

  // Update SOURCE_DESCRIPTION (for reference)
  if (dealFields.SOURCE_DESCRIPTION) {
    fields.SOURCE_DESCRIPTION = dealFields.SOURCE_DESCRIPTION;
    console.log(`[SHOPIFY WEBHOOK] Source description: ${fields.SOURCE_DESCRIPTION}`);
  }

  // Update stage based on financial status and category
  const newStageId = financialStatusToStageId(order.financial_status, newCategoryId);
  if (newStageId !== deal.STAGE_ID) {
    fields.STAGE_ID = newStageId;
    console.log(`[SHOPIFY WEBHOOK] Stage changed: ${deal.STAGE_ID} → ${newStageId}`);
  }

  // Update category if tags changed (pre-order tag added/removed)
  if (newCategoryId !== currentCategoryId) {
    fields.CATEGORY_ID = newCategoryId;
    console.log(`[SHOPIFY WEBHOOK] Category changed: ${currentCategoryId} → ${newCategoryId}`);
    // If category changed, also update stage to match new category
    fields.STAGE_ID = newStageId;
  }

  // Update aggregates
  if (order.current_total_discounts !== undefined) {
    fields.UF_SHOPIFY_TOTAL_DISCOUNT = Number(order.current_total_discounts);
  }
  if (order.current_total_tax !== undefined) {
    fields.UF_SHOPIFY_TOTAL_TAX = Number(order.current_total_tax);
  }
  if (order.current_total_shipping_price_set?.shop_money?.amount !== undefined) {
    fields.UF_SHOPIFY_SHIPPING_PRICE = Number(
      order.current_total_shipping_price_set.shop_money.amount ||
      order.total_shipping_price_set?.shop_money?.amount ||
      order.shipping_price ||
      0
    );
  }

  // 4. Update deal
  if (Object.keys(fields).length > 0) {
    // Remove null/undefined values
    const cleanedFields = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== null && value !== undefined && value !== '') {
        cleanedFields[key] = value;
      }
    }

    console.log(`[SHOPIFY WEBHOOK] Updating deal ${dealId} with fields:`, Object.keys(cleanedFields));
    console.log(`[SHOPIFY WEBHOOK] Fields values:`, {
      ORDER_TYPE_ID: cleanedFields.UF_CRM_1739183268662,
      DELIVERY_METHOD_ID: cleanedFields.UF_CRM_1739183302609,
      PAYMENT_STATUS_ID: cleanedFields.UF_CRM_1739183959976,
      SOURCE_DESCRIPTION: cleanedFields.SOURCE_DESCRIPTION,
      CATEGORY_ID: cleanedFields.CATEGORY_ID,
      STAGE_ID: cleanedFields.STAGE_ID
    });
    await callBitrix('/crm.deal.update.json', {
      id: dealId,
      fields: cleanedFields,
    });
    console.log(`[SHOPIFY WEBHOOK] ✅ Deal ${dealId} updated successfully`);
  } else {
    console.log(`[SHOPIFY WEBHOOK] No fields to update for deal ${dealId}`);
  }

  // 5. Always update product rows to reflect current state (including refunds - qty/total changes)
  // Partial/full refunds are reflected as reduced qty or totals in line_items, not as separate "Refund" rows
  try {
    console.log(`[SHOPIFY WEBHOOK] Updating product rows for deal ${dealId}...`);
    console.log(`[SHOPIFY WEBHOOK] Product rows to set: ${productRows.length} rows`);
    
    if (productRows && productRows.length > 0) {
      // Log product rows for debugging
      productRows.forEach((row, index) => {
        const isShipping = row.PRODUCT_NAME && row.PRODUCT_NAME.toLowerCase().includes('shipping');
        console.log(`[SHOPIFY WEBHOOK] Row ${index + 1}: ${isShipping ? '🚚 SHIPPING' : '📦 PRODUCT'}`, {
          PRODUCT_NAME: row.PRODUCT_NAME,
          PRODUCT_ID: row.PRODUCT_ID || 'NOT SET',
          PRICE: row.PRICE,
          QUANTITY: row.QUANTITY,
          DISCOUNT_SUM: row.DISCOUNT_SUM
        });
      });

      await callBitrix('/crm.deal.productrows.set.json', {
        id: dealId,
        rows: productRows,
      });
      console.log(`[SHOPIFY WEBHOOK] ✅ Product rows updated for deal ${dealId}: ${productRows.length} rows`);
    } else {
      // If no product rows (e.g., all items removed/refunded), clear rows to keep Bitrix in sync
      await callBitrix('/crm.deal.productrows.set.json', {
        id: dealId,
        rows: [],
      });
      console.log(`[SHOPIFY WEBHOOK] ✅ Product rows cleared for deal ${dealId} (no items remaining)`);
    }
  } catch (productRowsError) {
    console.error(`[SHOPIFY WEBHOOK] ❌ Product rows update error (non-blocking):`, productRowsError);
    // Do not throw to keep the webhook handler resilient
  }

  return dealId;
}

export default async function handler(req, res) {
  console.log(`[SHOPIFY WEBHOOK] ===== INCOMING REQUEST =====`);
  console.log(`[SHOPIFY WEBHOOK] Method: ${req.method}`);
  console.log(`[SHOPIFY WEBHOOK] Headers:`, JSON.stringify(req.headers, null, 2));
  
  if (req.method !== 'POST') {
    console.log(`[SHOPIFY WEBHOOK] Method not allowed: ${req.method}`);
    res.status(405).end('Method not allowed');
    return;
  }

  const topic = req.headers['x-shopify-topic'];
  const order = req.body;

  console.log(`[SHOPIFY WEBHOOK] Topic: ${topic}`);
  console.log(`[SHOPIFY WEBHOOK] Order ID: ${order?.id || 'N/A'}`);
  console.log(`[SHOPIFY WEBHOOK] Order name: ${order?.name || 'N/A'}`);

  try {
    // Store event for monitoring (non-blocking)
    try {
      const storedEvent = shopifyAdapter.storeEvent(order);
      console.log(`[SHOPIFY WEBHOOK] ✅ Event stored. Topic: ${topic}, Order: ${order.name || order.id}`);
    } catch (storeError) {
      console.error('[SHOPIFY WEBHOOK] ❌ Failed to store event:', storeError);
    }

    if (topic === 'orders/create') {
      console.log(`[SHOPIFY WEBHOOK] → Handling order created`);
      await handleOrderCreated(order);
      console.log(`[SHOPIFY WEBHOOK] ✅ Order created handler completed`);
    } else if (topic === 'orders/updated') {
      console.log(`[SHOPIFY WEBHOOK] → Handling order updated`);
      await handleOrderUpdated(order);
      console.log(`[SHOPIFY WEBHOOK] ✅ Order updated handler completed`);
    } else {
      // For other topics just log and return 200
      console.log(`[SHOPIFY WEBHOOK] ⚠️ Unhandled topic: ${topic}`);
    }

    res.status(200).end('OK');
    console.log(`[SHOPIFY WEBHOOK] ===== REQUEST COMPLETED =====`);
  } catch (e) {
    console.error('[SHOPIFY WEBHOOK] ❌ ERROR:', e);
    console.error('[SHOPIFY WEBHOOK] Error stack:', e.stack);
    res.status(500).end('ERROR');
  }
}

