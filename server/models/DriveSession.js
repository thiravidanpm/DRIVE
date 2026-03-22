const mongoose = require('mongoose');

const DriveSessionSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  status:    { type: String, enum: ['active','completed','eliminated'], default: 'active' },
  rounds: [{
    roundName:    String,
    roundType:    String,
    score:        Number,
    totalQuestions: Number,
    percentile:   Number,
    cutoffScore:  Number,
    passed:       Boolean,
    tabSwitches:  { type: Number, default: 0 },
    completedAt:  Date
  }],
  currentRound: { type: Number, default: 0 },
  startedAt:    { type: Date, default: Date.now },
  completedAt:  Date
});

module.exports = mongoose.model('DriveSession', DriveSessionSchema);