/**
 * Plaid API Routes
 * 
 * This file contains all routes related to Plaid integration including:
 * - Link token creation
 * - Item management
 * - Account management
 * - Transaction retrieval
 */

const express = require('express');
const router = express.Router();
const plaidClient = require('../config/plaidClient');
const PlaidDbService = require('../services/plaidDbService');
const PlaidApiService = require('../services/plaidApiService');
const PlaidItem = require('../models/PlaidItem');
const PlaidAccount = require('../models/PlaidAccount');
const { deleteItem } = require('../db/queries/items');
const { retrieveTransactionsByAccountId } = require('../db/queries/transactions');
const mongoose = require('mongoose');
const PlaidTransaction = require('../models/PlaidTransaction');
const Budget = require('../models/Budget');

// Configure Plaid product types and countries from environment variables
const PLAID_PRODUCTS = (process.env.PLAID_PRODUCTS || 'transactions').split(',');
const PLAID_COUNTRY_CODES = (process.env.PLAID_COUNTRY_CODES || 'US').split(',');

/**
 * POST /create_link_token
 * Creates a Plaid link token for initializing the Plaid Link flow
 * 
 * Request Body:
 * - access_token: Optional existing access token for update mode
 * - webhook: Optional webhook URL for transaction updates
 * 
 * Response:
 * - link_token: Token used to initialize Plaid Link
 * - expiration: Token expiration timestamp
 */
router.post('/create_link_token', async (req, res) => {
  try {
    const { access_token, webhook } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

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
 * GET /items/:userId
 * Retrieves all Plaid items and associated accounts for a specific user
 * 
 * Parameters:
 * - userId: ID of the user to retrieve items for
 * 
 * Response:
 * - items: Array of Plaid items with populated accounts
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
 * POST /set_access_token
 * Exchanges a public token for an access token and retrieves account information
 * 
 * Request Body:
 * - public_token: Temporary token from Plaid Link
 * - accessToken: Optional existing access token for update mode
 * 
 * Response:
 * - access_token: Permanent access token for the item
 * - item_id: Plaid item ID
 * - accounts: Array of associated accounts
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
 * DELETE /items/:itemId
 * Deletes a Plaid item and its associated accounts
 * 
 * Parameters:
 * - itemId: ID of the Plaid item to delete
 * 
 * Response:
 * - message: Success message
 * - error: Error message if deletion fails
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


// GET /plaid/accounts - Get all linked accounts for a user
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

// GET /plaid/accounts/summary
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
