const express = require('express');
const router = express.Router();
const Account = require('../models/Account');
const Item = require('../models/Item');

// Get all accounts for the authenticated user
router.get('/', async (req, res) => {
    try {
        const userId = req.user._id;

        // Find all items belonging to the user
        const items = await Item.find({ userId }).populate('accounts');

        if (!items || items.length === 0) {
            return res.json([]);
        }

        // Extract all accounts and attach the institution/item name for context
        const accounts = items.flatMap(item =>
            item.accounts.map(acc => ({
                ...acc.toObject(),
                institutionName: item.institutionName,
                itemSource: item.source
            }))
        );

        res.json(accounts);
    } catch (err) {
        console.error('Error fetching accounts:', err);
        res.status(500).json({ error: 'Failed to fetch accounts' });
    }
});

module.exports = router;
