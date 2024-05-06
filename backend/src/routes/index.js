//backend/src/routes/index.js
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const budgetRoutes = require('./budget');
const categoryRoutes = require('./category');
const plaidRoutes = require('./plaid');

router.use('/auth', authRoutes);
router.use('/budget', budgetRoutes);
router.use('/categories', categoryRoutes);
router.use('/plaid', plaidRoutes);
module.exports = router;