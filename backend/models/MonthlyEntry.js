const mongoose = require('mongoose');

const monthlyEntrySchema = new mongoose.Schema({
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  month: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}$/ // YYYY-MM format
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

// Ensure one entry per account per month
monthlyEntrySchema.index({ accountId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('MonthlyEntry', monthlyEntrySchema);
