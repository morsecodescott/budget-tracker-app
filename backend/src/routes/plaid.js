// backend/src/routes/plaidRoutes.js
const express = require('express');
const router = express.Router();
const plaidClient = require('../config/plaidClient');
const PlaidItem = require('../models/PlaidItem');
const PlaidAccount = require('../models/PlaidAccount');
const { deleteItem } = require('../db/queries/items');
const { retrieveTransactionsByAccountId} = require('../db/queries/transactions');


// Configure Plaid product types and countries
const PLAID_PRODUCTS = (process.env.PLAID_PRODUCTS || 'transactions').split(',');
const PLAID_COUNTRY_CODES = (process.env.PLAID_COUNTRY_CODES || 'US').split(',');

// Create a link token
router.post('/create_link_token', async (req, res) => {
  console.log("/create_link_token: ", req.body);
  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: req.user.id },
      client_name: 'ChaChing',
      products: PLAID_PRODUCTS,
      country_codes: PLAID_COUNTRY_CODES,
      language: 'en',
      access_token: req.access_token ,
      webhook: req.webhook,
    });
    console.log(response.data)
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
    const plaidItemId = tokenResponse.data.item_id;

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
      { plaidItemId, userId },
      { accessToken, plaidItemId, userId, institutionName, institutionId },
      { new: true, upsert: true }
    );

    // Retrieve account information
    const accountsResponse = await plaidClient.accountsGet({ access_token: accessToken });
    const accounts = accountsResponse.data.accounts;

    // Save each account and link it to the PlaidItem
    const accountIds = accounts.map(async (account) => {
      const newAccount = new PlaidAccount({
        plaidItemId: plaidItem._id,
        plaidAccountId: account.account_id,
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
      item_id: plaidItemId,
      accounts: plaidItem.accounts,
      error: null,
    });
  } catch (error) {
    console.error('Error exchanging public token:', error);
    response.status(500).json({ error: 'Unable to set the access token. Please try again later.' });
  }
});


router.delete('/items/:itemId', async (req, res) => {
  const { itemId } = req.params;
  try {
    await deleteItem(itemId); // Assuming deleteItem is your backend function to delete an item
    res.status(200).send({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error.message);
    res.status(500).send({ error: 'Failed to delete item' });
  }
});

router.get('/transactions/:accountId', async(req,res) =>{
  const {accountId} = req.params;
  try {
      const transactions = await retrieveTransactionsByAccountId(accountId);
      res.status(200).json(transactions);

  } catch (error) {
    console.error('Error fetching transactions:', error.message);
    res.status(500).send({error: 'Failed to fetch transactions'});
  }

});



// Exchange public token for an access token and retrieve account info
router.post('/create_plaid_item', async (request, response) => {
  console.log(request.body)
  const userId = request.user.id;
  const { access_token } = request.body;

  try {
    
    // Retrieve item information including the institution ID and name
    const itemInfoResponse = await plaidClient.itemGet({ access_token});
    const institutionId = itemInfoResponse.data.item.institution_id;
    const plaidItemId = itemInfoResponse.data.item.item_id

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
      { plaidItemId, userId },
      { accessToken: access_token, plaidItemId, userId, institutionName, institutionId },
      { new: true, upsert: true }
    );

    // Retrieve account information
    const accountsResponse = await plaidClient.accountsGet({ access_token});
    const accounts = accountsResponse.data.accounts;

    // Save each account and link it to the PlaidItem
    const accountIds = accounts.map(async (account) => {
      const newAccount = new PlaidAccount({
        plaidItemId: plaidItem._id,
        plaidAccountId: account.account_id,
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
      access_token: access_token,
      item_id: plaidItemId,
      accounts: plaidItem.accounts,
      error: null,
    });
  } catch (error) {
    console.error('Error creating item:', error);
    response.status(500).json({ error: 'Error creating item.' });
  }
});






module.exports = router;
