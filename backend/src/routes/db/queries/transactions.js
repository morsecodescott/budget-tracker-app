const express = require('express');
const router = express.Router();
const PlaidTransaction = require('../../../models/PlaidTransaction');
const PlaidAccount = require('../../../models/PlaidAccount');

// Create or Update Transactions
router.post('/createTransactions', async (req, res) => {
  const { transactions } = req.body;

  try {
    const pendingTransactions = transactions.map(async (transaction) => {
      const {
        account_id: plaidAccountId,
        transaction_id: plaidTransactionId,
        category: categories,
        name,
        amount,
        date,
        pending,
        iso_currency_code: isoCurrencyCode,
        unofficial_currency_code: unofficialCurrencyCode,
        account_owner: accountOwner,
      } = transaction;

      // Get the related accountId by plaidAccountId
      const account = await PlaidAccount.findOne({ accountId: plaidAccountId });
      if (!account) {
        throw new Error(`Account with ID ${plaidAccountId} not found`);
      }

      // Find existing transaction by transactionId or create a new one
      let existingTransaction = await PlaidTransaction.findOne({ plaidTransactionId });
      if (existingTransaction) {
        // Update existing transaction
        existingTransaction.amount = amount;
        existingTransaction.date = date;
        existingTransaction.name = name;
        existingTransaction.category = categories;
        existingTransaction.pending = pending;
        existingTransaction.isoCurrencyCode = isoCurrencyCode;
        existingTransaction.unofficialCurrencyCode = unofficialCurrencyCode;
        existingTransaction.accountOwner = accountOwner;
        await existingTransaction.save();
      } else {
        // Create a new transaction
        const newTransaction = new PlaidTransaction({
          accountId: account._id,
          plaidTransactionId,
          amount,
          date,
          name,
          category: categories,
          pending,
          isoCurrencyCode,
          unofficialCurrencyCode,
          accountOwner,
        });
        await newTransaction.save();
      }
    });

    await Promise.all(pendingTransactions);
    res.status(201).json({ message: 'Transactions created or updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating or updating transactions' });
  }
});

// Get Transactions by Account ID
router.get('/getTransactionsByAccount/:accountId', async (req, res) => {
  const { accountId } = req.params;

  try {
    const account = await PlaidAccount.findById(accountId);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const transactions = await PlaidTransaction.find({ accountId: account._id }).sort({ date: -1 });
    res.status(200).json(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error retrieving transactions' });
  }
});

// Get Transactions by Item ID
router.get('/getTransactionsByItem/:plaidItemId', async (req, res) => {
  const { plaidItemId } = req.params;

  try {
    const accounts = await PlaidAccount.find({ plaidItemId });
    console.log("Plaid Item id:", accounts);
    const accountIds = accounts.map((account) => account._id);
 
    const transactions = await PlaidTransaction.find({ accountId: { $in: accountIds } }).sort({ date: -1 });
    res.status(200).json(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error retrieving transactions' });
  }
});

// Get Transactions by User ID
router.get('/getTransactionsByUser/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const accounts = await PlaidAccount.find({ userId });
    const accountIds = accounts.map((account) => account._id);

    const transactions = await PlaidTransaction.find({ accountId: { $in: accountIds } }).sort({ date: -1 });
    res.status(200).json(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error retrieving transactions' });
  }
});

// Delete Transactions
router.delete('/deleteTransactions', async (req, res) => {
  const { plaidTransactionIds } = req.body;

  try {
    const pendingDeletes = plaidTransactionIds.map(async (plaidTransactionId) => {
      await PlaidTransaction.deleteOne({ plaidTransactionId });
    });

    await Promise.all(pendingDeletes);
    res.status(200).json({ message: 'Transactions deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error deleting transactions' });
  }
});

module.exports = router;
