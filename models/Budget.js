// models/Budget.js
const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // Add your budget fields here
});

module.exports = mongoose.model('Budget', budgetSchema);
