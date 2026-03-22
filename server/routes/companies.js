const router = require('express').Router()
const Company = require('../models/Company')

// Get all VISIBLE companies (for dashboard)
router.get('/', async (req, res) => {
  try {
    const companies = await Company.find({ hidden: { $ne: true } })
    res.json(companies)
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
})

// Search company by name (for custom entry — finds hidden too)
router.get('/search', async (req, res) => {
  try {
    const { name } = req.query
    if (!name) return res.status(400).json({ msg: 'Name required' })

    const company = await Company.findOne({
      name: { $regex: new RegExp(name, 'i') }
    })

    if (!company) return res.status(404).json({ msg: 'Company not found' })
    res.json(company)
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
})

// Get single company by ID
router.get('/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)
    if (!company) return res.status(404).json({ msg: 'Company not found' })
    res.json(company)
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
})

module.exports = router