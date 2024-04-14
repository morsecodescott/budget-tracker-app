//backend/src/config/database.js

const mongoose = require('mongoose');

// MongoDB connection
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