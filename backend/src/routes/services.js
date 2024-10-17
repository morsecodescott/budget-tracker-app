/**
 * @file Defines all routes for the Services route.
 */

const express = require('express');
//const fetch = require('node-fetch');

const router = express.Router();

const { asyncWrapper } = require('../middleware');
const {
  handleTransactionsWebhook,
  handleItemWebhook,
  unhandledWebhook,
} = require('../webhookHandlers');



/**
 * Handles incoming webhooks from Plaid.
 * https://plaid.com/docs/#webhooks
 */
router.post(
  '/webhook',
  async (req, res) => {
    const { webhook_type: webhookType } = req.body;
    console.log(webhookType);
    console.log(req.body); 
    //const { io } = req;
    const type = webhookType.toLowerCase();
    // There are five types of webhooks: AUTH, TRANSACTIONS, ITEM, INCOME, and ASSETS.
    // @TODO implement handling for remaining webhook types.
    const webhookHandlerMap = {
      transactions: handleTransactionsWebhook,
      item: handleItemWebhook,
    };
    const webhookHandler = webhookHandlerMap[type] || unhandledWebhook;
    webhookHandler(req.body /*, io*/);
    res.json({ status: 'ok' });
  }
);

module.exports = router;