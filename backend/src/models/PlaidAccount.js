const mongoose = require('mongoose');

const plaidAccountSchema = new mongoose.Schema({
    plaidItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlaidItem', required: true },
    plaidAccountId: { type: String, required: true },
    accountName: { type: String, required: true },
    mask: { type: String },
    accountType: { type: String, required: true },
    accountSubType: { type: String, required: true },
    availableBalance: { type: Number },
    currentBalance: { type: Number },
    limit: { type: Number },
});

module.exports = mongoose.model('PlaidAccount', plaidAccountSchema);
