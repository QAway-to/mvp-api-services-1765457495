// Bitrix24 Configuration
// TODO: Replace with actual IDs from your Bitrix24 instance

export const BITRIX_CONFIG = {
  // Category ID (Funnel ID) for deals - will be determined dynamically
  CATEGORY_ID: 2, // Default to category 2 (Stock site)

  // Stage IDs for category 2 (Stock site)
  STAGES: {
    PAID: 'C2:WON', // Paid orders
    PENDING: 'C2:PREPARATION', // Pending payment
    REFUNDED: 'C2:LOSE', // Refunded orders
    CANCELLED: 'C2:LOSE', // Cancelled orders
    DEFAULT: 'C2:NEW' // Default stage
  },

  // Source IDs mapping
  SOURCES: {
    SHOPIFY_DRAFT_ORDER: '', // TODO: Set source ID for shopify_draft_order
    SHOPIFY: '' // TODO: Set source ID for shopify
  },

  // Product ID for shipping
  SHIPPING_PRODUCT_ID: 0, // TODO: Set product ID for shipping if needed

  // SKU to Product ID mapping
  // TODO: Replace with actual product IDs from Bitrix24
  SKU_TO_PRODUCT_ID: {
    'ALB0002': 0, // TODO: Replace with actual product ID
    'ALB0005': 0, // TODO: Replace with actual product ID
    // Add more SKU mappings as needed
  }
};

// Financial status to stage ID mapping (category 2)
export const financialStatusToStageId = (financialStatus) => {
  const status = financialStatus?.toLowerCase() || '';
  const mapping = {
    'paid': BITRIX_CONFIG.STAGES.PAID, // C2:WON
    'pending': BITRIX_CONFIG.STAGES.PENDING, // C2:PREPARATION
    'refunded': BITRIX_CONFIG.STAGES.REFUNDED, // C2:LOSE
    'cancelled': BITRIX_CONFIG.STAGES.CANCELLED, // C2:LOSE
    'partially_paid': BITRIX_CONFIG.STAGES.PENDING, // C2:PREPARATION
    'partially_refunded': BITRIX_CONFIG.STAGES.REFUNDED, // C2:LOSE
    'voided': BITRIX_CONFIG.STAGES.CANCELLED // C2:LOSE
  };
  return mapping[status] || BITRIX_CONFIG.STAGES.DEFAULT; // C2:NEW
};

// Financial status to payment status field mapping
export const financialStatusToPaymentStatus = (financialStatus) => {
  const status = financialStatus?.toLowerCase() || '';
  const mapping = {
    'paid': 'PAID',
    'pending': 'NOT_PAID',
    'refunded': 'REFUNDED',
    'cancelled': 'VOIDED',
    'partially_paid': 'PARTIALLY_PAID',
    'partially_refunded': 'PARTIALLY_REFUNDED',
    'voided': 'VOIDED'
  };
  return mapping[status] || 'NOT_PAID';
};

// Source name to source ID mapping
export const sourceNameToSourceId = (sourceName) => {
  const source = sourceName?.toLowerCase() || '';
  const mapping = {
    'shopify_draft_order': BITRIX_CONFIG.SOURCES.SHOPIFY_DRAFT_ORDER,
    'shopify': BITRIX_CONFIG.SOURCES.SHOPIFY,
    'web': BITRIX_CONFIG.SOURCES.SHOPIFY,
    'pos': BITRIX_CONFIG.SOURCES.SHOPIFY
  };
  return mapping[source] || null;
};

