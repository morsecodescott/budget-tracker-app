//backend/src/middleware/index.js
const { ensureAuthenticated, isAdmin } = require('../config/auth');

exports.globalTemplateVariables = (req, res, next) => {
    // Global variables for templates
    res.locals.appName = 'ChaChing';
    res.locals.appSlogan = 'Make Every Dollar Count';
    res.locals.currentUser = req.user; // Set currentUser from req.user
    res.locals.error_msg = req.flash('error_msg');
    res.locals.success_msg = req.flash('success_msg');
    next();
  };
  
exports.ensureAuthenticated = (req, res, next) => {
// Middleware to protect routes
if (['/', '/auth/login', '/auth/register', '/test', '/services/webhook'].includes(req.originalUrl)) {
    return next(); // Skip authentication for specific routes
    }
    ensureAuthenticated(req, res, next); // Apply to all other routes
};

