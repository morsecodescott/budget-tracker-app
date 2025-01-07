const { createPlaidApiEvent } = require('../db/queries/plaidApiEvents');

/**
 * Logs webhook events to database and console
 * @param {Object} params
 * @param {string} params.type - Webhook type (e.g., TRANSACTIONS)
 * @param {string} params.code - Webhook code
 * @param {string} params.plaidItemId - Plaid item ID
 * @param {string} params.status - Event status (RECEIVED, PROCESSED, ERROR, etc.)
 * @param {Object} [params.details] - Additional details about the event
 * @param {string} [params.error] - Error message if applicable
 * @returns {Promise<void>}
 */
const logWebhookEvent = async ({ type, code, plaidItemId, status, details, error }) => {
    const logEntry = {
        type: `WEBHOOK_${type}`,
        code,
        status,
        plaidItemId,
        details: details ? JSON.stringify(details) : null,
        error: error || null,
        timestamp: new Date()
    };

    // Log to database
    try {
        await createPlaidApiEvent(logEntry);
    } catch (dbError) {
        console.error('Failed to log webhook event to database:', dbError);
    }

    // Log to console
    console.log(`[WEBHOOK] ${type} ${code} ${status}`, {
        plaidItemId,
        ...(details && { details }),
        ...(error && { error })
    });
};

module.exports = {
    logWebhookEvent
};
