// models/Budget.js
const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category', 
    required: true,
  },
/*  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true,
  },*/
  amount: {
    type: Number,
    required: true,
  },
  frequency: {
    type: String,
    enum: ['monthly', 'one-time', "every few months"],
    required: true,
  },
  recurrence: {
    type: Number,
    required: function() { return this.frequency === 'every few months'; },
    min: 2,
    max: 12
  },
  description: {
    type: String,
    required: true,
  },
  period: {
    type: Date,
    required: true,
    required: true,
    default: () => {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), 1);
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Budget', budgetSchema);

