/**
 * @fileoverview This file defines the Mongoose schema for the User model.
 * @module backend/src/models/User
 */

const mongoose = require('mongoose');

/**
 * @typedef {Object} User
 * @property {string} firstName - The user's first name.
 * @property {string} lastName - The user's last name.
 * @property {string} email - The user's email address.
 * @property {string} role - The user's role (e.g., 'user', 'admin').
 * @property {string} password - The user's hashed password.
 * @property {Array<mongoose.Schema.Types.ObjectId>} plaidItems - An array of Plaid item IDs associated with the user.
 * @property {boolean} onboardingCompleted - A flag indicating if the user has completed the onboarding process.
 */

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true, // Removes whitespace from both ends of a string
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true, // Ensures email addresses are unique across users
        trim: true,
        lowercase: true, // Converts email to lowercase to avoid case-sensitive issues
        match: [/.+\@.+\..+/, 'Please fill a valid email address'], // Simple regex for email validation
    },
    role: {
        type: String,
        enum: ['user', 'admin'], // Enum to restrict the role to either 'user' or 'admin'
        default: 'user',
    },
    password: {
        type: String,
        required: true,
    },
    plaidItems: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PlaidItem'
    }],
    onboardingCompleted: {
        type: Boolean,
        default: false
    },
});

module.exports = mongoose.model('User', userSchema);
