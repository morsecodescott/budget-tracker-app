const mongoose = require('mongoose');

const plaidTransactionSchema = new mongoose.Schema({
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlaidAccount', required: true },
    transactionId: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    name: { type: String, required: true },
    category: [String],
    pending: { type: Boolean },
    // Additional details can be stored here if needed
});

module.exports = mongoose.model('PlaidTransaction', plaidTransactionSchema);
