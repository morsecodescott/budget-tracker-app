/**
 * @fileoverview This file contains the routes for Plaid integration.
 * It includes routes for creating link tokens, exchanging public tokens for access tokens,
 * and fetching items, accounts, and transactions from Plaid.
 * @module backend/src/routes/plaid
 */

const express = require('express');
const router = express.Router();
const { client: plaidClient } = require('../config/plaidClient');
const PlaidDbService = require('../services/plaidDbService');
const PlaidApiService = require('../services/plaidApiService');
const PlaidItem = require('../models/PlaidItem');
const PlaidAccount = require('../models/PlaidAccount');
const { deleteItem } = require('../db/queries/items');
const { retrieveTransactionsByAccountId } = require('../db/queries/transactions');
const mongoose = require('mongoose');
const PlaidTransaction = require('../models/PlaidTransaction');
const Budget = require('../models/Budget');
const updateTransactions = require('../update_transactions');


// Configure Plaid product types and countries from environment variables 
const PLAID_PRODUCTS = (process.env.PLAID_PRODUCTS || 'transactions').split(',');
const PLAID_COUNTRY_CODES = (process.env.PLAID_COUNTRY_CODES || 'CA').split(',');

/**
 * @route   POST /plaid/create_link_token
 * @desc    Creates a Plaid link token for initializing the Plaid Link flow.
 *          If an `itemId` is provided, it creates a link token for update mode.
 * @access  Private
 * @body    {string} [itemId] - The ID of the item to update.
 * @body    {string} userId - The ID of the user.
 */
router.post('/create_link_token', async (req, res) => {
  try {
    const { itemId, userId } = req.body;
    const webhook = process.env.PLAID_WEBHOOK_URL;
    let access_token = null;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (itemId) {
      const item = await PlaidDbService.getItem(itemId);
      if (item && item.userId.toString() === userId) {
        access_token = item.accessToken;
      } else {
        return res.status(404).json({ error: 'Item not found or access denied' });
      }
    }

    console.log('Sending Link Token Request:', userId, access_token, webhook);


    // Create link token using service
    const linkToken = await PlaidApiService.createLinkToken(
      userId,
      access_token,
      webhook
    );

    res.json(linkToken);
  } catch (error) {
    console.error('Error creating link token:', error);
    res.status(500).json({
      error: error.message || 'Unable to create a link token. Please try again later.'
    });
  }
});





/**
 * @route   GET /plaid/items/:userId
 * @desc    Retrieves all Plaid items and associated accounts for a specific user.
 * @access  Private
 * @param   {string} userId - The ID of the user to retrieve items for.
 */
router.get('/items/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // Validate required fields
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get items using service
    const items = await PlaidDbService.getItemsForUser(userId);

    res.json({ items });
  } catch (error) {
    console.error('Error fetching Plaid items:', error);
    res.status(500).json({
      error: error.message || 'Failed to retrieve items'
    });
  }
});

/**
 * @route   POST /plaid/set_access_token
 * @desc    Exchanges a public token for an access token and retrieves account information.
 * @access  Private
 * @body    {string} public_token - The public token from Plaid Link.
 * @body    {string} [accessToken] - An existing access token for update mode.
 */
router.post('/set_access_token', async (req, res) => {
  const userId = req.user.id;
  const { public_token, accessToken } = req.body;

  try {
    // Validate required fields
    if (!userId || !public_token) {
      return res.status(400).json({ error: 'User ID and public token are required' });
    }

    let accessTokenToUse = accessToken;

    // Exchange public token if no access token provided
    if (!accessToken) {
      const { accessToken: newAccessToken, itemId } = await PlaidApiService.exchangePublicToken(public_token);
      accessTokenToUse = newAccessToken;
    }

    // Get item information
    const itemInfo = await PlaidApiService.getItemInfo(accessTokenToUse);
    const { institution_id: institutionId, item_id: plaidItemId } = itemInfo;

    // Get institution info
    let institutionName = 'Unknown Institution';
    let institutionLogoUrl = null;
    if (institutionId) {
      const institution = await PlaidApiService.getInstitutionInfo(institutionId);
      institutionName = institution.name;
      institutionLogoUrl = institution.logo;
      console.log('Received institution logo from Plaid API:', {
        institutionId,
        logoUrl: institutionLogoUrl
      });
    }

    console.log('Passing institution logo to upsertPlaidItem:', {
      institutionId,
      logoUrl: institutionLogoUrl
    });

    // Create/update Plaid item
    const plaidItem = await PlaidDbService.upsertPlaidItem(
      plaidItemId,
      userId,
      accessTokenToUse,
      institutionName,
      institutionId,
      institutionLogoUrl
    );

    console.log('Saved Plaid item with logo:', {
      itemId: plaidItem._id,
      logoUrl: plaidItem.institutionLogoUrl
    });

    // Get and create accounts
    const accounts = await PlaidApiService.getAccounts(accessTokenToUse);
    const accountIds = await PlaidDbService.createAccountsForItem(plaidItem, accounts);
    plaidItem.accounts = accountIds;
    await plaidItem.save();

    // Invalidate cache
    await PlaidDbService.invalidateAccountSummaryCache(userId);

    /*     // Sync transactions for new accounts
        try {
          const { addedCount, modifiedCount, removedCount } = await updateTransactions(plaidItemId);
          console.log('Synced transactions after account linking:', addedCount, modifiedCount, removedCount);
        } catch (error) {
          console.error('Error syncing transactions after account linking:', error);
          // Continue with response even if sync fails
        } */

    res.json({
      access_token: accessTokenToUse,
      item_id: plaidItemId,
      accounts: plaidItem.accounts,
      error: null,
    });
  } catch (error) {
    console.error('Error setting access token:', error);
    res.status(500).json({
      error: error.message || 'Unable to set the access token. Please try again later.'
    });
  }
});


