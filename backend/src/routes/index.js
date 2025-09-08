/**
 * @fileoverview This file aggregates all the route modules and exports two routers:
 * a public router for unauthenticated access and a protected router that requires authentication.
 * @module backend/src/routes/index
 */

const express = require('express');
/**
 * Router for public routes that do not require authentication.
 * @type {import('express').Router}
 */
const publicRouter = express.Router();

/**
 * Router for protected routes that require authentication.
 * @type {import('express').Router}
 */
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

/**
 * Exports the public and protected routers.
 * @type {{publicRouter: import('express').Router, protectedRouter: import('express').Router}}
 */
module.exports = { publicRouter, protectedRouter };
