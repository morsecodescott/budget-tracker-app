// config/auth.js

// Define a middleware function to check authentication
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        // For API routes, return a 401 Unauthorized status and a JSON message
        return res.status(401).json({ success: false, message: 'Unauthorized: Access is denied due to invalid credentials.' });
    }
  }

// Middleware to check if user is admin
function isAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({ message: 'Unauthorized access.' });
}

module.exports = { ensureAuthenticated, isAdmin };