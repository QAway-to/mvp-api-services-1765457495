// Shopify Webhook endpoint
import { shopifyAdapter } from '../../../src/lib/adapters/shopify/index.js';

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

    addLog(`Payload received: ${JSON.stringify(payload).substring(0, 200)}...`, 'info');

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

    return res.status(200).json({ 
      ok: true,
      eventId: storedEvent.id,
      receivedAt: storedEvent.received_at,
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

