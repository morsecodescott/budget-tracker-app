const mongoose = require('mongoose');

const plaidItemSchema = new mongoose.Schema({
    itemId: { type: String, required: true },
    institutionId: { type: String, required: true },
    institutionName: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    accessToken: { type: String, required: true },
    webhook: { type: String },
    institutionId: { type: String, required: true },
    institutionName: { type: String, required: true },
    transaction_cursor: { type: String },
    accounts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PlaidAccount' }],
    is_active: { type: Boolean, required: true, default: true } ,
    last_successful_update: { type: Date },
    last_failed_update: { type: Date },
    last_webhook_sent_at: { type: Date },
    last_webhook_code_sent: { type: String },
});

module.exports = mongoose.model('PlaidItem', plaidItemSchema);
