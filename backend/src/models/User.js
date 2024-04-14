// models/User.js

const mongoose = require('mongoose');

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
});

module.exports = mongoose.model('User', userSchema);
