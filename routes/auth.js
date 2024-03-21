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

router.post('/register', (req, res) => {
  const { username, password } = req.body;
  User.findOne({ username: username }).then((user) => {
    if (user) {
      req.flash('error_msg', 'Username already exists');
      res.redirect('/register');
    } else {
      const newUser = new User({ username, password });
      newUser.save().then(() => {
        req.flash('success_msg', 'You are now registered and can log in');
        res.redirect('/login');
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
