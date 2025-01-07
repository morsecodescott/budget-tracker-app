
// Essential module imports
const express = require('express');
const cors = require('cors');
const passport = require('passport');
require('dotenv').config();
const { setupDatabase } = require('./src/config/database');
const { setupSessionStore } = require('./src/config/sessionStore');
const passportConfig = require('./src/config/passport');
const { globalTemplateVariables, ensureAuthenticated } = require('./src/middleware');
const routes = require('./src/routes');


// Express app initialization
const app = express();
const PORT = process.env.PORT || 4000;

// Database connection
setupDatabase();

// Enable CORS for all requests from any origin
app.use(cors({
    origin: ['http://localhost:3000', 'https://creative-kindly-jennet.ngrok-free.app'], // or your frontend's current domain
    credentials: true, // this allows session cookies to be sent back and forth
}));
app.set("trust proxy", 1);

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

// Create HTTP server
const server = app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

// Set up WebSocket server
const { Server } = require('socket.io');
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:3000', 'https://creative-kindly-jennet.ngrok-free.app'],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// WebSocket connection handler
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Handle authentication
    socket.on('authenticate', (token) => {
        // Verify token and associate socket with user
        // TODO: Implement proper authentication
        console.log('Client authenticated:', socket.id);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Make io available to other modules
app.set('io', io);

module.exports = { app, server, io };
