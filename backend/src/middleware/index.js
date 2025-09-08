/**
 * @fileoverview This file contains custom middleware for the application.
 * @module backend/src/middleware/index
 */

const { ensureAuthenticated, isAdmin } = require('../config/auth');

/**
 * Sets global variables for use in templates.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The next middleware function.
 */
exports.globalTemplateVariables = (req, res, next) => {
  // Global variables for templates
  res.locals.appName = 'ChaChing';
  res.locals.appSlogan = 'Make Every Dollar Count';
  res.locals.currentUser = req.user; // Set currentUser from req.user
  res.locals.error_msg = req.flash('error_msg');
  res.locals.success_msg = req.flash('success_msg');
  next();
};

/**
 * A middleware function that ensures that the user is authenticated before accessing a route.
 * It skips authentication for a predefined list of public routes.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The next middleware function.
 */
exports.ensureAuthenticated = (req, res, next) => {
  // Middleware to protect routes
  if (['/', '/auth/login', '/auth/register', '/test', '/health-check', '/services/webhook'].includes(req.originalUrl)) {
    return next(); // Skip authentication for specific routes
  }
  ensureAuthenticated(req, res, next); // Apply to all other routes
};

