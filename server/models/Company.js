const mongoose = require('mongoose')

const RoundSchema = new mongoose.Schema({
  name:          String,
  type:          { type: String, enum: ['aptitude','technical','coding','hr'] },
  duration_mins: Number,
  num_questions: Number,
  cutoff_pct:    Number
})

const CompanySchema = new mongoose.Schema({
  name:       { type: String, required: true },
  logo:       String,
  difficulty: { type: String, enum: ['easy','medium','hard'] },
  rounds:     [RoundSchema],
  tags:       [String],
  hidden:     { type: Boolean, default: false }
})

module.exports = mongoose.model('Company', CompanySchema)