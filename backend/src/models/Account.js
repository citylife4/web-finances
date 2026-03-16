const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  typeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CategoryType',
    required: true
  },
    categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for performance
accountSchema.index({ typeId: 1 });
accountSchema.index({ categoryId: 1 });

module.exports = mongoose.model('Account', accountSchema);
