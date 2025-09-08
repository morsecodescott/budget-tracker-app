
/**
 * @fileoverview This is the main entry point for the backend server.
 * It sets up the Express application, configures middleware, initializes the database,
 * sets up session management, configures Passport for authentication, defines routes,
 * and starts the server. It also sets up a WebSocket server using Socket.IO.
 * @module backend/server
 */

// Essential module imports
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const path = require('path');
require('dotenv').config({
    path: process.env.NODE_ENV === 'production'
        ? './.env.production'
        : './.env.development'
});

const { setupDatabase } = require('./src/config/database');
const { setupSessionStore } = require('./src/config/sessionStore');
const passportConfig = require('./src/config/passport');
const { ensureAuthenticated } = require('./src/middleware');
const { publicRouter, protectedRouter } = require('./src/routes');


/**
 * Express application instance.
 * @type {import('express').Application}
 */
const app = express();
const PORT = process.env.PORT || 4000;

// Database connection
setupDatabase();


// Enable CORS only in development
if (process.env.NODE_ENV === 'development') {
    app.use(cors({
        origin: ['http://localhost:3000', 'https://creative-kindly-jennet.ngrok-free.app'], // or your frontend's current domain
        credentials: true, // this allows session cookies to be sent back and forth
    }));
    console.log('CORS enabled for development');
}

app.set("trust proxy", 1);

// Serve static files from the React app (in production)
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'build')));
    console.log('Serving static files from the build directory');
}



// App settings and middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session and Passport configuration
setupSessionStore(app);

// Passport and flash messages
passportConfig(passport);
app.use(passport.initialize());
app.use(passport.session());

/**
 * @section
 * App Routes
 * - Public routes are accessible without authentication.
 * - Protected routes require authentication.
 */
app.use(publicRouter);
app.use(ensureAuthenticated);
app.use(protectedRouter);


// Serve static files from the React app (in production)
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'build')));

    // Serve the React app for all other routes (in production)
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'build', 'index.html'));
    });
}

/**
 * HTTP server instance.
 * @type {import('http').Server}
 */
const server = app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

/**
 * @section
 * WebSocket (Socket.IO) server setup.
 * - The server is conditionally configured with CORS for development.
 * - It uses a custom authentication middleware.
 * - Authenticated users are added to a room specific to their user ID.
 */
const { Server } = require('socket.io');
/**
 * Socket.IO server instance.
 * @type {import('socket.io').Server}
 */
const io = new Server(server, {
    cors: process.env.NODE_ENV === 'development' ? {
        origin: ['http://localhost:3000', 'https://creative-kindly-jennet.ngrok-free.app'],
        methods: ['GET', 'POST'],
        credentials: true
    } : undefined // Disable CORS in production
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

// Socket.IO middleware for authentication
const socketAuthMiddleware = require('./src/middleware/socketAuth');
io.use(socketAuthMiddleware);


// Update WebSocket connection handler to use authenticated user
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}, User: ${socket.user.email}`);

    // Join a room for the specific user
    socket.join(`user-${socket.user.id}`);

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}, User: ${socket.user.email}`);
    });
});


/**
 * Exports the Express app, HTTP server, and Socket.IO server instances.
 * @type {{app: import('express').Application, server: import('http').Server, io: import('socket.io').Server}}
 */
module.exports = { app, server, io };
