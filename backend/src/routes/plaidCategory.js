const express = require('express');
const router = express.Router();
const PlaidCategory = require('../models/PlaidCategory'); // Assuming a PlaidCategory model exists
const { ensureAuthenticated } = require('../config/auth'); // Middleware

// Create a new Plaid category mapping
router.post('/', ensureAuthenticated, async (req, res) => {
    try {
        const { PRIMARY, DETAILED, DESCRIPTION, internal_category } = req.body;

        // Validate required fields
        if (!PRIMARY || !DETAILED || !DESCRIPTION || !internal_category) {
            return res.status(400).json({
                message: 'PRIMARY, DETAILED, DESCRIPTION, and internal_category are required.',
            });
        }

        // Create a new PlaidCategory document
        const newPlaidCategory = new PlaidCategory({
            PRIMARY,
            DETAILED,
            DESCRIPTION,
            internal_category,
        });

        // Save the new record to the database
        await newPlaidCategory.save();

        res.status(201).json({
            message: 'Plaid category record created successfully.',
            mapping: newPlaidCategory,
        });
    } catch (err) {
        console.error('Error creating Plaid category:', err.message);
        res.status(500).json({
            message: 'Failed to create Plaid category record.',
            error: err.message,
        });
    }
});


// Get all Plaid category mappings for the user
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const mappings = await PlaidCategory.find({}).populate('internal_category'); // Optional population
        res.json(mappings);
    } catch (err) {
        res.status(500).json({ message: 'Failed to retrieve mappings.', error: err.message });
    }
});

// Get a specific mapping by ID
router.get('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const mapping = await PlaidCategory.findById(req.params.id);

        if (!mapping) {
            return res.status(404).json({ message: 'Mapping not found.' });
        }


        res.json(mapping);
    } catch (err) {
        res.status(500).json({ message: 'Failed to retrieve mapping.', error: err.message });
    }
});

// Update a mapping
router.put('/:id', ensureAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { internal_category, PRIMARY, DETAILED, DESCRIPTION } = req.body;
    console.log(req.body);
    try {
        const mapping = await PlaidCategory.findById(id);

        if (!mapping) {
            return res.status(404).json({ message: 'Mapping not found.' });
        }

        mapping.internal_category = internal_category;
        mapping.PRIMARY = PRIMARY;
        mapping.DETAILED = DETAILED;
        mapping.DESCRIPTION = DESCRIPTION

        await mapping.save();
        res.json({ message: 'Mapping updated successfully.', mapping });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update mapping.', error: err.message });
    }
});

// Delete a mapping
router.delete('/:id', ensureAuthenticated, async (req, res) => {
    const { id } = req.params;

    try {
        const mapping = await PlaidCategory.findById(id);

        if (!mapping) {
            return res.status(404).json({ message: 'Mapping not found.' });
        }


        await PlaidCategory.findByIdAndDelete(id);
        res.json({ message: 'Mapping deleted successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete mapping.', error: err.message });
    }
});

module.exports = router;
