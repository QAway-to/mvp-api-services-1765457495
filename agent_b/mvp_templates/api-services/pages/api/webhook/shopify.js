// Shopify Webhook endpoint
import { shopifyAdapter } from '../../../src/lib/adapters/shopify/index.js';
import { getBitrixWebhookUrl, callBitrixAPI } from '../../../src/lib/bitrix/client.js';
import { mapShopifyOrderToBitrixDealFields } from '../../../src/lib/bitrix/dealMapper.js';
import { upsertBitrixContact } from '../../../src/lib/bitrix/contact.js';

// Configure body parser to accept raw JSON
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const logs = [];
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toISOString();
    logs.push({ timestamp, type, message });
    console.log(`[SHOPIFY WEBHOOK] [${type.toUpperCase()}] ${message}`);
  };

  try {
    addLog('Received Shopify webhook request', 'info');

    // Get raw body (Next.js bodyParser should handle this)
    const payload = req.body;

    if (!payload || typeof payload !== 'object') {
      addLog('Invalid payload: not an object', 'error');
      return res.status(400).json({ 
        ok: false,
        error: 'Invalid payload: must be a JSON object',
        logs: logs
      });
    }

    addLog(`Payload received: Order #${payload.order_number || payload.id || 'Unknown'}`, 'info');
    addLog(`Order total: ${payload.total_price || 'N/A'} ${payload.currency || ''}`, 'info');

    // Validate payload
    const validation = shopifyAdapter.validateWebhookPayload(payload);
    
    if (!validation.valid) {
      addLog(`Validation errors: ${validation.errors.join(', ')}`, 'warning');
      // Log but don't reject - we're not enforcing strict validation
      addLog('Storing event despite validation warnings (lenient mode)', 'info');
    } else {
      addLog('Payload validated successfully', 'success');
    }

    // Store event
    const storedEvent = shopifyAdapter.storeEvent(payload);
    addLog(`Event stored successfully. Event ID: ${storedEvent.id}, Total events: ${shopifyAdapter.getEventsCount()}`, 'success');

    // Get Bitrix webhook URL
    const bitrixWebhookUrl = getBitrixWebhookUrl();
    addLog(`Using Bitrix webhook: ${bitrixWebhookUrl}`, 'info');

    // Step 1: Upsert contact
    let contactId = null;
    try {
      addLog('Starting contact upsert...', 'info');
      contactId = await upsertBitrixContact(bitrixWebhookUrl, payload);
      if (contactId) {
        addLog(`Contact upserted successfully. Contact ID: ${contactId}`, 'success');
      } else {
        addLog('No contact ID returned (may be normal if no email)', 'warning');
      }
    } catch (contactError) {
      addLog(`Contact upsert failed (non-blocking): ${contactError.message}`, 'error');
      // Don't throw - continue with deal creation
    }

    // Step 2: Map Shopify order to Bitrix deal fields
    addLog('Mapping Shopify order to Bitrix deal fields...', 'info');
    const dealFields = mapShopifyOrderToBitrixDealFields(payload, contactId);
    addLog(`Deal fields mapped. Title: ${dealFields.TITLE}, Amount: ${dealFields.OPPORTUNITY} ${dealFields.CURRENCY_ID}`, 'info');
    addLog(`Stage ID: ${dealFields.STAGE_ID || 'null'}, Category ID: ${dealFields.CATEGORY_ID || 'null'}`, 'info');

    // Step 3: Create deal in Bitrix
    let dealId = null;
    try {
      addLog('Creating deal in Bitrix...', 'info');
      const dealResult = await callBitrixAPI(bitrixWebhookUrl, 'crm.deal.add', { fields: dealFields });
      
      if (dealResult.result) {
        dealId = parseInt(dealResult.result);
        addLog(`Deal created successfully. Deal ID: ${dealId}`, 'success');
      } else {
        throw new Error('No deal ID in response');
      }
    } catch (dealError) {
      addLog(`Failed to create deal: ${dealError.message}`, 'error');
      // Store event but return error
      return res.status(500).json({
        ok: false,
        error: 'Failed to create deal in Bitrix',
        message: dealError.message,
        logs: logs
      });
    }

    // Step 4: Set product rows (minimal implementation - always add at least one product)
    if (dealId && payload.line_items && payload.line_items.length > 0) {
      try {
        addLog('Setting product rows for deal...', 'info');
        
        // Take first line item from Shopify payload
        const item = payload.line_items[0];
        
        // Create minimal product row array
        const rows = [
          {
            PRODUCT_ID: 1, // Hardcoded for testing
            PRICE: Number(item.price || 0),
            QUANTITY: item.quantity || 1
          }
        ];

        addLog(`Calling crm.deal.productrows.set with deal ID: ${dealId}`, 'info');
        addLog(`Product row: PRODUCT_ID=1, PRICE=${rows[0].PRICE}, QUANTITY=${rows[0].QUANTITY}`, 'info');
        
        const productRowsResult = await callBitrixAPI(bitrixWebhookUrl, 'crm.deal.productrows.set', {
          id: dealId,
          rows: rows
        });

        if (productRowsResult.result) {
          addLog(`Product rows set successfully for deal ${dealId}`, 'success');
        } else {
          addLog(`Product rows result: ${JSON.stringify(productRowsResult)}`, 'warning');
        }
      } catch (productRowsError) {
        addLog(`Product rows error (non-blocking): ${productRowsError.message}`, 'error');
        if (productRowsError.stack) {
          addLog(`Product rows error stack: ${productRowsError.stack}`, 'error');
        }
        // Don't throw - deal is already created
      }
    } else {
      if (!dealId) {
        addLog('No deal ID available, skipping product rows', 'warning');
      } else {
        addLog('No line items in order, skipping product rows', 'warning');
      }
    }

    return res.status(200).json({ 
      ok: true,
      eventId: storedEvent.id,
      receivedAt: storedEvent.received_at,
      dealId: dealId,
      contactId: contactId,
      logs: logs
    });

  } catch (error) {
    addLog(`Fatal error: ${error.message}`, 'error');
    if (error.stack) {
      addLog(`Stack: ${error.stack}`, 'error');
    }
    
    console.error('Shopify webhook error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error',
      message: error.message,
      logs: logs
    });
  }
}

