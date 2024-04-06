const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { ensureAuthenticated, isAdmin } = require('../config/auth');

// Create a new category
router.post('/', ensureAuthenticated, async (req, res) => {
    // Convert 'on' to true, absence to false
    const isDefault = req.body.isDefault === 'on';

    // Use ternary operator to set userId to null if isDefault is true, or to user's ID if false
    const userId = isDefault ? null : req.user._id;
    console.log("Post Request Data: "+JSON.stringify(req.body, null, 2));

    // Now, proceed with creating the category
    try {
        const newCategory = new Category({
            name: req.body.name,
            parentCategory: req.body.parentCategory || null, // Ensure null if undefined
            isDefault: isDefault,
            user: userId
        });
        await newCategory.save();
        res.status(201).json({ message: 'Category created successfully', category: newCategory });
    } catch (err) {
        console.log("Category Post req.body:"+req.body);
        console.log("Category Post vars: name:"+name+" parentCategory: "+parentCategory+" isDefault: "+isDefault+" userId: " +userId);
        console.log("Error: "+ err.message);
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

// get a list of parent categories
router.get('/parents', ensureAuthenticated, async (req, res) => {
    try {
        const categories = await Category.find({
            $or: [
                { isDefault: true }, // Fetch default categories
                { user: req.user._id } // Fetch user-specific categories
            ]
        });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: 'Failed to retrieve parent categories', error: err.message });
    }
});

// Get a single category by ID
router.get('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Add a check here if you want to restrict the access to the user who created the category
        // or if the category is default and the user is an admin
        if (!category.isDefault && category.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to view this category' });
        }

        res.json(category);
    } catch (err) {
        res.status(500).json({ message: 'Failed to retrieve category', error: err.message });
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
        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Check if it's a default category and if the user is an admin
        if (category.isDefault) {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Only admins can delete default categories' });
            }
        } else {
            // If it's a user-specific category, check if the current user is the creator
            if (category.user.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'You can only delete your own categories' });
            }
        }

        await Category.findByIdAndDelete(id);
        res.json({ message: 'Category deleted successfully' });

    } catch (err) {
        res.status(500).json({ message: 'Failed to delete category', error: err.message });
    }
});


module.exports = router;
