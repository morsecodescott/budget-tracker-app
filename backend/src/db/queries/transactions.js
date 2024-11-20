// Import the mongoose models
const PlaidTransaction = require('../../models/PlaidTransaction');
const { retrieveAccountByPlaidAccountId } = require('./accounts');
const { mapToInternalCategory } = require('../queries/services'); 




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
      personal_finance_category,
      transaction_type: transactionType,
      name,
      amount,
      iso_currency_code: isoCurrencyCode,
      unofficial_currency_code: unofficialCurrencyCode,
      date,
      pending,
      account_owner: accountOwner,
      
    } = transaction;
    
    const plaidCategory = {
      detailed: personal_finance_category?.detailed || null,
      primary: personal_finance_category?.primary || null,
      confidence_level: personal_finance_category?.confidence_level || null,
    };


    // Retrieve the corresponding MongoDB account document by the plaidAccountId
    const account = await retrieveAccountByPlaidAccountId(plaidAccountId);
    
    const internalCategoryId = await mapToInternalCategory(plaidCategory);


    // Create or update the transaction based on the plaidTransactionId
    try {
      await PlaidTransaction.findOneAndUpdate(
        { plaidTransactionId }, // Match by plaidTransactionId
        {
          plaidAccountId: account._id, // Reference to the account document
          plaidTransactionId,
          category: internalCategoryId,
          plaidCategory,

          transactionType,
          name,
          amount,
          isoCurrencyCode,
          unofficialCurrencyCode,
          date,
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
      .populate('category')
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


/**
 * Deletes all transactions associated with an accountId (MongoDB _id).
 *
 * @param {string} accountId - The MongoDB ObjectId of the account.
 */
const deleteTransactionsByAccountId = async (accountId) => {
  const result = await PlaidTransaction.deleteMany({ plaidAccountId: accountId });
  return result;
};



module.exports = {
  createOrUpdateTransactions,
  retrieveTransactionsByAccountId,
  retrieveTransactionsByItemId,
  retrieveTransactionsByUserId,
  deleteTransactions,
  deleteTransactionsByAccountId
};
