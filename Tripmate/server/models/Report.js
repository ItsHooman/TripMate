const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reporterUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'resolved', 'banned', 'deactivated'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Report', reportSchema);
