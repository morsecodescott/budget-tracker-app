// Export functions from accounts.js
const { 
  createAccounts,
  retrieveAccountByPlaidAccountId,
  retrieveAccountsByItemId,
  retrieveAccountsByUserId,
     
  } = require('./accounts');
  
  // Export functions from items.js
  const { 
    createItem,
    deleteItem,
    retrieveItemById,
    retrieveItemByPlaidAccessToken,
    retrieveItemByPlaidInstitutionId,
    retrieveItemByPlaidItemId,
    retrieveItemsByUser,
    updateItemStatus,
    updateItemTransactionsCursor,
  } = require('./items');
  
  // Export functions from transactions.js
  const { 
    createOrUpdateTransactions, 
    retrieveTransactionsByAccountId, 
    retrieveTransactionsByItemId, 
    retrieveTransactionsByUserId, 
    deleteTransactions 
  } = require('./transactions');
  
  // Export functions from plaidApiEvents.js
  const { 
    createPlaidApiEvent 
  } = require('./plaidApiEvents');
  
  module.exports = {
    // Accounts
    createAccounts,
  retrieveAccountByPlaidAccountId,
  retrieveAccountsByItemId,
  retrieveAccountsByUserId,
  
    // Items
    createItem,
    deleteItem,
    retrieveItemById,
    retrieveItemByPlaidAccessToken,
    retrieveItemByPlaidInstitutionId,
    retrieveItemByPlaidItemId,
    retrieveItemsByUser,
    updateItemStatus,
    updateItemTransactionsCursor,
  
    // Transactions
    createOrUpdateTransactions,
    retrieveTransactionsByAccountId,
    retrieveTransactionsByItemId,
    retrieveTransactionsByUserId,
    deleteTransactions,
  
    // Plaid API Events
    createPlaidApiEvent
  };
  