// routes/auth.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing
const User = require('../models/User');

// Registration page - GET
router.get('/register', (req, res) => {
    res.render('register.ejs');
});

router.post('/register', async (req, res) => {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        req.flash('error_msg', 'Passwords do not match.');
        return res.redirect('/auth/register');
    }

    try {
        let user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
            req.flash('error_msg', 'Email already registered.');
            return res.redirect('/auth/register');
        }

        // Hash password, create user, etc...

        req.flash('success_msg', 'Registration successful! Please log in.');
        res.redirect('/auth/login');
    } catch (error) {
        req.flash('error_msg', 'An error occurred, please try again.');
        res.redirect('/auth/register');
    }
});






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
            return res.status(201).json({ success: true, message: 'Login successful!', user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role  } });
        });
    })(req, res, next);
});






// Logout route - GET
router.get('/logout', (req, res) => {
    req.logout(() => {
      
    });
});


module.exports = router;
