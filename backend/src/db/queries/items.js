const PlaidItem = require('../../models/PlaidItem');
const PlaidAccount = require('../../models/PlaidAccount');
const plaidClient = require('../../config/plaidClient');
const { deleteTransactionsByAccountId } = require('./transactions');

/**
 * Creates a single item.
 *
 * @param {string} plaidInstitutionId the Plaid institution ID of the item.
 * @param {string} plaidAccessToken the Plaid access token of the item.
 * @param {string} plaidItemId the Plaid ID of the item.
 * @param {string} userId the ID of the user.
 * @returns {Object} the new item.
 */
const createItem = async (
  plaidInstitutionId,
  plaidAccessToken,
  plaidItemId,
  userId
) => {
  const newItem = new PlaidItem({
    plaidInstitutionId,
    accessToken: plaidAccessToken,
    plaidItemId,
    institutionId: plaidInstitutionId,
    userId,
    status: 'good' // Assuming 'good' status when item is created
  });

  return await newItem.save(); // Mongoose returns the saved document
};

/**
 * Retrieves a single item by its ID.
 *
 * @param {string} itemId the ID of the item (MongoDB ObjectId).
 * @returns {Object} the item document.
 */
const retrieveItemById = async itemId => {
  const item = await PlaidItem.findById(itemId);
  if (!item) throw new Error('Item not found');
  return item;
};

/**
 * Retrieves a single item by its Plaid access token.
 *
 * @param {string} accessToken the Plaid access token of the item.
 * @returns {Object} the item document.
 */
const retrieveItemByPlaidAccessToken = async accessToken => {
  const item = await PlaidItem.findOne({ accessToken });
  if (!item) throw new Error('Item not found');
  return item;
};

/**
 * Retrieves a single item by its Plaid institution ID and user ID.
 *
 * @param {string} plaidInstitutionId the Plaid institution ID of the item.
 * @param {string} userId the ID of the user.
 * @returns {Object} the item document.
 */
const retrieveItemByPlaidInstitutionId = async (plaidInstitutionId, userId) => {
  const item = await PlaidItem.findOne({ institutionId: plaidInstitutionId, userId });
  if (!item) throw new Error('Item not found');
  return item;
};

/**
 * Retrieves a single item by its Plaid item ID.
 *
 * @param {string} plaidItemId the Plaid ID of the item.
 * @returns {Object} the item document.
 */
const retrieveItemByPlaidItemId = async plaidItemId => {
  const item = await PlaidItem.findOne({ plaidItemId });
  if (!item) throw new Error('Item not found');
  return item;
};

/**
 * Retrieves all items for a single user.
 *
 * @param {string} userId the ID of the user.
 * @returns {Object[]} an array of item documents.
 */
const retrieveItemsByUser = async userId => {
  return await PlaidItem.find({ userId });
};

/**
 * Updates the status for a single item.
 *
 * @param {string} itemId the MongoDB ObjectId of the item.
 * @param {string} status the new status of the item.
 */
const updateItemStatus = async (itemId, status) => {
  const item = await PlaidItem.findByIdAndUpdate(
    itemId,
    { status },
    { new: true }
  );
  if (!item) throw new Error('Item not found');
  return item;
};

/**
 * Updates the transaction cursor for a single item.
 *
 * @param {string} plaidItemId the Plaid item ID of the item.
 * @param {string} transactionsCursor the latest observed transactions cursor.
 */
const updateItemTransactionsCursor = async (plaidItemId, transactionsCursor) => {
  const item = await PlaidItem.findOneAndUpdate(
    { plaidItemId },
    { transaction_cursor: transactionsCursor },
    { new: true }
  );
  if (!item) throw new Error('Item not found');
  return item;
};

const mongoose = require('mongoose');

/**
 * Removes a single item by its MongoDB _id, removes it from Plaid, and deletes associated accounts and transactions.
 *
 * @param {string} itemId - The MongoDB ObjectId of the PlaidItem.
 * @param {string} userId - The user ID to verify ownership
 * @returns {Object} The deleted item information and operation status
 */
const deleteItem = async (itemId, userId) => {
  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(itemId)) {
    throw new Error('Invalid item ID format');
  }

  let item;
  let plaidResponse = null;
  let deleteResult = null;
  let accountsDeleted = false;

  try {
    // Find the item and verify ownership
    console.log("Searching for: ", itemId, userId);
    item = await PlaidItem.findOne({ _id: itemId, userId });
    if (!item) throw new Error('Item not found');

    try {
      // Attempt to remove item from Plaid
      plaidResponse = await plaidClient.itemRemove({
        access_token: item.accessToken
      });
    } catch (error) {
      // If Plaid API fails with "item not found" error, continue
      if (error.response?.data?.error_message?.includes('The Item you requested cannot be found')) {
        console.log('Plaid item not found, continuing with local cleanup');
      } else {
        throw error;
      }
    }

    // Delete associated accounts and transactions
    await deleteAccountsByItemId(itemId);
    accountsDeleted = true;

    // Delete the item from our database
    deleteResult = await PlaidItem.deleteOne({ _id: itemId });

    return {
      success: true,
      deletedItem: item,
      plaidResponse,
      deleteResult,
      accountsDeleted
    };
  } catch (error) {
    // If accounts weren't deleted yet, try to delete them
    if (!accountsDeleted && item) {
      try {
        await deleteAccountsByItemId(itemId);
      } catch (accountsError) {
        console.error('Failed to delete accounts:', accountsError);
      }
    }

    if (error.response?.data?.error_code) {
      throw new Error(`Plaid API error: ${error.response.data.error_message}`);
    }
    throw new Error(`Database operation failed: ${error.message}`);
  }
}



/**
 * Deletes all accounts associated with an itemId (MongoDB _id).
 *
 * @param {string} itemId - The MongoDB ObjectId of the PlaidItem.
 * @param {Object} [session] - Optional mongoose session for transactions
 */
const deleteAccountsByItemId = async (itemId, session = null) => {
  const findOptions = session ? { session } : {};
  const accounts = await PlaidAccount.find({ plaidItemId: itemId }, null, findOptions);

  // Delete all associated transactions for each account
  for (const account of accounts) {
    await deleteTransactionsByAccountId(account._id, session);
  }

  // Now, delete all accounts
  const deleteOptions = session ? { session } : {};
  const result = await PlaidAccount.deleteMany({ plaidItemId: itemId }, deleteOptions);
  return result;
};


module.exports = {
  createItem,
  deleteItem,
  retrieveItemById,
  retrieveItemByPlaidAccessToken,
  retrieveItemByPlaidInstitutionId,
  retrieveItemByPlaidItemId,
  retrieveItemsByUser,
  updateItemStatus,
  updateItemTransactionsCursor,
  deleteAccountsByItemId,

};
