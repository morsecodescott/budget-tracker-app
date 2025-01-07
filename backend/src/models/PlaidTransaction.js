const mongoose = require('mongoose');

const plaidTransactionSchema = new mongoose.Schema({
    plaidAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlaidAccount', required: true },
    plaidTransactionId: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    name: { type: String, required: true },
    merchant_name: { type: String, required: true },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
        default: new mongoose.Types.ObjectId('67223d3d38c3ebd3102829fe')
    },
    plaidCategory: {
        primary: { type: String, required: true },
        detailed: { type: String, required: true },
        confidence_level: { type: String, enum: ['VERY_HIGH', 'HIGH', 'MEDIUM', 'LOW'], required: true }
    },
    isoCurrencyCode: { type: String },  // Optional, but useful if dealing with multiple currencies
    unofficialCurrencyCode: { type: String },  // Optional
    pending: { type: Boolean },
    // Additional details can be stored here if needed
});

module.exports = mongoose.model('PlaidTransaction', plaidTransactionSchema);
