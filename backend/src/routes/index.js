//backend/src/routes/index.js
const express = require('express');
const publicRouter = express.Router();
const protectedRouter = express.Router();

const authRoutes = require('./auth');
const budgetRoutes = require('./budget');
const categoryRoutes = require('./category');
const plaidRoutes = require('./plaid');
const servicesRoutes = require('./services');
const plaidCategoryRoutes = require('./plaidCategory');
const userRoutes = require('./users');
const healthCheckRoutes = require('./healthCheck');

// Public routes
publicRouter.use('/auth', authRoutes);
publicRouter.use('/health-check', healthCheckRoutes);

// Protected routes
protectedRouter.use('/budget', budgetRoutes);
protectedRouter.use('/categories', categoryRoutes);
protectedRouter.use('/plaid', plaidRoutes);
protectedRouter.use('/services', servicesRoutes);
protectedRouter.use('/plaid-categories', plaidCategoryRoutes);
protectedRouter.use('/users', userRoutes);

module.exports = { publicRouter, protectedRouter };
