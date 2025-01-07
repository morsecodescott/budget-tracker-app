// Import the mongoose model
const PlaidApiEvent = require('../../models/PlaidApiEvent');

/**
 * Creates a Plaid API event log entry. Can handle both API calls and webhook events.
 *
 * @param {Object} eventData - Event data to log
 * @param {string} eventData.type - Event type (API_CALL or WEBHOOK)
 * @param {string} eventData.code - Webhook code or API method name
 * @param {string} eventData.plaidItemId - Plaid item ID
 * @param {string} [eventData.userId] - User ID (optional for webhooks)
 * @param {string} [eventData.status] - Event status
 * @param {Object} [eventData.details] - Additional details
 * @param {string} [eventData.error] - Error message
 * @param {string} [eventData.requestId] - Plaid request ID
 * @param {string} [eventData.errorType] - Plaid error type
 * @param {string} [eventData.errorCode] - Plaid error code
 * @returns {Promise<void>}
 */
const createPlaidApiEvent = async (eventData) => {
  try {
    const plaidApiEvent = new PlaidApiEvent({
      type: eventData.type,
      code: eventData.code,
      plaidItemId: eventData.plaidItemId || null,
      userId: eventData.userId || null,
      status: eventData.status || null,
      details: eventData.details || null,
      error: eventData.error || null,
      requestId: eventData.requestId || null,
      errorType: eventData.errorType || null,
      errorCode: eventData.errorCode || null,
      timestamp: eventData.timestamp || new Date()
    });

    await plaidApiEvent.save();
  } catch (err) {
    console.error(`Error logging Plaid event for item ${eventData.plaidItemId}:`, err);
  }
};

module.exports = {
  createPlaidApiEvent,
};
