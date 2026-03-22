const router = require('express').Router()
const authMiddleware = require('../middleware/auth')
const DriveSession = require('../models/DriveSession')
const User = require('../models/User')

// Get user profile + drive history
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    const sessions = await DriveSession.find({ userId: req.user.id })
      .populate('companyId')
      .sort({ startedAt: -1 })
      .limit(20)

    // Calculate stats
    const completedSessions = sessions.filter(s =>
      s.rounds.some(r => r.completedAt)
    )
    const totalDrives = completedSessions.length
    const allRounds = completedSessions.flatMap(s =>
      s.rounds.filter(r => r.completedAt)
    )
    const avgScore = allRounds.length > 0
      ? Math.round(allRounds.reduce((sum, r) => {
          const pct = r.totalQuestions > 0
            ? Math.min(100, (r.score / r.totalQuestions) * 100)
            : 0
          return sum + pct
        }, 0) / allRounds.length)
      : 0
    const totalViolations = allRounds.reduce((s, r) =>
      s + (r.tabSwitches || 0), 0)
    const bestScore = allRounds.length > 0
      ? Math.round(Math.max(...allRounds.map(r =>
          r.totalQuestions > 0
            ? Math.min(100, (r.score / r.totalQuestions) * 100)
            : 0)))
      : 0

    // Company-wise performance
    const companyStats = {}
    completedSessions.forEach(session => {
      const name = session.companyId?.name || 'Unknown'
      const rounds = session.rounds.filter(r => r.completedAt)
      if (rounds.length === 0) return
      const score = Math.round(rounds.reduce((s, r) => {
            const pct = r.totalQuestions > 0
              ? Math.min(100, (r.score / r.totalQuestions) * 100)
              : 0
            return s + pct
          }, 0) / rounds.length)
      if (!companyStats[name] || score > companyStats[name].bestScore) {
        companyStats[name] = {
          name,
          logo: session.companyId?.logo,
          attempts: (companyStats[name]?.attempts || 0) + 1,
          bestScore: score,
          lastAttempt: session.startedAt
        }
      } else {
        companyStats[name].attempts++
      }
    })

    res.json({
      user,
      stats: { totalDrives, avgScore, bestScore, totalViolations },
      sessions: completedSessions,
      companyStats: Object.values(companyStats)
    })
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
})

module.exports = router