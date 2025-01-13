/**
 * @file Defines the handler for Item webhooks.
 * https://plaid.com/docs/#item-webhooks
 */

const {
  updateItemStatus,
  retrieveItemByPlaidItemId,
} = require('../db/queries');
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
 * Handles Item errors received from item webhooks. When an error is received
 * different operations are needed to update an item based on the the error_code
 * that is encountered.
 *
 * @param {string} plaidItemId the Plaid ID of an item.
 * @param {Object} error the error received from the webhook.
 */
const itemErrorHandler = async (plaidItemId, error) => {
  const { error_code: errorCode } = error;
  switch (errorCode) {
    case 'ITEM_LOGIN_REQUIRED': {
      const { id: itemId } = await retrieveItemByPlaidItemId(plaidItemId);
      await updateItemStatus(itemId, 'bad');
      break;
    }
    default:
      await logWebhookEvent({
        type: 'ITEMS',
        code: 'ITEM_ERROR',
        plaidItemId,
        status: 'ERROR',
        error: {
          code: errorCode,
          message: 'Unhandled item error'
        }
      });
  }
};

/**
 * Handles all Item webhook events.
 *
 * @param {Object} requestBody the request body of an incoming webhook event.
 * @param {Object} io a socket.io server instance.
 * @todo Implement socket.io notifications for real-time updates
 */
const handleItemWebhook = async (requestBody, io) => {
  // Validate request before processing
  validateWebhookRequest(requestBody);

  const {
    webhook_code: webhookCode,
    item_id: plaidItemId,
    error,
  } = requestBody;

  switch (webhookCode) {
    case 'WEBHOOK_UPDATE_ACKNOWLEDGED':
      await logWebhookEvent({
        type: 'ITEMS',
        code: webhookCode,
        plaidItemId,
        status: 'PROCESSED',
        details: 'Item is updated'
      });
      break;
    case 'ERROR': {
      itemErrorHandler(plaidItemId, error);
      const { id: itemId } = await retrieveItemByPlaidItemId(plaidItemId);
      await logWebhookEvent({
        type: 'ITEMS',
        code: webhookCode,
        plaidItemId,
        status: 'ERROR',
        error: {
          code: error.error_code,
          message: error.error_message
        }
      });
      break;
    }
    case 'PENDING_EXPIRATION':
    case 'PENDING_DISCONNECT': {
      const { id: itemId } = await retrieveItemByPlaidItemId(plaidItemId);
      await updateItemStatus(itemId, 'bad');
      await logWebhookEvent({
        type: 'ITEMS',
        code: webhookCode,
        plaidItemId,
        status: 'PROCESSED',
        details: 'User needs to re-enter login credentials'
      });
      break;
    }
    case 'ITEM_REMOVED': {
      const { id: itemId } = await retrieveItemByPlaidItemId(plaidItemId);
      const { userId } = await retrieveItemByPlaidItemId(plaidItemId);
      const { deleteItem } = require('../db/queries');
      await deleteItem(itemId, userId);
      await logWebhookEvent({
        type: 'ITEMS',
        code: webhookCode,
        plaidItemId,
        status: 'PROCESSED',
        details: 'Item and associated data removed'
      });
      break;
    }
    case 'LOGIN_REPAIRED': {
      await logWebhookEvent({
        type: 'ITEMS',
        code: webhookCode,
        plaidItemId,
        status: 'UNHANDLED',
        details: 'Login repaired - implementation needed'
      });
      break;
    }
    case 'NEW_ACCOUNTS_AVAILABLE': {
      await logWebhookEvent({
        type: 'ITEMS',
        code: webhookCode,
        plaidItemId,
        status: 'UNHANDLED',
        details: 'New accounts available - implementation needed'
      });
      break;
    }
    case 'USER_PERMISSION_REVOKED': {
      await logWebhookEvent({
        type: 'ITEMS',
        code: webhookCode,
        plaidItemId,
        status: 'UNHANDLED',
        details: 'User permission revoked - implementation needed'
      });
      break;
    }
    case 'USER_ACCOUNT_REVOKED': {
      await logWebhookEvent({
        type: 'ITEMS',
        code: webhookCode,
        plaidItemId,
        status: 'UNHANDLED',
        details: 'User account revoked - implementation needed'
      });
      break;
    }
    default:
      await logWebhookEvent({
        type: 'ITEMS',
        code: webhookCode,
        plaidItemId,
        status: 'UNHANDLED',
        details: 'Unhandled webhook type received'
      });
  }
};

module.exports = handleItemWebhook;
