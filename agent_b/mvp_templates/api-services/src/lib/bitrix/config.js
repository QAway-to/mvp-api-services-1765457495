// Bitrix24 Configuration
// TODO: Replace with actual IDs from your Bitrix24 instance

export const BITRIX_CONFIG = {
  // Category ID (Funnel ID) for deals - will be determined dynamically based on order tags
  CATEGORY_ID: 2, // Default: Stock (site) - cat_2

  // Stage IDs for Category 2 (Stock site)
  STAGES_CAT_2: {
    PAID: 'C2:WON',
    PENDING: 'C2:PREPARATION',
    REFUNDED: 'C2:LOSE',
    CANCELLED: 'C2:LOSE',
    DEFAULT: 'C2:NEW'
  },

  // Stage IDs for Category 8 (Pre-order site)
  STAGES_CAT_8: {
    PAID: 'C8:WON',
    PENDING: 'C8:PREPARATION',
    REFUNDED: 'C8:LOSE',
    CANCELLED: 'C8:LOSE',
    DEFAULT: 'C8:NEW'
  },

  // Legacy STAGES for backward compatibility
  STAGES: {
    PAID: 'C2:WON',
    PENDING: 'C2:PREPARATION',
    REFUNDED: 'C2:LOSE',
    CANCELLED: 'C2:LOSE',
    DEFAULT: 'C2:NEW'
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

/**
 * Financial status to stage ID mapping based on category
 * @param {string} financialStatus - Shopify financial_status
 * @param {number} categoryId - Bitrix category ID (2 or 8)
 * @returns {string} Stage ID
 */
export const financialStatusToStageId = (financialStatus, categoryId = 2) => {
  const status = financialStatus?.toLowerCase() || '';
  const stages = categoryId === 8 ? BITRIX_CONFIG.STAGES_CAT_8 : BITRIX_CONFIG.STAGES_CAT_2;
  
  const mapping = {
    'paid': stages.PAID,
    'pending': stages.PENDING,
    'authorized': stages.PENDING,
    'refunded': stages.REFUNDED,
    'cancelled': stages.CANCELLED,
    'partially_paid': stages.PENDING,
    'partially_refunded': stages.REFUNDED,
    'voided': stages.CANCELLED
  };
  
  return mapping[status] || stages.DEFAULT;
};

/**
 * Financial status to payment status field (UF_CRM_PAYMENT_STATUS)
 * Returns string value for internal use
 * @param {string} financialStatus - Shopify financial_status
 * @returns {string} Payment status value (PAID, NOT_PAID, etc.)
 */
export const financialStatusToPaymentStatus = (financialStatus) => {
  const status = financialStatus?.toLowerCase() || '';
  
  const mapping = {
    'paid': 'PAID',
    'pending': 'NOT_PAID',
    'authorized': 'NOT_PAID',
    'partially_paid': 'PARTIALLY_PAID',
    'refunded': 'REFUNDED',
    'partially_refunded': 'PARTIALLY_REFUNDED',
    'voided': 'VOIDED'
  };
  
  return mapping[status] || 'NOT_PAID';
};

/**
 * Payment status to Bitrix enumeration ID
 * Bitrix field: UF_CRM_1739183959976
 * Values: "56" = "Paid", "58" = "Unpaid", "60" = "10% prepayment"
 * @param {string} paymentStatus - Payment status value (PAID, NOT_PAID, etc.)
 * @returns {string} Bitrix enumeration ID
 */
export const paymentStatusToBitrixEnumId = (paymentStatus) => {
  const status = paymentStatus?.toUpperCase() || 'NOT_PAID';
  
  const mapping = {
    'PAID': '56',           // Paid
    'NOT_PAID': '58',       // Unpaid
    'PARTIALLY_PAID': '60', // 10% prepayment
    'REFUNDED': '58',       // Unpaid (refunded = unpaid)
    'PARTIALLY_REFUNDED': '58', // Unpaid
    'VOIDED': '58'          // Unpaid
  };
  
  return mapping[status] || '58'; // Default to Unpaid
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

