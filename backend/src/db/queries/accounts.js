const PlaidAccount = require('../../models/PlaidAccount'); // Mongoose model for accounts
const PlaidItem = require('../../models/PlaidItem'); // Mongoose model for items

/**
 * Creates multiple accounts related to a single item.
 *
 * @param {string} plaidItemId the Plaid ID of the item.
 * @param {Object[]} accounts an array of accounts from Plaid API.
 * @returns {Object[]} an array of new or updated accounts.
 */
const createAccounts = async (plaidItemId, accounts) => {
    // Find the item by its Plaid item ID
    const item = await PlaidItem.findOne({ plaidItemId });
    if (!item) throw new Error('PlaidItem not found');

    // Array to hold created/updated accounts
    const accountPromises = accounts.map(async (account) => {
        const {
            account_id: plaidAccountId,
            name: accountName,
            mask,
            official_name: officialName,
            balances: { available: availableBalance, current: currentBalance },
            subtype: accountSubType,
            type: accountType,
        } = account;

        // Update or create the account
        const updatedAccount = await PlaidAccount.findOneAndUpdate(
            { plaidAccountId },
            {
                plaidItemId: item._id,
                accountName,
                accountType,
                accountSubType,
                availableBalance,
                currentBalance,
            },
            { new: true, upsert: true } // upsert: creates a new account if it doesn't exist
        );

        // Add the account reference to the item if not already there
        if (!item.accounts.includes(updatedAccount._id)) {
            item.accounts.push(updatedAccount._id);
        }

        return updatedAccount;
    });

    // Wait for all accounts to be processed
    const createdAccounts = await Promise.all(accountPromises);

    // Save the updated item with account references
    await item.save();

    return createdAccounts;
};

/**
 * Retrieves the account associated with a Plaid account ID.
 *
 * @param {string} plaidAccountId the Plaid ID of the account.
 * @returns {Object} a single account document.
 */
const retrieveAccountByPlaidAccountId = async (plaidAccountId) => {
    const account = await PlaidAccount.findOne({ plaidAccountId });
    if (!account) throw new Error('Account not found');
    return account;
};

/**
 * Retrieves the accounts for a single item by item ID.
 *
 * @param {string} itemId the ID of the item (ObjectId).
 * @returns {Object[]} an array of accounts.
 */
const retrieveAccountsByItemId = async (itemId) => {
    const item = await PlaidItem.findById(itemId).populate('accounts');
    if (!item) throw new Error('Item not found');
    return item.accounts; // Populated array of account documents
};

/**
 * Retrieves all accounts for a single user.
 *
 * @param {string} userId the ID of the user.
 * @returns {Object[]} an array of accounts.
 */
const retrieveAccountsByUserId = async (userId) => {
    // Find all Plaid items associated with the user
    const items = await PlaidItem.find({ userId }).populate('accounts');
    const accounts = items.reduce((acc, item) => acc.concat(item.accounts), []);
    return accounts;
};

module.exports = {
    createAccounts,
    retrieveAccountByPlaidAccountId,
    retrieveAccountsByItemId,
    retrieveAccountsByUserId,
};
