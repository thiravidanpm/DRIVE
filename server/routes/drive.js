const router = require('express').Router();
const DriveSession = require('../models/DriveSession');
const authMiddleware = require('../middleware/auth');

// Start a new drive session
router.post('/start', authMiddleware, async (req, res) => {
  try {
    const { companyId, rounds } = req.body;
    const session = await DriveSession.create({
      userId: req.user.id,
      companyId,
      rounds: rounds.map(r => ({
        roundName: r.name,
        roundType: r.type
      }))
    });
    res.json(session);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Submit a round
router.post('/submit-round', authMiddleware, async (req, res) => {
  try {
    const { sessionId, roundIndex, score, totalQuestions, tabSwitches, percentile, passed } = req.body
    const session = await DriveSession.findById(sessionId)
    if (!session) return res.status(404).json({ msg: 'Session not found' })

    session.rounds[roundIndex].score = score
    session.rounds[roundIndex].totalQuestions = totalQuestions
    session.rounds[roundIndex].tabSwitches = tabSwitches || 0
    session.rounds[roundIndex].percentile = percentile || 0
    session.rounds[roundIndex].passed = passed
    session.rounds[roundIndex].completedAt = new Date()
    session.currentRound = roundIndex + 1

    // Update session status
    if (!passed) {
      session.status = 'eliminated'
    } else if (roundIndex === session.rounds.length - 1) {
      session.status = 'completed'
      session.completedAt = new Date()
    }

    // Use markModified to ensure mongoose detects nested changes
    session.markModified('rounds')
    await session.save()
    res.json(session)
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
})

// Get session by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const session = await DriveSession.findById(req.params.id)
      .populate('companyId');
    res.json(session);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;