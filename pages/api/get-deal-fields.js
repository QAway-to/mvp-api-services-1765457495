// Get Bitrix24 deal fields to find UF field codes
import { callBitrix } from '../../src/lib/bitrix/client.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    console.log('[GET DEAL FIELDS] Fetching deal fields from Bitrix24...');
    
    // Call crm.deal.fields to get all deal fields
    const result = await callBitrix('/crm.deal.fields.json', {});
    
    if (!result.result) {
      return res.status(500).json({ 
        error: 'No result from Bitrix API',
        response: result 
      });
    }

    const fields = result.result;
    
    // Find fields with Size, Model, Color, Brand in labels
    const targetFields = {};
    
    for (const [fieldCode, fieldInfo] of Object.entries(fields)) {
      const formLabel = fieldInfo.FORM_LABEL || '';
      const listLabel = fieldInfo.LIST_LABEL || '';
      const label = (formLabel + ' ' + listLabel).toLowerCase();
      
      // Check if field is related to Size, Model, Color, Brand
      if (label.includes('size') || label.includes('размер')) {
        targetFields.SIZE = {
          code: fieldCode,
          formLabel: formLabel,
          listLabel: listLabel,
          type: fieldInfo.TYPE || 'unknown'
        };
      }
      
      if (label.includes('model') || label.includes('модель')) {
        targetFields.MODEL = {
          code: fieldCode,
          formLabel: formLabel,
          listLabel: listLabel,
          type: fieldInfo.TYPE || 'unknown'
        };
      }
      
      if (label.includes('color') || label.includes('цвет')) {
        targetFields.COLOR = {
          code: fieldCode,
          formLabel: formLabel,
          listLabel: listLabel,
          type: fieldInfo.TYPE || 'unknown'
        };
      }
      
      if (label.includes('brand') || label.includes('бренд')) {
        targetFields.BRAND = {
          code: fieldCode,
          formLabel: formLabel,
          listLabel: listLabel,
          type: fieldInfo.TYPE || 'unknown'
        };
      }
      
      // Check for Order type / Delivery method / Payment status fields
      if (label.includes('order type') || label.includes('тип заказа') || 
          label.includes('order type') || label.includes('source description')) {
        targetFields.ORDER_TYPE = {
          code: fieldCode,
          formLabel: formLabel,
          listLabel: listLabel,
          type: fieldInfo.TYPE || 'unknown'
        };
      }
      
      if (label.includes('delivery') || label.includes('доставк') || 
          label.includes('shipping method') || label.includes('способ доставки')) {
        targetFields.DELIVERY_METHOD = {
          code: fieldCode,
          formLabel: formLabel,
          listLabel: listLabel,
          type: fieldInfo.TYPE || 'unknown'
        };
      }
      
      if (label.includes('payment status') || label.includes('статус оплаты') ||
          label.includes('payment') && label.includes('status')) {
        targetFields.PAYMENT_STATUS = {
          code: fieldCode,
          formLabel: formLabel,
          listLabel: listLabel,
          type: fieldInfo.TYPE || 'unknown'
        };
      }
    }
    
    console.log('[GET DEAL FIELDS] Found target fields:', targetFields);
    
    return res.status(200).json({
      success: true,
      targetFields: targetFields,
      allFields: fields // Include all fields for reference
    });
    
  } catch (error) {
    console.error('[GET DEAL FIELDS] Error:', error);
    return res.status(500).json({
      error: 'Failed to get deal fields',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

