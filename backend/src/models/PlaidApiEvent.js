const mongoose = require('mongoose');

const plaidApiEventSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,

  },
  code: { type: String, required: true }, // Webhook code or API method name
  plaidItemId: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: { type: String }, // Event status (RECEIVED, PROCESSED, ERROR, etc.)
  details: { type: mongoose.Schema.Types.Mixed }, // Additional event details
  error: { type: String }, // Error message
  requestId: { type: String }, // Plaid request ID
  errorType: { type: String }, // Plaid error type
  errorCode: { type: String }, // Plaid error code
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  //  collection: 'PlaidApiEvent', // Explicit collection name
  timestamps: true // Adds createdAt and updatedAt fields
});

module.exports = mongoose.model('PlaidApiEvent', plaidApiEventSchema);
