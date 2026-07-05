const mongoose = require('mongoose');

const categoryTypeSchema = new mongoose.Schema({
  // System types (isSystem: true) have no userId and are visible to everyone;
  // user-created types belong to a single user.
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    default: '#667eea',
    trim: true
  },
  icon: {
    type: String,
    trim: true
  },
  isSystem: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Unique type names per user (userId is null for shared system types)
categoryTypeSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('CategoryType', categoryTypeSchema);
