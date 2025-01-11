//backend/src/routes/index.js
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const budgetRoutes = require('./budget');
const categoryRoutes = require('./category');
const plaidRoutes = require('./plaid');
const servicesRoutes = require('./services');
const plaidCategoryRoutes = require('./plaidCategory');
const userRoutes = require('./users');
const healthCheckRoutes = require('./healthCheck');




router.use('/auth', authRoutes);
router.use('/budget', budgetRoutes);
router.use('/categories', categoryRoutes);
router.use('/plaid', plaidRoutes);
router.use('/services', servicesRoutes);
router.use('/plaid-categories', plaidCategoryRoutes);
router.use('/users', userRoutes);
router.use('/health-check', healthCheckRoutes);


module.exports = router;