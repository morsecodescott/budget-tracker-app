// models/Budget.js
const mongoose = require('mongoose');

// Helper function to normalize date to first of month in UTC
function normalizeToFirstOfMonth(date) {
  const d = new Date(date);
  // Create date in UTC to avoid timezone shifts
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}

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
    required: function () { return this.frequency === 'every few months'; },
    min: 2,
    max: 12
  },
  description: {
    type: String,

  },
  period: {
    type: Date,
    required: true,
    default: () => normalizeToFirstOfMonth(new Date()),
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save middleware to ensure period is always normalized to first of month
budgetSchema.pre('save', function (next) {
  if (this.period) {
    this.period = normalizeToFirstOfMonth(this.period);
  }
  next();
});

module.exports = mongoose.model('Budget', budgetSchema);
