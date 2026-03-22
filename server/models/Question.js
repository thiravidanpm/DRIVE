const mongoose = require('mongoose')

const QuestionSchema = new mongoose.Schema({
  text:       { type: String, required: true },
  options:    [String],
  answer:     Number,
  type:       { type: String, enum: ['aptitude','technical','hr'] },
  topic:      String,
  difficulty: { type: String, enum: ['easy','medium','hard'] },
  companies:  [String]  // ← NEW: which companies use this question
})

module.exports = mongoose.model('Question', QuestionSchema)