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
    const { firstName, lastName, email, password } = req.body;
    try {
        let user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        user = new User({
            firstName,
            lastName,
            email: email.toLowerCase(),
            password: hashedPassword,
        });

        await user.save();

        // Continue with your logic for logging the user in or redirecting them
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Login page - GET
router.get('/login', (req, res) => {
    
    res.render('login.ejs');
});


router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/auth/login',
        failureFlash: true,
    })(req, res, next);
});




// Logout route - GET
router.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/'); // Redirect to the landing page
    });
});


module.exports = router;
