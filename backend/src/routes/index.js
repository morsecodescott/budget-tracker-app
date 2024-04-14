//backend/src/routes/index.js
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const budgetRoutes = require('./budget');
const categoryRoutes = require('./category');

router.use('/auth', authRoutes);
router.use('/budget', budgetRoutes);
router.use('/categories', categoryRoutes);

module.exports = router;