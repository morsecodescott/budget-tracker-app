
/**
 * @file Defines the handler for unhandled webhook types.
 */

const { logWebhookEvent } = require('./webhookUtils');

/**
 * Validates incoming webhook request body
 * @param {Object} requestBody 
 * @throws {Error} if required fields are missing
 */
const validateWebhookRequest = (requestBody) => {
  if (!requestBody) {
    throw new Error('Missing request body');
  }
  if (!requestBody.webhook_type) {
    throw new Error('Missing webhook_type');
  }
  if (!requestBody.webhook_code) {
    throw new Error('Missing webhook_code');
  }
  if (!requestBody.item_id) {
    throw new Error('Missing item_id');
  }
};

/**
 * Handles all unhandled/not yet implemented webhook events.
 *
 * @param {Object} requestBody the request body of an incoming webhook event
 */
const unhandledWebhook = async requestBody => {
  validateWebhookRequest(requestBody);

  const {
    webhook_type: webhookType,
    webhook_code: webhookCode,
    item_id: plaidItemId,
  } = requestBody;

  await logWebhookEvent({
    type: webhookType,
    code: webhookCode,
    plaidItemId,
    status: 'UNHANDLED',
    details: 'Unhandled webhook type received'
  });
};

module.exports = unhandledWebhook;
