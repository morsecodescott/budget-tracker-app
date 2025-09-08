/**
 * @fileoverview This file contains the authentication routes for the application.
 * It includes routes for user signup, login, and logout.
 * @module backend/src/routes/auth
 */

const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing
const User = require('../models/User');

/**
 * @route   POST /auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post('/signup', async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    try {
        let user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
            return res.status(400).json({ success: false, message: 'Email already registered.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        user = new User({
            firstName,
            lastName,
            email: email.toLowerCase(),
            password: hashedPassword,
        });

        await user.save();

        req.logIn(user, (err) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Failed to log in after registration.' });
            }
            const token = req.sessionID;
            return res.status(201).json({
                success: true,
                message: 'Registration successful!',
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role
                },
                token: token
            });
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'An error occurred, please try again.' });
    }
});






/**
 * @route   POST /auth/login
 * @desc    Authenticate user and get token
 * @access  Public
 */
router.post('/login', (req, res, next) => {

    passport.authenticate('local', (err, user, info) => {
        if (err) {
            console.error("Authentication error:", err); // Log any errors that occur during authentication
            return res.status(500).json({ success: false, message: 'Authentication error.', error: err.message });
        }

        if (!user) {
            console.log("Login failed, no user found:", info); // Log the info message if no user is found
            return res.status(401).json({ success: false, message: info.message });
        }

        req.logIn(user, (err) => {
            if (err) {
                console.error("Error in req.logIn:", err); // Log errors if login session setup fails
                return res.status(500).json({ success: false, message: 'Failed to log in.', error: err.message });
            }
            console.log("Login successful for user:", user); // Log the successful login
            // Get the session token from cookies
            const token = req.sessionID;

            return res.status(201).json({
                success: true,
                message: 'Login successful!',
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role
                },
                token: token
            });
        });
    })(req, res, next);
});






/**
 * @route   GET /auth/logout
 * @desc    Logs the user out
 * @access  Private
 */
// Logout route - GET
router.get('/logout', (req, res) => {
    req.logout(() => {

    });
});


module.exports = router;
