const router = require('express').Router()
const authMiddleware = require('../middleware/auth')
const Groq = require('groq-sdk')

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

// ── Smart fallback when API fails ────────────────────────────────
const generateFallbackFeedback = (rounds, companyName) => {
  const avgScore = rounds.reduce((s, r) =>
    s + Math.round((r.score / r.totalQuestions) * 100), 0) / rounds.length
  const totalViolations = rounds.reduce((s, r) => s + (r.tabSwitches || 0), 0)

  let overall = ''
  if (avgScore >= 80)
    overall = `Excellent performance in the ${companyName} drive! You scored an average of ${Math.round(avgScore)}% which is well above the cutoff. You demonstrated strong knowledge across all rounds.`
  else if (avgScore >= 60)
    overall = `Good attempt at the ${companyName} drive with an average score of ${Math.round(avgScore)}%. You cleared most rounds but there is room for improvement in technical depth.`
  else
    overall = `You scored an average of ${Math.round(avgScore)}% in the ${companyName} drive. Focus on strengthening your fundamentals — consistent practice will significantly improve your performance.`

  const strengths = []
  const weaknesses = []

  rounds.forEach(r => {
    const pct = Math.round((r.score / r.totalQuestions) * 100)
    if (pct >= 70) strengths.push(`Strong performance in ${r.roundName} (${pct}%)`)
    else weaknesses.push(`Need improvement in ${r.roundName} (${pct}% — below 70%)`)
  })

  if (totalViolations === 0) strengths.push('Excellent exam integrity — zero tab violations')
  else weaknesses.push(`${totalViolations} tab switch violation(s) recorded — this disqualifies in real drives`)

  return {
    overall,
    strengths: strengths.length > 0 ? strengths : ['Completed the placement drive'],
    weaknesses: weaknesses.length > 0 ? weaknesses : ['Keep practicing to maintain performance'],
    roundFeedback: rounds.map(r => {
      const pct = Math.round((r.score / r.totalQuestions) * 100)
      return {
        round: r.roundName,
        feedback: pct >= 70
          ? `Good performance. You scored ${pct}% which is above the typical cutoff.`
          : `You scored ${pct}%. Focus on practicing more ${r.roundName.toLowerCase()} questions.`,
        tips: pct >= 70
          ? ['Maintain consistency', 'Try harder difficulty levels', 'Time yourself during practice']
          : ['Practice 20 questions daily', 'Review fundamentals', 'Use IndiaBIX and Sanfoundry']
      }
    }),
    studyPlan: [
      'Solve 2 LeetCode problems daily — focus on arrays, strings, and linked lists',
      'Practice 30 aptitude questions daily on IndiaBIX.com',
      'Review CS fundamentals: OS, DBMS, CN, OOPs — 1 topic per day',
      'Take 1 full mock test every weekend to simulate real drive pressure',
      `Research ${companyName}'s interview experiences on AmbitionBox and GFG`
    ]
  }
}

// ── Main feedback route ──────────────────────────────────────────
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { rounds, companyName } = req.body

    const prompt = `You are an expert placement coach at a top engineering college in India. A student just completed a mock placement drive for ${companyName}.

Here are their round-wise results:
${rounds.map(r => `- ${r.roundName}: scored ${r.score}/${r.totalQuestions} (${Math.round(r.score / r.totalQuestions * 100)}%), percentile: ${r.percentile}%, tab switches: ${r.tabSwitches}`).join('\n')}

Give detailed, personalized feedback. Return ONLY a valid JSON object in exactly this format with no extra text, no markdown, no code blocks:
{
  "overall": "2-3 sentence overall assessment mentioning specific scores",
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "weaknesses": ["specific weakness 1", "specific weakness 2"],
  "roundFeedback": [
    {
      "round": "round name",
      "feedback": "specific feedback for this round based on the score",
      "tips": ["actionable tip 1", "actionable tip 2", "actionable tip 3"]
    }
  ],
  "studyPlan": ["specific action 1", "specific action 2", "specific action 3", "specific action 4", "specific action 5"]
}`

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert placement coach. Always respond with valid JSON only. No markdown, no code blocks, no extra text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1500
    })

    const raw = completion.choices[0]?.message?.content || ''
    // Clean any accidental markdown
    const clean = raw
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    const feedback = JSON.parse(clean)
    res.json(feedback)

  } catch (err) {
    console.log('Groq API error, using fallback:', err.message)
    const fallback = generateFallbackFeedback(req.body.rounds, req.body.companyName)
    res.json(fallback)
  }
})

// ── HR Answer evaluation ─────────────────────────────────────────
router.post('/evaluate-hr', authMiddleware, async (req, res) => {
  try {
    const { question, answer } = req.body

    if (!answer || answer.trim().length < 5) {
      return res.json({ score: 0, feedback: 'Please provide a more detailed answer.' })
    }

    const prompt = `You are an HR interviewer evaluating a candidate's answer.

Question: "${question}"
Candidate's Answer: "${answer}"

Evaluate this answer on a scale of 0-100 based on:
- Relevance to the question (30 points)
- Depth and detail (30 points)
- Professional tone and vocabulary (20 points)
- Practical examples or specifics (20 points)

Return ONLY a valid JSON object with no extra text:
{
  "score": <number between 0-100>,
  "feedback": "<one sentence specific feedback>"
}`

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an HR interviewer. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 200
    })

    const raw = completion.choices[0]?.message?.content || ''
    const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim()
    const result = JSON.parse(clean)
    res.json(result)

  } catch (err) {
    console.log('Groq HR evaluation error:', err.message)
    // Fallback scoring
    const wordCount = req.body.answer?.trim().split(/\s+/).length || 0
    const score = Math.min(100, Math.max(10, wordCount * 2))
    res.json({
      score,
      feedback: wordCount >= 30
        ? 'Good answer with adequate detail.'
        : 'Try to elaborate more with specific examples.'
    })
  }
})

module.exports = router