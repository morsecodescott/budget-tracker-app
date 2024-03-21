// routes/budget.js
const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');

router.get('/', (req, res) => {
  res.send('Welcome to the budget tracker');
});

// Add more routes for budget management here

module.exports = router;
