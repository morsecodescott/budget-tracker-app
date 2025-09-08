/**
 * @fileoverview This file contains the database connection setup.
 * @module backend/src/config/database
 */

const mongoose = require('mongoose');

/**
 * Sets up the MongoDB connection and handles connection events.
 * It connects to the MongoDB instance specified in the `MONGO_URI` environment variable.
 * It also handles graceful shutdown of the connection on process termination.
 */
exports.setupDatabase = () => {
    mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection;
    db.on('connected', () => console.log('Connected to MongoDB.'));
    db.on('error', (err) => console.error(`MongoDB connection error: ${err.message}`));
    db.on('disconnected', () => console.log('Disconnected from MongoDB.'));
    process.on('SIGINT', async () => {
    try {
        await db.close();
        console.log('MongoDB connection closed due to app termination');
        process.exit(0);
    } catch (error) {
        console.error('Failed to close MongoDB connection:', error);
        process.exit(1);
    }
    });
};