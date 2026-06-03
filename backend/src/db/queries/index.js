// Export functions from accounts.js
const { 
  createAccounts,
  retrieveAccountByAccountId,
  retrieveAccountsByItemId,
  retrieveAccountsByUserId,
  deleteAccountsByItemId,
     
  } = require('./accounts');
  
  // Export functions from items.js
  const { 
    createItem,
    deleteItem,
    retrieveItemById,
    retrieveItemByPlaidAccessToken,
    retrieveItemByPlaidInstitutionId,
    retrieveItemByItemId,
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
    deleteTransactions, 
    deleteTransactionsByAccountId,
  } = require('./transactions');
  
  // Export functions from plaidApiEvents.js
  const { 
    createPlaidApiEvent 
  } = require('./plaidApiEvents');

  const{
    mapToInternalCategory
  } = require('./services');
  
  module.exports = {
    // Accounts
    createAccounts,
  retrieveAccountByAccountId,
  retrieveAccountsByItemId,
  retrieveAccountsByUserId,
  deleteAccountsByItemId,
  
    // Items
    createItem,
    deleteItem,
    retrieveItemById,
    retrieveItemByPlaidAccessToken,
    retrieveItemByPlaidInstitutionId,
    retrieveItemByItemId,
    retrieveItemsByUser,
    updateItemStatus,
    updateItemTransactionsCursor,
  
    // Transactions
    createOrUpdateTransactions,
    retrieveTransactionsByAccountId,
    retrieveTransactionsByItemId,
    retrieveTransactionsByUserId,
    deleteTransactions,
    deleteTransactionsByAccountId,
  
    // Plaid API Events
    createPlaidApiEvent,

    //services
    mapToInternalCategory
  };
  