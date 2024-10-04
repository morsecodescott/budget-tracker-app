const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const PlaidItem = require('../../../models/PlaidItem'); // Assuming PlaidItem model is in the models folder
const User = require('../../../models/User');
// Create a PlaidItem
router.post('/createItem', async (req, res) => {
  const { institutionId, institutionName, accessToken, plaidItemId, userId, webhook } = req.body;
  try {
    // Convert userId to ObjectId if it's a valid string
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'user not found' });
    };

    const newItem = new PlaidItem({
      userId: user,
      accessToken,
      plaidItemId,
      institutionId,
      institutionName,
      webhook,
      is_active: true, // Default value
    });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    
    
    console.log(err);
    res.status(500).json({ error: 'Error creating item' });
  }
});

// Retrieve a PlaidItem by ID
router.get('/retrieveItemById/:itemId', async (req, res) => {
  try {
    const item = await PlaidItem.findById(req.params.itemId).populate('accounts');
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Error retrieving item by ID' });
  }
});

// Retrieve a PlaidItem by Plaid Access Token
router.get('/retrieveItemByPlaidAccessToken/:accessToken', async (req, res) => {
  try {
    const item = await PlaidItem.findOne({ accessToken: req.params.accessToken });
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Error retrieving item by Plaid Access Token' });
  }
});

// Retrieve a PlaidItem by Plaid Institution ID and User ID
router.get('/retrieveItemByPlaidInstitutionId/:institutionId/:userId', async (req, res) => {
  try {
    const item = await PlaidItem.findOne({ institutionId: req.params.institutionId, userId: req.params.userId });
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Error retrieving item by Plaid Institution ID' });
  }
});

// Retrieve a PlaidItem by Plaid Item ID
router.get('/retrieveItemByPlaidItemId/:plaidItemId', async (req, res) => {
  try {
    const item = await PlaidItem.findOne({ plaidItemId : req.params.plaidItemId});
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Error retrieving item by Plaid Item ID' });
  }
});

// Retrieve PlaidItems by User ID
router.get('/retrieveItemsByUser/:userId', async (req, res) => {
  try {
    const items = await PlaidItem.find({ userId: req.params.userId }).populate('accounts');
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Error retrieving items by User ID' });
  }
});

// Update PlaidItem Status
router.put('/updateItemStatus/:itemId', async (req, res) => {
  try {
    const { is_active } = req.body;
    const updatedItem = await PlaidItem.findByIdAndUpdate(req.params.itemId, { is_active }, { new: true });
    if (!updatedItem) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: 'Error updating item status' });
  }
});

// Update PlaidItem Transactions Cursor
router.put('/updateItemTransactionsCursor/:plaidItemId', async (req, res) => {
  try {
    const { transaction_cursor } = req.body;
    const updatedItem = await PlaidItem.findOneAndUpdate(
      {plaidItemId: req.params.plaidItemId} ,
      { transaction_cursor },
      { new: true }
    );
    if (!updatedItem) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(updatedItem);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Error updating item transactions cursor' });
  }
});

// Delete a PlaidItem
router.delete('/deleteItem/:itemId', async (req, res) => {
  try {
    const deletedItem = await PlaidItem.findByIdAndDelete(req.params.itemId);
    if (!deletedItem) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting item' });
  }
});

module.exports = router;
