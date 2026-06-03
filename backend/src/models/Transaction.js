const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    source: { type: String, enum: ['plaid', 'manual'], required: true, default: 'plaid' },
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
    plaidTransactionId: { type: String, required: function() { return this.source === 'plaid'; } },
    uniqueId: { type: String, required: function() { return this.source === 'manual'; } }, // Hash of manual tx fields
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    name: { type: String, required: true },
    merchant_name: { type: String, required: true },
    merchant_reference_number: { type: String },
    merchant_category_description: { type: String },
    merchant_city: { type: String },
    merchant_state_or_province: { type: String },
    merchant_country_code: { type: String },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
        default: new mongoose.Types.ObjectId('67223d3d38c3ebd3102829fe')
    },
    plaidCategory: {
        primary: { type: String, required: function() { return this.source === 'plaid'; } },
        detailed: { type: String, required: function() { return this.source === 'plaid'; } },
        confidence_level: { type: String, enum: ['VERY_HIGH', 'HIGH', 'MEDIUM', 'LOW'], required: function() { return this.source === 'plaid'; } }
    },
    isoCurrencyCode: { type: String },  // Optional, but useful if dealing with multiple currencies
    unofficialCurrencyCode: { type: String },  // Optional
    pending: { type: Boolean },
    // Additional details can be stored here if needed
});

module.exports = mongoose.model('Transaction', transactionSchema);
