// backend/src/routes/plaidRoutes.js
const express = require('express');
const router = express.Router();
const plaidClient = require('../config/plaidClient');
const PlaidItem = require('../models/PlaidItem');
const PlaidAccount = require('../models/PlaidAccount');

// Configure Plaid product types and countries
const PLAID_PRODUCTS = (process.env.PLAID_PRODUCTS || 'transactions').split(',');
const PLAID_COUNTRY_CODES = (process.env.PLAID_COUNTRY_CODES || 'US').split(',');

// Create a link token
router.post('/create_link_token', async (req, res) => {
  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: req.user.id },
      client_name: 'ChaChing',
      products: PLAID_PRODUCTS,
      country_codes: PLAID_COUNTRY_CODES,
      language: 'en',
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error creating link token:', error);
    res.status(500).json({ error: 'Unable to create a link token. Please try again later.' });
  }
});

// Retrieve all items and accounts for a specific user
router.get('/items/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    // Find all Plaid items linked to the user
    const items = await PlaidItem.find({ userId }).populate('accounts');
    res.json({ items });
  } catch (error) {
    console.error('Error fetching Plaid items:', error.message);
    res.status(500).json({ error: 'Failed to retrieve items' });
  }
});

// Exchange public token for an access token and retrieve account info
router.post('/set_access_token', async (request, response) => {
  const userId = request.user.id;
  const { public_token } = request.body;

  try {
    // Exchange the public token for an access token and item ID
    const tokenResponse = await plaidClient.itemPublicTokenExchange({ public_token });
    const accessToken = tokenResponse.data.access_token;
    const itemId = tokenResponse.data.item_id;

    // Retrieve item information including the institution ID and name
    const itemInfoResponse = await plaidClient.itemGet({ access_token: accessToken });
    const institutionId = itemInfoResponse.data.item.institution_id;

    let institutionName = 'Unknown Institution';
    if (institutionId) {
      // Retrieve institution information
      const institutionResponse = await plaidClient.institutionsGetById({
        institution_id: institutionId,
        country_codes: PLAID_COUNTRY_CODES,
      });
      institutionName = institutionResponse.data.institution.name;
    }

    // Create or update a PlaidItem with the institution information
    let plaidItem = await PlaidItem.findOneAndUpdate(
      { itemId, userId },
      { accessToken, itemId, userId, institutionName, institutionId },
      { new: true, upsert: true }
    );

    // Retrieve account information
    const accountsResponse = await plaidClient.accountsGet({ access_token: accessToken });
    const accounts = accountsResponse.data.accounts;

    // Save each account and link it to the PlaidItem
    const accountIds = accounts.map(async (account) => {
      const newAccount = new PlaidAccount({
        plaidItemId: plaidItem._id,
        accountId: account.account_id,
        accountName: account.name,
        accountType: account.type,
        accountSubType: account.subtype,
        availableBalance: account.balances.available,
        currentBalance: account.balances.current,
        limit: account.balances.limit || null,
      });
      await newAccount.save();
      return newAccount._id;
    });

    plaidItem.accounts = await Promise.all(accountIds);
    await plaidItem.save();

    response.json({
      access_token: accessToken,
      item_id: itemId,
      accounts: plaidItem.accounts,
      error: null,
    });
  } catch (error) {
    console.error('Error exchanging public token:', error);
    response.status(500).json({ error: 'Unable to set the access token. Please try again later.' });
  }
});

module.exports = router;
