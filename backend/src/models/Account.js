const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
    source: { type: String, enum: ['plaid', 'manual'], required: true, default: 'plaid' },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    plaidAccountId: { type: String, required: function() { return this.source === 'plaid'; } },
    accountName: { type: String, required: true },
    mask: { type: String },
    accountType: { type: String, required: true },
    accountSubType: { type: String, required: true },
    availableBalance: { type: Number },
    currentBalance: { type: Number },
    limit: { type: Number },
});

module.exports = mongoose.model('Account', accountSchema);
