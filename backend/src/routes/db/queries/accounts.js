const express = require('express');
const router = express.Router();
const PlaidAccount = require('../../../models/PlaidAccount');  
const PlaidItem = require('../../../models/PlaidItem');  

// Create multiple accounts for a PlaidItem
router.post('/createAccounts', async (req, res) => {
  const { plaidItemId, accounts } = req.body;

  try {
    // Find PlaidItem
    const plaidItem = await PlaidItem.findById(plaidItemId);
    if (!plaidItem) {
      return res.status(404).json({ error: 'PlaidItem not found' });
    }

    // Create accounts for the PlaidItem
    const createdAccounts = [];
    for (const account of accounts) {
      const newAccount = new PlaidAccount({
        plaidItemId: plaidItem._id,
        accountId: account.accountId,
        accountName: account.accountName,
        accountType: account.accountType,
        accountSubType: account.accountSubType,
        availableBalance: account.availableBalance,
        currentBalance: account.currentBalance,
        limit: account.limit,
      });
      await newAccount.save();
      createdAccounts.push(newAccount);
    }

    res.status(201).json(createdAccounts);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Error creating accounts' });
  }
});

// Retrieve account by PlaidAccountId
router.get('/getAccount/:plaidAccountId', async (req, res) => {
  const { plaidAccountId } = req.params;

  try {
    const account = await PlaidAccount.findOne({ accountId: plaidAccountId });
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    res.status(200).json(account);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Error retrieving account' });
  }
});

// Retrieve all accounts for a PlaidItem
router.get('/getAccountsByItem/:plaidItemId', async (req, res) => {
  const { plaidItemId } = req.params;

  try {
    const accounts = await PlaidAccount.find({ plaidItemId });
    if (!accounts || accounts.length === 0) {
      return res.status(404).json({ error: 'No accounts found for this PlaidItem' });
    }
    res.status(200).json(accounts);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Error retrieving accounts' });
  }
});

// Retrieve all accounts for a user
router.get('/getAccountsByUser/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const plaidItems = await PlaidItem.find({ userId });
    const plaidItemIds = plaidItems.map(item => item._id);

    const accounts = await PlaidAccount.find({ plaidItemId: { $in: plaidItemIds } });
    if (!accounts || accounts.length === 0) {
      return res.status(404).json({ error: 'No accounts found for this user' });
    }
    res.status(200).json(accounts);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Error retrieving accounts for user' });
  }
});

module.exports = router;