/**
 * @route   DELETE /plaid/items/:itemId
 * @desc    Deletes a Plaid item and its associated accounts.
 * @access  Private
 * @param   {string} itemId - The ID of the Plaid item to delete.
 */
router.delete('/items/:itemId', async (req, res) => {
  const { itemId } = req.params;
  const userId = req.user.id;

  try {
    // Validate required fields
    if (!itemId || !userId) {
      return res.status(400).json({ error: 'Item ID and user ID are required' });
    }

    // Delete item using service
    await PlaidDbService.deleteItem(itemId, userId);

    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({
      error: error.message || 'Failed to delete item'
    });
  }
});

/**
 * @route   GET /plaid/transactions/:accountId
 * @desc    Retrieves all transactions for a specific account.
 * @access  Private
 * @param   {string} accountId - The ID of the account to retrieve transactions for.
 */
router.get('/transactions/:accountId', async (req, res) => {
  const { accountId } = req.params;

  try {
    // Validate required fields
    if (!accountId) {
      return res.status(400).json({ error: 'Account ID is required' });
    }

    // Get transactions using service
    const transactions = await PlaidDbService.getTransactionsForAccount(accountId);

    res.status(200).json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch transactions'
    });
  }
});



/**
 * @route   POST /plaid/create_plaid_item
 * @desc    Creates a Plaid item and its associated accounts using an access token.
 *          This is useful for testing or for migrating existing access tokens.
 * @access  Private
 * @body    {string} access_token - The Plaid access token.
 */
router.post('/create_plaid_item', async (req, res) => {
  const userId = req.user.id;
  const { access_token } = req.body;

  try {
    // Validate required fields
    if (!userId || !access_token) {
      return res.status(400).json({ error: 'User ID and access token are required' });
    }

    // Get item information
    const itemInfo = await PlaidApiService.getItemInfo(access_token);
    const { institution_id: institutionId, item_id: plaidItemId } = itemInfo;

    // Get institution name
    let institutionName = 'Unknown Institution';
    if (institutionId) {
      const institution = await PlaidApiService.getInstitutionInfo(institutionId);
      institutionName = institution.name;
    }

    // Create/update Plaid item
    const plaidItem = await PlaidDbService.upsertPlaidItem(
      plaidItemId,
      userId,
      access_token,
      institutionName,
      institutionId
    );

    // Get and create accounts
    const accounts = await PlaidApiService.getAccounts(access_token);
    const accountIds = await PlaidDbService.createAccountsForItem(plaidItem, accounts);
    plaidItem.accounts = accountIds;
    await plaidItem.save();

    res.json({
      access_token: access_token,
      item_id: plaidItemId,
      accounts: plaidItem.accounts,
      error: null,
    });
  } catch (error) {
    console.error('Error creating Plaid item:', error);
    res.status(500).json({
      error: error.message || 'Error creating Plaid item'
    });
  }
});

/**
 * @route   GET /plaid/transactions
 * @desc    Retrieves filtered transactions for the user.
 * @access  Private
 * @query   {string} [startDate] - The start date for the transaction query.
 * @query   {string} [endDate] - The end date for the transaction query.
 * @query   {number} [page] - The page number for pagination.
 * @query   {number} [rowsPerPage] - The number of rows per page for pagination.
 * @query   {string} [category] - The category to filter transactions by.
 * @query   {string} [budgetFilter] - The budget filter to apply.
 * @query   {string} [transactionType] - The transaction type to filter by (e.g., 'income', 'expense').
 */
router.get('/transactions', async (req, res) => {
  const {
    startDate,
    endDate,
    page,
    rowsPerPage,
    category,
    budgetFilter,
    transactionType
  } = req.query;
  const userId = req.user._id;

  try {
    // Validate required fields
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Get transactions using service
    const plaidAccountIds = await PlaidDbService.getAccountIdsForUser(userId);

    const result = await PlaidDbService.getFilteredTransactions({
      userId,
      startDate,
      endDate,
      page,
      rowsPerPage,
      category,
      budgetFilter,
      transactionType,
      plaidAccountIds
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch transactions'
    });
  }
});


/**
 * @route   GET /plaid/accounts
 * @desc    Get all linked accounts for a user.
 * @access  Private
 */
router.get('/accounts', async (req, res) => {
  try {
    const userId = req.user._id;

    // Validate required fields
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Get items with populated accounts using service
    const items = await PlaidDbService.getItemsForUser(userId);

    // Transform data to match expected format
    const accounts = items.flatMap(item =>
      item.accounts.map(account => ({
        _id: account._id,
        itemId: item._id,
        institutionId: item.institutionId,
        institutionName: item.institutionName,
        institutionLogoUrl: item.institutionLogoUrl,
        accountName: account.accountName,
        accountType: account.accountType,
        accountSubType: account.accountSubType,
        availableBalance: account.availableBalance,
        currentBalance: account.currentBalance,
        mask: account.mask
      }))
    );

    res.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({
      error: error.message || 'Failed to retrieve accounts'
    });
  }
});

/**
 * @route   GET /plaid/accounts/summary
 * @desc    Get a summary of all linked accounts for a user.
 * @access  Private
 */
router.get('/accounts/summary', async (req, res) => {
  try {
    const userId = req.user._id;

    // Validate required fields
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Get account summary using service
    const summary = await PlaidDbService.getAccountSummary(userId);

    res.json({ summary });
  } catch (error) {
    console.error('Error fetching account summary:', error);
    res.status(500).json({
      error: error.message || 'Failed to retrieve account summary'
    });
  }
});




module.exports = router;
