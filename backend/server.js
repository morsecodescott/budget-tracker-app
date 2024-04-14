
// Essential module imports
const express = require('express');
const passport = require('passport'); 
require('dotenv').config();
const { setupDatabase } = require('./src/config/database');
const { setupSessionStore } = require('./src/config/sessionStore');
const passportConfig = require('./src/config/passport');
const { globalTemplateVariables, ensureAuthenticated } = require('./src/middleware');
const routes = require('./src/routes');


// Express app initialization
const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
setupDatabase();

// App settings and middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session and Passport configuration
setupSessionStore(app);

// Passport and flash messages
passportConfig(passport);
app.use(passport.initialize());
app.use(passport.session());

// Authentication middleware for protected routes
app.use(ensureAuthenticated);

// Routing
app.use(routes);

// Start server
const server = app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
module.exports = { app, server }; // Export for testing or modular use
