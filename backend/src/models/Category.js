/**
 * @fileoverview This file defines the Mongoose schema for the Category model.
 * @module backend/src/models/Category
 */

const mongoose = require('mongoose');

/**
 * @typedef {Object} Category
 * @property {string} name - The name of the category.
 * @property {mongoose.Schema.Types.ObjectId} parentCategory - The parent category of this category.
 * @property {boolean} isDefault - A flag indicating if this is a default category.
 * @property {mongoose.Schema.Types.ObjectId} user - The user who owns this category.
 */
const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    parentCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null, // null for main categories
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: function() { return !this.isDefault; }, // Required if not a default category
    }
});

module.exports = mongoose.model('Category', categorySchema);
