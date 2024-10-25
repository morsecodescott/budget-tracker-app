const mongoose = require('mongoose');

const plaidTransactionSchema = new mongoose.Schema({
    plaidAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlaidAccount', required: true },
    plaidTransactionId: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    name: { type: String, required: true },
    category: [String],
    plaidCategory: [{type: String}],
    isoCurrencyCode: { type: String },  // Optional, but useful if dealing with multiple currencies
    unofficialCurrencyCode: { type: String },  // Optional
    pending: { type: Boolean },
    // Additional details can be stored here if needed
});

module.exports = mongoose.model('PlaidTransaction', plaidTransactionSchema);
