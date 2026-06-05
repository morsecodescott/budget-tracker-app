const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    source: { type: String, enum: ['plaid', 'manual'], required: true, default: 'plaid' },
    plaidItemId: { type: String, required: function() { return this.source === 'plaid'; } },
    institutionId: { type: String, required: function() { return this.source === 'plaid'; } },
    institutionName: { type: String, required: true },
    institutionLogoUrl: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    accessToken: { type: String, required: function() { return this.source === 'plaid'; } },
    webhook: { type: String, default: null },
    transactions_cursor: { type: String, default: null },
    accounts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Account' }],
    is_active: { type: Boolean, required: true, default: true },
    last_successful_update: { type: Date, default: null },
    last_failed_update: { type: Date, default: null },
    last_webhook_sent_at: { type: Date, default: null },
    last_webhook_code_sent: { type: String, default: null },
    invertTransactions: { type: Boolean, default: false },
});

module.exports = mongoose.model('Item', itemSchema);
