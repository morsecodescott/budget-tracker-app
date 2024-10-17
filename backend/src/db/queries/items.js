const PlaidItem = require('../../models/PlaidItem'); // Mongoose model for items

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

/**
 * Removes a single item. The database will also remove related accounts and transactions.
 *
 * @param {string} itemId the MongoDB ObjectId of the item.
 */
const deleteItem = async itemId => {
  const result = await PlaidItem.findByIdAndDelete(itemId);
  if (!result) throw new Error('Item not found');
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
};
