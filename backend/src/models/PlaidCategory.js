
// models/PlaidCategory.js
const mongoose = require('mongoose');

const plaidCategorySchema = new mongoose.Schema({
    internal_category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    PRIMARY: { type: String, required: true },
    DETAILED: { type: String, required: true },
    DESCRIPTION: { type: String, required: true }
    
});

module.exports = mongoose.model('PlaidCategory', plaidCategorySchema);
