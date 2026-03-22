const mongoose = require('mongoose')

const CodingProblemSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, required: true },
  examples:    [{ input: String, output: String, explanation: String }],
  testCases:   [{ input: String, expectedOutput: String }],
  difficulty:  { type: String, enum: ['easy', 'medium', 'hard'] },
  topic:       String,
  companies:   [String],
  timeLimit:   { type: Number, default: 2 },
  starterCode: {
    python:     String,
    javascript: String,
    java:       String,
    cpp:        String
  }
})

module.exports = mongoose.model('CodingProblem', CodingProblemSchema)