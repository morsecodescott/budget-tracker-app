/**
 * @file Defines the handler for Transactions webhooks.
 * https://plaid.com/docs/#transactions-webhooks
 */

const { retrieveItemByPlaidItemId } = require('../db/queries');
const updateTransactions = require('../update_transactions');
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
  if (!requestBody.webhook_code) {
    throw new Error('Missing webhook_code');
  }
  if (!requestBody.item_id) {
    throw new Error('Missing item_id');
  }
};

/**
 * Handles all transaction webhook events. The transaction webhook notifies
 * you that a single item has new transactions available.
 *
 * @param {Object} requestBody the request body of an incoming webhook event
 * @param {Object} io a socket.io server instance
 * @returns {Promise<void>}
 */
const handleTransactionsWebhook = async (requestBody) => {
  const io = require('../../server').app.get('io');
  try {
    // Validate incoming webhook data
    validateWebhookRequest(requestBody);

    const { webhook_code: webhookCode, item_id: plaidItemId } = requestBody;

    // Log webhook event
    await logWebhookEvent({
      type: 'TRANSACTIONS',
      code: webhookCode,
      plaidItemId,
      status: 'RECEIVED'
    });

    switch (webhookCode) {
      case 'SYNC_UPDATES_AVAILABLE': {
        // Fired when new transactions data becomes available
        const { addedCount, modifiedCount, removedCount } = await updateTransactions(plaidItemId);
        const item = await retrieveItemByPlaidItemId(plaidItemId);

        // Log successful update
        await logWebhookEvent({
          type: 'TRANSACTIONS',
          code: webhookCode,
          plaidItemId,
          status: 'PROCESSED',
          details: {
            addedCount,
            modifiedCount,
            removedCount
          }
        });

        // Notify client via WebSocket
        if (io) {
          const room = `user-${item.userId}`;
          io.to(room).emit('TRANSACTIONS_UPDATE', {
            itemId: item.id,
            addedCount,
            modifiedCount,
            removedCount,
          });
        }
        break;
      }

      case 'DEFAULT_UPDATE':
      case 'INITIAL_UPDATE':
      case 'HISTORICAL_UPDATE':
        // Ignore - not needed if using sync endpoint + webhook
        break;

      default:
        await logWebhookEvent({
          type: 'TRANSACTIONS',
          code: webhookCode,
          plaidItemId,
          status: 'UNHANDLED'
        });
    }
  } catch (error) {
    await logWebhookEvent({
      type: 'TRANSACTIONS',
      code: requestBody?.webhook_code,
      plaidItemId: requestBody?.item_id,
      status: 'ERROR',
      error: error.message
    });
    throw error;
  }
};

module.exports = handleTransactionsWebhook;
