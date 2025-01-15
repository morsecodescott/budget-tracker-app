// backend/src/routes/plaidRoutes.js
const express = require('express');
const router = express.Router();
const plaidClient = require('../config/plaidClient');
const PlaidItem = require('../models/PlaidItem');
const PlaidAccount = require('../models/PlaidAccount');
const { deleteItem } = require('../db/queries/items');
const { retrieveTransactionsByAccountId } = require('../db/queries/transactions');
const mongoose = require('mongoose');
const PlaidTransaction = require('../models/PlaidTransaction');
const Budget = require('../models/Budget');


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
      access_token: req.body.access_token,
      webhook: req.body.webhook,
    });
    console.log(response.data);

    const linkTokenData = await plaidClient.linkTokenGet({ link_token: response.data.link_token });

    res.json(response.data);
    console.log(linkTokenData.data);
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
  const { public_token, accessToken } = request.body;

  try {
    let accessTokenToUse = accessToken;


    if (!accessToken) {
      // Exchange the public token for an access token and item ID
      const tokenResponse = await plaidClient.itemPublicTokenExchange({ public_token });
      accessTokenToUse = tokenResponse.data.access_token;

    }

    // Retrieve item information including the institution ID and name
    const itemInfoResponse = await plaidClient.itemGet({ access_token: accessTokenToUse });
    const institutionId = itemInfoResponse.data.item.institution_id;
    const plaidItemId = itemInfoResponse.data.item.item_id;

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
  const userId = req.user.id;
  console.log("Deleting item: ", itemId, userId);
  try {
    await deleteItem(itemId, userId);

    res.status(200).send({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error.message);
    res.status(500).send({ error: 'Failed to delete item' });
  }
});

router.get('/transactions/:accountId', async (req, res) => {
  const { accountId } = req.params;
  try {
    const transactions = await retrieveTransactionsByAccountId(accountId);
    res.status(200).json(transactions);

  } catch (error) {
    console.error('Error fetching transactions:', error.message);
    res.status(500).send({ error: 'Failed to fetch transactions' });
  }

});



// Exchange public token for an access token and retrieve account info
router.post('/create_plaid_item', async (request, response) => {
  console.log(request.body)
  const userId = request.user.id;
  const { access_token } = request.body;

  try {

    // Retrieve item information including the institution ID and name
    const itemInfoResponse = await plaidClient.itemGet({ access_token });
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
    const accountsResponse = await plaidClient.accountsGet({ access_token });
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

// Retrieve transactions for a user with filtering and optional pagination
router.get('/transactions', async (req, res) => {
  const { startDate, endDate, page, rowsPerPage, category, budgetFilter, transactionType } = req.query;
  const userId = req.user._id;
  console.log("Transactions query: ", startDate, endDate);
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: 'Invalid userId provided' });
  }

  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();
  console.log("Transactions query after parsing: ", start, end);

  try {
    const plaidAccountIds = await getPlaidAccountIdsForUser(userId);

    const budgetCategories = await Budget.find({
      user: userId,
      period: { $lte: end, $gte: start },
    }).distinct('category');

    // Build aggregation pipeline
    const pipeline = [
      {
        $match: {
          plaidAccountId: { $in: plaidAccountIds },
          date: { $gte: start, $lte: end },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      {
        $lookup: {
          from: 'categories',
          localField: 'category.parentCategory',
          foreignField: '_id',
          as: 'category.parentCategoryDetails',
        },
      },
      { $unwind: { path: '$category.parentCategoryDetails', preserveNullAndEmptyArrays: true } },
    ];

    if (category) {
      console.log("Category:", category);

      if (Array.isArray(category)) {
        // Handle multiple categories
        pipeline.push({
          $match: {
            'category._id': {
              $in: category.map((id) => new mongoose.Types.ObjectId(id)),
            },
          },
        });
      } else {
        // Handle single category
        pipeline.push({
          $match: {
            'category._id': new mongoose.Types.ObjectId(category),
          },
        });
      }
    }

    if (transactionType && transactionType !== 'All') {
      pipeline.push({
        $match: {
          'category.parentCategoryDetails.name': transactionType === 'Income' ? 'Income' : { $ne: 'Income' },
        },
      });
    }

    pipeline.push(
      {
        $set: {
          budgeted: {
            $in: ['$category._id', budgetCategories],
          },
        },
      },
      { $sort: { date: -1 } }
    );

    const allTransactions = await PlaidTransaction.aggregate(pipeline);

    // Budget filter
    const filteredTransactions = allTransactions.filter((t) =>
      budgetFilter === 'budgeted'
        ? t.budgeted
        : budgetFilter === 'unbudgeted'
          ? !t.budgeted
          : true
    );

    const totalTransactions = filteredTransactions.length;
    const paginatedTransactions =
      page !== undefined && rowsPerPage !== undefined
        ? filteredTransactions.slice(page * rowsPerPage, (page + 1) * rowsPerPage)
        : filteredTransactions;

    res.status(200).json({
      transactions: paginatedTransactions,
      total: totalTransactions,
      page: page ? Number(page) : undefined,
      pages: page !== undefined && rowsPerPage !== undefined
        ? Math.ceil(totalTransactions / rowsPerPage)
        : undefined,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error.message);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});


// Utility function to fetch account IDs for the user
async function getPlaidAccountIdsForUser(userId) {
  const items = await mongoose.model('PlaidItem').find({ userId }).populate('accounts');
  return items.flatMap(item => item.accounts.map(account => account._id));
}


// GET /plaid/accounts - Get all linked accounts for a user
router.get('/accounts', async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all PlaidItems for the user and populate their accounts
    const items = await PlaidItem.find({ userId }).populate('accounts');

    // Flatten and transform the accounts data
    const accounts = items.flatMap(item =>
      item.accounts.map(account => ({
        _id: account._id,
        itemId: item._id,
        institutionId: item.institutionId,
        institutionName: item.institutionName,
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
    res.status(500).json({ error: 'Failed to retrieve accounts' });
  }
});

// GET /plaid/accounts/summary
router.get('/accounts/summary', async (req, res) => {
  try {
    const userId = req.user._id;

    const summary = await PlaidAccount.aggregate([
      {
        $lookup: {
          from: "plaiditems",
          localField: "plaidItemId",
          foreignField: "_id",
          as: "item"
        }
      },
      { $unwind: "$item" }, // Deconstructs the item array
      { $match: { "item.userId": userId } },
      {
        $group: {
          _id: "$accountType",
          totalBalance: { $sum: "$currentBalance" },
          accountCount: { $sum: 1 }
        }
      }
    ]);

    res.json({ summary });
  } catch (error) {
    console.error("Error fetching account summary:", error.message);
    res.status(500).json({ error: "Failed to retrieve account summary" });
  }
});




module.exports = router;
