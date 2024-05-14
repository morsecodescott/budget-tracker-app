const mongoose = require('mongoose');

const plaidItemSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    accessToken: { type: String, required: true },
    itemId: { type: String, required: true },
    institutionId: { type: String, required: true },
    institutionName: { type: String, required: true },
    transaction_cursor: { type: String },
    accounts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PlaidAccount' }],
    is_active: { type: Boolean, required: true, default: true } 
});

module.exports = mongoose.model('PlaidItem', plaidItemSchema);
