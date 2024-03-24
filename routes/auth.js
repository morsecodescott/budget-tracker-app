// routes/auth.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');

// Registration page - GET
router.get('/register', (req, res) => {
    res.render('register.ejs');
});

// Registration form submission - POST
router.post('/register', (req, res) => {
    const { username, password } = req.body;
    User.findOne({ username: username }).then((user) => {
        if (user) {
            req.flash('error_msg', 'Username already exists');
            res.redirect('/auth/register');
        } else {
            const newUser = new User({ username, password });
            newUser.save().then(() => {
                req.flash('success_msg', 'You are now registered and can log in');
                res.redirect('/auth/login');
            });
        }
    });
});

// Login page - GET
router.get('/login', (req, res) => {
    res.render('login.ejs');
});

// Login form submission - POST
router.post(
    '/login',
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/auth/login',
        failureFlash: true,
    })
);

// Logout route - GET
router.get('/logout', (req, res) => {
    req.logout(); // This function is provided by Passport.js to clear the login session
    res.redirect('/'); // Redirect to the landing page
});

module.exports = router;
