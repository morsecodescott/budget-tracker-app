const mongoose = require('mongoose');

const plaidItemSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    accessToken: { type: String, required: true },
    itemId: { type: String, required: true },
    institutionId: { type: String, required: true },
    institutionName: { type: String, required: true },
    accounts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PlaidAccount' }]
});

module.exports = mongoose.model('PlaidItem', plaidItemSchema);
