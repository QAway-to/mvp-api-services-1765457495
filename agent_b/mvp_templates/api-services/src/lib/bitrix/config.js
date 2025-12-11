// Bitrix24 Configuration
// TODO: Replace with actual IDs from your Bitrix24 instance

export const BITRIX_CONFIG = {
<<<<<<< HEAD
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
=======
  // Category ID (Funnel ID) for deals
  CATEGORY_ID: 0, // Stock (in the shop) - default category

  // Default stage IDs (matching Bitrix24 stages)
  STAGES: {
    PAID: 'WON', // Success stage for paid orders
    PENDING: 'NEW', // New stage for pending payment
    REFUNDED: 'LOSE', // Loss stage for refunded
    CANCELLED: 'LOSE', // Loss stage for cancelled
    DEFAULT: 'NEW' // Default to NEW stage
>>>>>>> b269a933b0e95fe1f243751ba4af86212d3d5d38
  },

  // Source IDs mapping
  SOURCES: {
    SHOPIFY_DRAFT_ORDER: 'WEB', // Use WEB for draft orders
    SHOPIFY: 'WEB' // Use WEB for shopify orders
  },

  // Product ID for shipping (from working script)
  SHIPPING_PRODUCT_ID: 3000, // Real shipping product ID

  // SKU to Product ID mapping
  // TODO: Replace with actual product IDs from Bitrix24
  SKU_TO_PRODUCT_ID: {
    'ALB0002': 0, // TODO: Replace with actual product ID
    'ALB0005': 0, // TODO: Replace with actual product ID
    // Add more SKU mappings as needed
  }
};

<<<<<<< HEAD
/**
 * Financial status to stage ID mapping based on category
 * @param {string} financialStatus - Shopify financial_status
 * @param {number} categoryId - Bitrix category ID (2 or 8)
 * @returns {string} Stage ID
 */
export const financialStatusToStageId = (financialStatus, categoryId = 2) => {
=======
// Financial status to stage ID mapping
export const financialStatusToStageId = (financialStatus) => {
>>>>>>> b269a933b0e95fe1f243751ba4af86212d3d5d38
  const status = financialStatus?.toLowerCase() || '';
  const stages = categoryId === 8 ? BITRIX_CONFIG.STAGES_CAT_8 : BITRIX_CONFIG.STAGES_CAT_2;
  
  const mapping = {
<<<<<<< HEAD
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
=======
    'paid': BITRIX_CONFIG.STAGES.PAID,
    'pending': BITRIX_CONFIG.STAGES.PENDING,
    'refunded': BITRIX_CONFIG.STAGES.REFUNDED,
    'cancelled': BITRIX_CONFIG.STAGES.CANCELLED,
    'partially_paid': BITRIX_CONFIG.STAGES.PENDING,
    'partially_refunded': BITRIX_CONFIG.STAGES.REFUNDED,
    'voided': BITRIX_CONFIG.STAGES.CANCELLED
  };
  return mapping[status] || BITRIX_CONFIG.STAGES.DEFAULT;
>>>>>>> b269a933b0e95fe1f243751ba4af86212d3d5d38
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

