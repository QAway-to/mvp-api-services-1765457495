// Shopify Webhook Adapter
// In-memory storage for received events
let receivedEvents = [];

/**
 * Shopify Webhook Adapter
 * Handles Shopify webhook events storage and retrieval
 */
export class ShopifyAdapter {
  constructor() {
    this.storage = receivedEvents; // Reference to in-memory array
  }

  getName() {
    return 'shopify';
  }

  /**
   * Validate Shopify webhook payload against simplified schema
   * @param {Object} payload - Webhook payload to validate
   * @returns {Object} { valid: boolean, errors: Array<string> }
   */
  validateWebhookPayload(payload) {
    const errors = [];
    
    if (!payload || typeof payload !== 'object') {
      return { valid: false, errors: ['Payload must be an object'] };
    }

    // Check required top-level fields (simplified validation)
    if (payload.id !== undefined && typeof payload.id !== 'number') {
      errors.push('id must be a number');
    }
    
    if (payload.email !== undefined && typeof payload.email !== 'string') {
      errors.push('email must be a string');
    }
    
    if (payload.created_at !== undefined && typeof payload.created_at !== 'string') {
      errors.push('created_at must be a string');
    }
    
    if (payload.currency !== undefined && typeof payload.currency !== 'string') {
      errors.push('currency must be a string');
    }
    
    if (payload.total_price !== undefined && typeof payload.total_price !== 'string') {
      errors.push('total_price must be a string');
    }

    // Validate line_items if present
    if (payload.line_items !== undefined) {
      if (!Array.isArray(payload.line_items)) {
        errors.push('line_items must be an array');
      } else {
        payload.line_items.forEach((item, index) => {
          if (item.id !== undefined && typeof item.id !== 'number') {
            errors.push(`line_items[${index}].id must be a number`);
          }
          if (item.quantity !== undefined && typeof item.quantity !== 'number') {
            errors.push(`line_items[${index}].quantity must be a number`);
          }
          if (item.title !== undefined && typeof item.title !== 'string') {
            errors.push(`line_items[${index}].title must be a string`);
          }
          if (item.price !== undefined && typeof item.price !== 'string') {
            errors.push(`line_items[${index}].price must be a string`);
          }
          if (item.sku !== undefined && typeof item.sku !== 'string') {
            errors.push(`line_items[${index}].sku must be a string`);
          }
        });
      }
    }

    // Validate discount_codes if present
    if (payload.discount_codes !== undefined) {
      if (!Array.isArray(payload.discount_codes)) {
        errors.push('discount_codes must be an array');
      } else {
        payload.discount_codes.forEach((code, index) => {
          if (code.code !== undefined && typeof code.code !== 'string') {
            errors.push(`discount_codes[${index}].code must be a string`);
          }
          if (code.amount !== undefined && typeof code.amount !== 'string') {
            errors.push(`discount_codes[${index}].amount must be a string`);
          }
          if (code.type !== undefined && typeof code.type !== 'string') {
            errors.push(`discount_codes[${index}].type must be a string`);
          }
        });
      }
    }

    // Validate customer if present
    if (payload.customer !== undefined) {
      if (typeof payload.customer !== 'object') {
        errors.push('customer must be an object');
      } else {
        if (payload.customer.id !== undefined && typeof payload.customer.id !== 'number') {
          errors.push('customer.id must be a number');
        }
        if (payload.customer.first_name !== undefined && typeof payload.customer.first_name !== 'string') {
          errors.push('customer.first_name must be a string');
        }
        if (payload.customer.last_name !== undefined && typeof payload.customer.last_name !== 'string') {
          errors.push('customer.last_name must be a string');
        }
        if (payload.customer.email !== undefined && typeof payload.customer.email !== 'string') {
          errors.push('customer.email must be a string');
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Store webhook event
   * @param {Object} payload - Validated webhook payload
   * @returns {Object} Stored event with timestamp
   */
  storeEvent(payload) {
    const event = {
      ...payload,
      received_at: new Date().toISOString(),
      id: payload.id || Date.now() // Use provided id or generate one
    };
    
    this.storage.push(event);
    return event;
  }

  /**
   * Get all events (newest first)
   * @returns {Array<Object>} All stored events
   */
  getAllEvents() {
    return [...this.storage].reverse(); // Return newest first
  }

  /**
   * Get latest event
   * @returns {Object|null} Latest event or null
   */
  getLatestEvent() {
    if (this.storage.length === 0) {
      return null;
    }
    return this.storage[this.storage.length - 1];
  }

  /**
   * Get events count
   * @returns {number} Number of stored events
   */
  getEventsCount() {
    return this.storage.length;
  }

  /**
   * Clear all events (for testing/reset)
   * @returns {number} Number of cleared events
   */
  clearEvents() {
    const count = this.storage.length;
    this.storage.length = 0;
    return count;
  }
}

// Export singleton instance
export const shopifyAdapter = new ShopifyAdapter();

