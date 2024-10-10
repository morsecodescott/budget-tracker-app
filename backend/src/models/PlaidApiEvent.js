const mongoose = require('mongoose');

const plaidApiEventSchema = new mongoose.Schema({
  plaidItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlaidItem', required: true }, // Reference to Item
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to User
  plaidMethod: { type: String, required: true }, // The Plaid API method called
  clientMethodArgs: { type: mongoose.Schema.Types.Mixed, required: true }, // JSON arguments passed to the method
  requestId: { type: String }, // Plaid request ID
  errorType: { type: String }, // Error type from Plaid API
  errorCode: { type: String }, // Error code from Plaid API
  timestamp: { type: Date, default: Date.now } // Timestamp for the event log
});

module.exports = mongoose.model('PlaidApiEvent', plaidApiEventSchema);
