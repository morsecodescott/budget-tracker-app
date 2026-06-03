const express = require('express');
const router = express.Router();
const CategoryRule = require('../models/CategoryRule');
const Transaction = require('../models/Transaction');
const Item = require('../models/Item');

// Get all rules for user
router.get('/', async (req, res) => {
    try {
        const rules = await CategoryRule.find({ userId: req.user._id }).populate('categoryId');
        res.json(rules);
    } catch (err) {
        console.error('Error fetching category rules:', err);
        res.status(500).json({ error: 'Failed to fetch rules' });
    }
});

// Create a rule
router.post('/', async (req, res) => {
    try {
        const { merchantName, matchType, categoryId } = req.body;
        const newRule = new CategoryRule({
            userId: req.user._id,
            merchantName,
            matchType,
            categoryId
        });
        await newRule.save();
        const populatedRule = await CategoryRule.findById(newRule._id).populate('categoryId');
        res.status(201).json(populatedRule);
    } catch (err) {
        console.error('Error creating category rule:', err);
        res.status(500).json({ error: 'Failed to create rule' });
    }
});

// Update a rule
router.put('/:id', async (req, res) => {
    try {
        const { merchantName, matchType, categoryId } = req.body;
        const rule = await CategoryRule.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { merchantName, matchType, categoryId },
            { new: true }
        ).populate('categoryId');

        if (!rule) {
            return res.status(404).json({ error: 'Rule not found' });
        }
        res.json(rule);
    } catch (err) {
        console.error('Error updating category rule:', err);
        res.status(500).json({ error: 'Failed to update rule' });
    }
});

// Delete a rule
router.delete('/:id', async (req, res) => {
    try {
        const result = await CategoryRule.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!result) {
            return res.status(404).json({ error: 'Rule not found' });
        }
        res.json({ message: 'Rule deleted' });
    } catch (err) {
        console.error('Error deleting category rule:', err);
        res.status(500).json({ error: 'Failed to delete rule' });
    }
});

// Apply a rule to past transactions
router.post('/:id/apply', async (req, res) => {
    try {
        const rule = await CategoryRule.findOne({ _id: req.params.id, userId: req.user._id });
        if (!rule) {
            return res.status(404).json({ error: 'Rule not found' });
        }

        // Get all account IDs for the user
        const items = await Item.find({ userId: req.user._id }).populate('accounts');
        const accountIds = items.flatMap(item => item.accounts.map(acc => acc._id));

        // Build the regex query based on matchType
        let regexPattern = '';
        const escapedMerchantName = rule.merchantName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape regex characters

        switch (rule.matchType) {
            case 'exact':
                regexPattern = `^${escapedMerchantName}$`;
                break;
            case 'startsWith':
                regexPattern = `^${escapedMerchantName}`;
                break;
            case 'endsWith':
                regexPattern = `${escapedMerchantName}$`;
                break;
            case 'contains':
            default:
                regexPattern = escapedMerchantName;
                break;
        }

        // Find and update matching transactions
        const result = await Transaction.updateMany(
            {
                accountId: { $in: accountIds },
                merchant_name: { $regex: regexPattern, $options: 'i' }
            },
            { $set: { category: rule.categoryId } }
        );

        res.json({ message: `Rule applied to ${result.modifiedCount} transactions`, updatedCount: result.modifiedCount });
    } catch (err) {
        console.error('Error applying category rule:', err);
        res.status(500).json({ error: 'Failed to apply rule' });
    }
});

module.exports = router;