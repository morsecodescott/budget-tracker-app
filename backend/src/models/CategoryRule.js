const mongoose = require('mongoose');

const categoryRuleSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    merchantName: { type: String, required: true },
    matchType: {
        type: String,
        enum: ['exact', 'contains', 'startsWith', 'endsWith'],
        required: true,
        default: 'contains'
    },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
}, { timestamps: true });

module.exports = mongoose.model('CategoryRule', categoryRuleSchema);