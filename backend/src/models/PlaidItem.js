const mongoose = require('mongoose');

const plaidItemSchema = new mongoose.Schema({
    plaidItemId: { type: String, required: true },
    institutionId: { type: String, required: true },
    institutionName: { type: String, required: true },
    institutionLogoUrl: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    accessToken: { type: String, required: true },
    webhook: { type: String, default: null },
    transactions_cursor: { type: String, default: null },
    accounts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PlaidAccount' }],
    is_active: { type: Boolean, required: true, default: true },
    last_successful_update: { type: Date, default: null },
    last_failed_update: { type: Date, default: null },
    last_webhook_sent_at: { type: Date, default: null },
    last_webhook_code_sent: { type: String, default: null },
});

module.exports = mongoose.model('PlaidItem', plaidItemSchema);
