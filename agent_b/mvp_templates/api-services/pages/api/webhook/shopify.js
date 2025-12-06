// Shopify Webhook endpoint
import { shopifyAdapter } from '../../../src/lib/adapters/shopify/index.js';
import { getBitrixWebhookUrl } from '../../../src/lib/bitrix/client.js';
import { mapShopifyOrderToBitrixDealFields } from '../../../src/lib/bitrix/dealMapper.js';
import { upsertBitrixContact } from '../../../src/lib/bitrix/contact.js';
import { createProductRowsFromOrder, setBitrixDealProductRows } from '../../../src/lib/bitrix/productRows.js';
import { callBitrixAPI } from '../../../src/lib/bitrix/client.js';

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

    // Step 4: Set product rows
    if (dealId) {
      try {
        addLog('Setting product rows for deal...', 'info');
        const productRows = createProductRowsFromOrder(payload);
        
        if (productRows.length > 0) {
          addLog(`Created ${productRows.length} product rows`, 'info');
          const productRowsSuccess = await setBitrixDealProductRows(bitrixWebhookUrl, dealId, productRows);
          
          if (productRowsSuccess) {
            addLog(`Product rows set successfully for deal ${dealId}`, 'success');
          } else {
            addLog(`Failed to set product rows (non-blocking)`, 'warning');
          }
        } else {
          addLog('No product rows to set (no matching SKUs found)', 'warning');
        }
      } catch (productRowsError) {
        addLog(`Product rows error (non-blocking): ${productRowsError.message}`, 'error');
        // Don't throw - deal is already created
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

