// Import the mongoose models
const Transaction = require('../../models/Transaction');
const { retrieveAccountByAccountId } = require('./accounts');
const { mapToInternalCategory } = require('../queries/services');
const CategoryRule = require('../../models/CategoryRule');




/**
 * Creates or updates multiple transactions.
 *
 * @param {Object[]} transactions - Array of Plaid transactions.
 */
const createOrUpdateTransactions = async (transactions) => {
  const pendingQueries = transactions.map(async (transaction) => {
    const {
      account_id: accountId,
      transaction_id: plaidTransactionId,
      personal_finance_category,
      transaction_type: transactionType,
      name,
      merchant_name,
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


    // Retrieve the corresponding MongoDB account document by the accountId
    const account = await retrieveAccountByAccountId(accountId);

    let internalCategoryId = await mapToInternalCategory(plaidCategory);

    // Apply category rules
    try {
        const item = await require('../../models/Item').findById(account.itemId || account.plaidItemId);
        if (item) {
            const rules = await CategoryRule.find({ userId: item.userId });
            for (const rule of rules) {
                const escapedMerchantName = rule.merchantName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                let isMatch = false;
                const mName = merchant_name || name || "";

                switch (rule.matchType) {
                    case 'exact':
                        isMatch = new RegExp(`^${escapedMerchantName}$`, 'i').test(mName);
                        break;
                    case 'startsWith':
                        isMatch = new RegExp(`^${escapedMerchantName}`, 'i').test(mName);
                        break;
                    case 'endsWith':
                        isMatch = new RegExp(`${escapedMerchantName}$`, 'i').test(mName);
                        break;
                    case 'contains':
                    default:
                        isMatch = new RegExp(escapedMerchantName, 'i').test(mName);
                        break;
                }

                if (isMatch) {
                    internalCategoryId = rule.categoryId;
                    break; // Apply first matched rule
                }
            }
        }
    } catch (ruleErr) {
        console.error('Error applying category rules during sync:', ruleErr);
    }


    // Create or update the transaction based on the plaidTransactionId
    try {
      await Transaction.findOneAndUpdate(
        { plaidTransactionId }, // Match by plaidTransactionId
        {
          accountId: account._id, // Reference to the account document
          plaidTransactionId,
          category: internalCategoryId,
          plaidCategory,

          transactionType,
          name,
          merchant_name,
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
    const transactions = await Transaction.find({ accountId: accountId })
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
    const transactions = await Transaction.find({ item_id: itemId }) // Assuming `item_id` is stored in the transaction
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
    const transactions = await Transaction.find({ user_id: userId }) // Assuming `user_id` is stored in the transaction
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
    await Transaction.deleteMany({ plaidTransactionId: { $in: plaidTransactionIds } }).exec();
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
  const result = await Transaction.deleteMany({ accountId: accountId });
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
