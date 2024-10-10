const express = require('express');
const router = express.Router();
const PlaidApiEvent = require('../../../models/PlaidApiEvent');
const PlaidAccount = require('../../../models/PlaidAccount');

// Create or Update Plaid API Events
router.post('/createApiEvent', async (req, res) => {
  const { itemId, userId, plaidMethod, clientMethodArgs, response } = req.body;

  try {
    const { error_code: errorCode, error_type: errorType, request_id: requestId } = response;

    // Find the account based on itemId
    const account = await PlaidAccount.findOne({ plaidItemId: itemId });
    if (!account) {
      throw new Error(`Account with Item ID ${itemId} not found`);
    }

    // Create a new event log entry
    const newApiEvent = new PlaidApiEvent({
      itemId,
      userId,
      plaidMethod,
      clientMethodArgs,
      requestId,
      errorType,
      errorCode,
    });

    // Save the event to the database
    await newApiEvent.save();
    res.status(201).json({ message: 'Plaid API event log created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating Plaid API event log' });
  }
});

// Get API Events by Item ID
router.get('/getApiEventsByItem/:itemId', async (req, res) => {
  const { itemId } = req.params;

  try {
    const events = await PlaidApiEvent.find({ itemId }).sort({ createdAt: -1 });
    res.status(200).json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error retrieving Plaid API events' });
  }
});

// Get API Events by User ID
router.get('/getApiEventsByUser/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const events = await PlaidApiEvent.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error retrieving Plaid API events' });
  }
});

// Delete API Events by Item ID
router.delete('/deleteApiEventsByItem', async (req, res) => {
  const { itemId } = req.body;

  try {
    await PlaidApiEvent.deleteMany({ itemId });
    res.status(200).json({ message: 'Plaid API events deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error deleting Plaid API events' });
  }
});

module.exports = router;
