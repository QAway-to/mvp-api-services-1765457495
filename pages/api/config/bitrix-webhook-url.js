// API endpoint to get Bitrix webhook URL from environment variable
import { getBitrixWebhookBase } from '../../../src/lib/bitrix/client.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const webhookUrl = getBitrixWebhookBase();
    const webhookUrlWithoutSlash = webhookUrl.endsWith('/') ? webhookUrl.slice(0, -1) : webhookUrl;

    return res.status(200).json({
      success: true,
      webhookUrl: webhookUrlWithoutSlash,
      source: process.env.BITRIX_WEBHOOK_BASE ? 'BITRIX_WEBHOOK_BASE' :
              process.env.BITRIX_WEBHOOK_URL ? 'BITRIX_WEBHOOK_URL' :
              'missing'
    });
  } catch (error) {
    console.error('Get Bitrix webhook URL error:', error);
    return res.status(200).json({
      success: false,
      error: 'BITRIX_WEBHOOK_BASE is not configured',
      message: error.message
    });
  }
}
