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



// Login page - GET
router.get('/login', (req, res) => {
    
    res.render('login.ejs');
});



router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return res.json({ success: false, message: err.message });
        if (!user) return res.json({ success: false, message: info.message });

        req.logIn(user, err => {
            if (err) return res.json({ success: false, message: err.message });
            return res.json({ success: true, message: 'Login successful!' });
        });
    })(req, res, next);
});

/*router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/auth/login',
        failureFlash: true,
    })(req, res, next);
}); */




// Logout route - GET
router.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/'); // Redirect to the landing page
    });
});


module.exports = router;
