// Import the mongoose model
const PlaidApiEvent = require('../../models/PlaidApiEvent');

/**
 * Creates a single Plaid API event log entry.
 *
 * @param {string} itemId - The MongoDB ObjectId of the item (plaidItemId).
 * @param {string} userId - The MongoDB ObjectId of the user.
 * @param {string} plaidMethod - The Plaid client method called.
 * @param {Array} clientMethodArgs - The arguments passed to the Plaid client method.
 * @param {Object} response - The Plaid API response object.
 */
const createPlaidApiEvent = async (
  itemId,
  userId,
  plaidMethod,
  clientMethodArgs,
  response
) => {
  const { error_code: errorCode, error_type: errorType, request_id: requestId } = response;

  // Create a new event document using the PlaidApiEvent schema
  try {
    const plaidApiEvent = new PlaidApiEvent({
      plaidItemId: itemId,
      userId,
      plaidMethod,
      clientMethodArgs,
      requestId,
      errorType,
      errorCode,
    });

    // Save the event to MongoDB
    await plaidApiEvent.save();
  } catch (err) {
    console.error(`Error logging Plaid API event for item ${itemId}:`, err);
  }
};

module.exports = {
  createPlaidApiEvent,
};
