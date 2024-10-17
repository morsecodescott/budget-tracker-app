// Import the mongoose models
const PlaidTransaction = require('../../models/PlaidTransaction');
const { retrieveAccountByPlaidAccountId } = require('./accounts');

/**
 * Creates or updates multiple transactions.
 *
 * @param {Object[]} transactions - Array of Plaid transactions.
 */
const createOrUpdateTransactions = async (transactions) => {
  const pendingQueries = transactions.map(async (transaction) => {
    const {
      account_id: plaidAccountId,
      transaction_id: plaidTransactionId,
      category_id: plaidCategoryId,
      category: categories,
      transaction_type: transactionType,
      name: transactionName,
      amount,
      iso_currency_code: isoCurrencyCode,
      unofficial_currency_code: unofficialCurrencyCode,
      date: transactionDate,
      pending,
      account_owner: accountOwner,
    } = transaction;

    // Retrieve the corresponding MongoDB account document by the plaidAccountId
    const account = await retrieveAccountByPlaidAccountId(plaidAccountId);

    const [category, subcategory] = categories || []; // Ensure categories exist

    // Create or update the transaction based on the plaidTransactionId
    try {
      await PlaidTransaction.findOneAndUpdate(
        { plaidTransactionId }, // Match by plaidTransactionId
        {
          plaidAccountId: account._id, // Reference to the account document
          plaidTransactionId,
          plaidCategoryId,
          category,
          subcategory,
          transactionType,
          transactionName,
          amount,
          isoCurrencyCode,
          unofficialCurrencyCode,
          transactionDate,
          pending,
          accountOwner,
        },
        { upsert: true, new: true } // Create if not exists, otherwise update
      );
    } catch (err) {
      console.error(`Error processing transaction ${plaidTransactionId}:`, err);
    }
  });

  await Promise.all(pendingQueries);
};

/**
 * Retrieves all transactions for a single account.
 *
 * @param {string} accountId - The MongoDB ObjectId of the account.
 * @returns {Object[]} - Array of transactions.
 */
const retrieveTransactionsByAccountId = async (accountId) => {
  try {
    const transactions = await PlaidTransaction.find({ plaidAccountId: accountId })
      .sort({ date: -1 }) // Sort by date in descending order
      .exec();
    return transactions;
  } catch (err) {
    console.error(`Error retrieving transactions for account ${accountId}:`, err);
    return [];
  }
};

/**
 * Retrieves all transactions for a single item.
 *
 * @param {string} itemId - The MongoDB ObjectId of the item.
 * @returns {Object[]} - Array of transactions.
 */
const retrieveTransactionsByItemId = async (itemId) => {
  try {
    const transactions = await PlaidTransaction.find({ item_id: itemId }) // Assuming `item_id` is stored in the transaction
      .sort({ date: -1 })
      .exec();
    return transactions;
  } catch (err) {
    console.error(`Error retrieving transactions for item ${itemId}:`, err);
    return [];
  }
};

/**
 * Retrieves all transactions for a single user.
 *
 * @param {string} userId - The MongoDB ObjectId of the user.
 * @returns {Object[]} - Array of transactions.
 */
const retrieveTransactionsByUserId = async (userId) => {
  try {
    const transactions = await PlaidTransaction.find({ user_id: userId }) // Assuming `user_id` is stored in the transaction
      .sort({ date: -1 })
      .exec();
    return transactions;
  } catch (err) {
    console.error(`Error retrieving transactions for user ${userId}:`, err);
    return [];
  }
};

/**
 * Deletes one or more transactions.
 *
 * @param {string[]} plaidTransactionIds - Array of Plaid transaction IDs to delete.
 */
const deleteTransactions = async (plaidTransactionIds) => {
  try {
    await PlaidTransaction.deleteMany({ plaidTransactionId: { $in: plaidTransactionIds } }).exec();
  } catch (err) {
    console.error(`Error deleting transactions:`, err);
  }
};

module.exports = {
  createOrUpdateTransactions,
  retrieveTransactionsByAccountId,
  retrieveTransactionsByItemId,
  retrieveTransactionsByUserId,
  deleteTransactions,
};
