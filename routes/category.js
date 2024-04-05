const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { ensureAuthenticated, isAdmin } = require('../config/auth');

// Create a new category
router.post('/', ensureAuthenticated, async (req, res) => {
    const { name, parentCategory, isDefault } = req.body;
    const userId = isDefault ? null : req.user._id; // Default categories don't have a user

    try {
        const newCategory = new Category({ name, parentCategory, isDefault, user: userId });
        await newCategory.save();
        res.status(201).json({ message: 'Category created successfully', category: newCategory });
    } catch (err) {
        console.log(req.body);
        res.status(500).json({ message: 'Failed to create category', error: err.message });
    }
});

// Get all categories
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const categories = await Category.find({
            $or: [
                { isDefault: true },
                { user: req.user._id }
            ]
        });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: 'Failed to retrieve categories', error: err.message });
    }
});

// Update a category
router.put('/:id', ensureAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { name, parentCategory } = req.body;

    try {
        const updatedCategory = await Category.findByIdAndUpdate(id, { name, parentCategory }, { new: true });
        res.json({ message: 'Category updated successfully', category: updatedCategory });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update category', error: err.message });
    }
});

// Delete a category
router.delete('/:id', ensureAuthenticated, async (req, res) => {
    const { id } = req.params;

    try {
        await Category.findByIdAndDelete(id);
        res.json({ message: 'Category deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete category', error: err.message });
    }
});

module.exports = router;
