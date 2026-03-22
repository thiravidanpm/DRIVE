const router = require('express').Router()
const axios = require('axios')
const authMiddleware = require('../middleware/auth')
const CodingProblem = require('../models/CodingProblem')

// Language IDs for Judge0
const LANGUAGE_IDS = {
  python:     71,
  javascript: 63,
  java:       62,
  cpp:        54
}

// Get coding problems filtered by company
router.get('/', async (req, res) => {
  try {
    const { limit = 2, company } = req.query

    if (company) {
      const companyLower = company.toLowerCase()
      const problems = await CodingProblem.find({ companies: companyLower }).limit(parseInt(limit))
      if (problems.length > 0) return res.json(problems)
      // fallback
      const fallback = await CodingProblem.find({}).limit(parseInt(limit))
      return res.json(fallback)
    }

    const problems = await CodingProblem.find({}).limit(parseInt(limit))
    res.json(problems)
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
})

// Run code against test cases
router.post('/run', authMiddleware, async (req, res) => {
  try {
    const { code, language, problemId } = req.body
    const problem = await CodingProblem.findById(problemId)
    if (!problem) return res.status(404).json({ msg: 'Problem not found' })

    const languageId = LANGUAGE_IDS[language]
    if (!languageId) return res.status(400).json({ msg: 'Unsupported language' })

    const results = []

    // Run against each test case
    for (const testCase of problem.testCases) {
      try {
        // Submit to Judge0
        const submitRes = await axios.post(
  'https://ce.judge0.com/submissions?base64_encoded=false&wait=true',
  {
    source_code: code,
    language_id: languageId,
    stdin: testCase.input,
    expected_output: testCase.expectedOutput,
    cpu_time_limit: problem.timeLimit
  },
  {
    headers: {
      'Content-Type': 'application/json'
    }
  }
)

        const result = submitRes.data
        const actualOutput = (result.stdout || '').trim()
        const expectedOutput = testCase.expectedOutput.trim()
        const passed = actualOutput === expectedOutput

        results.push({
          input: testCase.input,
          expectedOutput,
          actualOutput,
          passed,
          status: result.status?.description || 'Unknown',
          time: result.time,
          memory: result.memory,
          stderr: result.stderr || null,
          compile_output: result.compile_output || null
        })
      } catch (err) {
        results.push({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: '',
          passed: false,
          status: 'Error',
          error: err.message
        })
      }
    }

    const passed = results.filter(r => r.passed).length
    const total = results.length
    const score = Math.round((passed / total) * 100)

    res.json({ results, passed, total, score })
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
})

module.exports = router