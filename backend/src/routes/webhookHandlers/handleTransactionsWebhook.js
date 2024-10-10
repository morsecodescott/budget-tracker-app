const plaid = require('./plaid');
const {
  retrieveItemByPlaidItemId,
  updateItemTransactionsCursor,
} = require('./db/queries/items');
const { createAccounts } = require('./db/queries/accounts');
const { createOrUpdateTransactions, deleteTransactions } = require('./db/queries/transactions');
const { createPlaidApiEvent } = require('./db/queries/plaidApiEvents');

/**
 * Fetches transactions from the Plaid API for a given item.
 *
 * @param {string} plaidItemId the Plaid ID for the item.
 * @returns {Object{}} an object containing transactions and a cursor.
 */
const fetchTransactionUpdates = async (plaidItemId) => {
  const { plaid_access_token: accessToken, transactions_cursor: lastCursor } = await retrieveItemByPlaidItemId(plaidItemId);
  let cursor = lastCursor;

  let added = [];
  let modified = [];
  let removed = [];
  let hasMore = true;

  const batchSize = 100;

  try {
    while (hasMore) {
      const request = {
        access_token: accessToken,
        cursor: cursor,
        count: batchSize,
      };

      // Log API call event for `transactionsSync`
      await createPlaidApiEvent(plaidItemId, null, 'transactionsSync', [request], {});

      const response = await plaid.transactionsSync(request);
      const data = response.data;

      // Log the API response
      await createPlaidApiEvent(plaidItemId, null, 'transactionsSync', [request], response.data);

      added = added.concat(data.added);
      modified = modified.concat(data.modified);
      removed = removed.concat(data.removed);
      hasMore = data.has_more;

      cursor = data.next_cursor;
    }
  } catch (err) {
    console.error(`Error fetching transactions: ${err.message}`);
    await createPlaidApiEvent(plaidItemId, null, 'transactionsSync', null, { error: err.message });

    cursor = lastCursor; // If an error happens, use the last known cursor.
  }

  return { added, modified, removed, cursor, accessToken };
};

/**
 * Handles the fetching and storing of new, modified, or removed transactions.
 *
 * @param {string} plaidItemId the Plaid ID for the item.
 */
const updateTransactions = async (plaidItemId) => {
  try {
    const { added, modified, removed, cursor, accessToken } = await fetchTransactionUpdates(plaidItemId);

    const request = {
      access_token: accessToken,
    };

    // Log API call event for `accountsGet`
    await createPlaidApiEvent(plaidItemId, null, 'accountsGet', [request], {});

    const { data: { accounts } } = await plaid.accountsGet(request);

    // Log the API response
    await createPlaidApiEvent(plaidItemId, null, 'accountsGet', [request], accounts);

    // Update the database
    await createAccounts(plaidItemId, accounts);
    await createOrUpdateTransactions(added.concat(modified));
    await deleteTransactions(removed);
    await updateItemTransactionsCursor(plaidItemId, cursor);

    return {
      addedCount: added.length,
      modifiedCount: modified.length,
      removedCount: removed.length,
    };

  } catch (err) {
    console.error(`Error updating transactions: ${err.message}`);
    await createPlaidApiEvent(plaidItemId, null, 'updateTransactions', null, { error: err.message });
    throw err;
  }
};

module.exports = updateTransactions;
