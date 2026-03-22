const router = require('express').Router()
const Question = require('../models/Question')

router.get('/', async (req, res) => {
  try {
    const { type, difficulty, limit = 30, company } = req.query
    const filter = {}
    if (type) filter.type = type
    if (difficulty) filter.difficulty = difficulty

    if (company) {
      const companyLower = company.toLowerCase()
      filter.companies = companyLower
      // No randomization — return all questions for this company in fixed order
      const questions = await Question.find(filter).limit(parseInt(limit))
      return res.json(questions)
    }

    const questions = await Question.find(filter).limit(parseInt(limit))
    res.json(questions)
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
})

module.exports = router