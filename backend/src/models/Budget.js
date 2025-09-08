/**
 * @fileoverview This file defines the Mongoose schema for the Budget model.
 * It includes a helper function and pre-save middleware to normalize the period to the first of the month.
 * @module backend/src/models/Budget
 */

const mongoose = require('mongoose');

/**
 * Normalizes a date to the first day of the month in UTC.
 * @param {string | Date} date - The date to normalize.
 * @returns {Date} The normalized date.
 */
function normalizeToFirstOfMonth(date) {
  const d = new Date(date);
  // Create date in UTC to avoid timezone shifts
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}

/**
 * @typedef {Object} Budget
 * @property {mongoose.Schema.Types.ObjectId} user - The user who owns the budget item.
 * @property {mongoose.Schema.Types.ObjectId} category - The category of the budget item.
 * @property {number} amount - The amount of the budget item.
 * @property {string} frequency - The frequency of the budget item (e.g., 'monthly', 'one-time').
 * @property {number} recurrence - The recurrence of the budget item (e.g., every 3 months).
 * @property {string} description - A description of the budget item.
 * @property {Date} period - The period of the budget item, normalized to the first of the month.
 * @property {Date} createdAt - The timestamp when the budget item was created.
 */
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
