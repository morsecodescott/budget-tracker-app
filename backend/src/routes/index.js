//backend/src/routes/index.js
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const budgetRoutes = require('./budget');
const categoryRoutes = require('./category');
const plaidRoutes = require('./plaid');
const itemRoutes = require('./db/queries/items');
const accountRoutes = require('./db/queries/accounts');
const transactionRoutes = require('./db/queries/transactions');

router.use('/auth', authRoutes);
router.use('/budget', budgetRoutes);
router.use('/categories', categoryRoutes);
router.use('/plaid', plaidRoutes);
router.use('/items', itemRoutes);
router.use('/accounts', accountRoutes);
router.use('/transactions', transactionRoutes);
module.exports = router;