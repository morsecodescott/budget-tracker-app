// routes/auth.js
const express = require('express');
const passport = require('passport');
const router = express.Router();
const User = require('../models/User');

router.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: true,
  })
);


// Registration route - GET
router.get('/register', (req, res) => {
  res.render('register'); // Render registration form
});




// Registration route - POST
router.post('/register', (req, res) => {
  const { username, password } = req.body;
  // Check if user already exists
  User.findOne({ username: username }).then((user) => {
      if (user) {
          req.flash('error_msg', 'Username already exists');
          res.redirect('/auth/register');
      } else {
          // Create new user
          const newUser = new User({ username, password });
          newUser.save().then(() => {
              req.flash('success_msg', 'You are now registered and can log in');
              res.redirect('/auth/login');
          });
      }
  });
});

router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/login');
});

module.exports = router;
