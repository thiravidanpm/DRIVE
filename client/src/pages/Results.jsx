import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function Results() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [loadingFeedback, setLoadingFeedback] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSession()
  }, [sessionId])

  const loadSession = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get(`/api/drive/${sessionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setSession(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const generateFeedback = async () => {
    setLoadingFeedback(true)
    try {
      const token = localStorage.getItem('token')
      const completedRounds = session.rounds.filter(r => r.score !== undefined && r.score !== null)
      const res = await axios.post('/api/feedback/generate',
        {
          companyName: session.companyId?.name || 'the company',
          rounds: completedRounds.map(r => {
            const total = r.totalQuestions > 0 ? r.totalQuestions : 1
            const score = r.score || 0
            const pct = Math.min(100, Math.round((score / total) * 100))
            return {
              roundName: r.roundName,
              score: pct,
              totalQuestions: 100,
              percentile: r.percentile || 0,
              tabSwitches: r.tabSwitches || 0
            }
          })
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setFeedback(res.data)
    } catch (err) {
      console.error(err)
      setFeedback({
        overall: 'Could not generate AI feedback. Please check your Gemini API key.',
        strengths: ['Completed the drive'],
        weaknesses: ['Review your performance above'],
        roundFeedback: [],
        studyPlan: ['Practice more aptitude questions', 'Review technical concepts', 'Work on coding problems daily']
      })
    } finally {
      setLoadingFeedback(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-gray-400">Loading results...</div>
    </div>
  )

  const completedRounds = session?.rounds?.filter(r => r.completedAt) || []
  const passedRounds = completedRounds.filter(r => r.passed)
  const totalTabSwitches = completedRounds.reduce((s, r) => s + (r.tabSwitches || 0), 0)
  const overallScore = completedRounds.length > 0
    ? Math.round(completedRounds.reduce((s, r) => {
        const pct = r.totalQuestions > 0 ? (r.score / r.totalQuestions) * 100 : 0
        return s + pct
      }, 0) / completedRounds.length)
    : 0
  const avgPercentile = completedRounds.length > 0
    ? Math.round(completedRounds.reduce((s, r) => s + (parseFloat(r.percentile) || 0), 0) / completedRounds.length)
    : 0
  const fullyCompleted = passedRounds.length === session?.companyId?.rounds?.length

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="border-b border-gray-800 bg-gray-900 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">
              D<span className="text-blue-500">R</span>IVE
            </h1>
            <span className="text-gray-600">·</span>
            <span className="text-gray-400 text-sm">Drive Report</span>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition"
          >
            Back to Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Result banner */}
        <div className={`rounded-2xl p-8 mb-8 text-center ${
          fullyCompleted
            ? 'bg-green-500/10 border border-green-500/30'
            : 'bg-red-500/10 border border-red-500/30'
        }`}>
          <div className="text-5xl mb-3">{fullyCompleted ? '🎉' : '📊'}</div>
          <h2 className={`text-3xl font-bold mb-2 ${fullyCompleted ? 'text-green-400' : 'text-red-400'}`}>
            {fullyCompleted ? 'Drive Completed!' : 'Drive Ended'}
          </h2>
          <p className="text-gray-400">
            {session?.companyId?.name} Placement Drive · {completedRounds.length} round{completedRounds.length !== 1 ? 's' : ''} completed
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{overallScore}%</div>
            <div className="text-xs text-gray-500 mt-1">Avg Score</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{passedRounds.length}</div>
            <div className="text-xs text-gray-500 mt-1">Rounds Cleared</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">{avgPercentile}%</div>
            <div className="text-xs text-gray-500 mt-1">Avg Percentile</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className={`text-2xl font-bold ${totalTabSwitches > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {totalTabSwitches}
            </div>
            <div className="text-xs text-gray-500 mt-1">Tab Violations</div>
          </div>
        </div>

        {/* Round breakdown */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Round Breakdown</h3>
          <div className="space-y-3">
            {session?.companyId?.rounds?.map((round, i) => {
              const completed = session.rounds[i]
              const isDone = completed?.completedAt
              const scorePct = isDone && completed.totalQuestions > 0
                  ? Math.round((completed.score / completed.totalQuestions) * 100)
                  : 0

              return (
                <div key={i} className={`bg-gray-900 border rounded-xl p-4 ${
                  !isDone ? 'border-gray-800 opacity-50' :
                  completed.passed ? 'border-green-500/30' : 'border-red-500/30'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        !isDone ? 'bg-gray-800 text-gray-500' :
                        completed.passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {!isDone ? i + 1 : completed.passed ? '✓' : '✗'}
                      </div>
                      <div>
                        <div className="font-medium text-white">{round.name}</div>
                        <div className="text-xs text-gray-500 capitalize">{round.type}</div>
                      </div>
                    </div>

                    {isDone ? (
                      <div className="text-right">
                        <div className={`font-bold ${completed.passed ? 'text-green-400' : 'text-red-400'}`}>
                          {scorePct}%
                        </div>
                        <div className="text-xs text-gray-500">
                          {completed.score}/{completed.totalQuestions} correct
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-600 text-sm">Not reached</div>
                    )}
                  </div>

                  {isDone && (
                    <div className="mt-3 pt-3 border-t border-gray-800 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-sm font-medium text-blue-400">{completed.percentile || 0}%</div>
                        <div className="text-xs text-gray-600">Percentile</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{round.cutoff_pct}%</div>
                        <div className="text-xs text-gray-600">Cutoff</div>
                      </div>
                      <div>
                        <div className={`text-sm font-medium ${completed.tabSwitches > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {completed.tabSwitches || 0}
                        </div>
                        <div className="text-xs text-gray-600">Violations</div>
                      </div>
                    </div>
                  )}

                  {isDone && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${completed.passed ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${scorePct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-600 mt-1">
                        <span>0%</span>
                        <span className="text-yellow-500">cutoff: {round.cutoff_pct}%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* AI Feedback section */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">AI Performance Feedback</h3>
              <p className="text-gray-500 text-sm mt-0.5">AI-powered · Personalized to your performance</p>
            </div>
            {!feedback && (
              <button
                onClick={generateFeedback}
                disabled={loadingFeedback}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
              >
                {loadingFeedback ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Generating...
                  </>
                ) : '✨ Generate AI Feedback'}
              </button>
            )}
          </div>

          {!feedback && !loadingFeedback && (
            <div className="text-center py-10 text-gray-600">
              <div className="text-4xl mb-3">🤖</div>
              <p className="text-sm">Click the button above to get personalized AI feedback on your performance</p>
            </div>
          )}

          {loadingFeedback && (
            <div className="text-center py-10 text-gray-400">
              <div className="text-4xl mb-3 animate-pulse">🤖</div>
              <p className="text-sm">Analyzing your performance...</p>
            </div>
          )}

          {feedback && (
            <div className="space-y-5">

              {/* Overall */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-sm text-blue-300 font-medium mb-1">Overall Assessment</p>
                <p className="text-gray-300 text-sm leading-relaxed">{feedback.overall}</p>
              </div>

              {/* Strengths + Weaknesses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                  <p className="text-sm text-green-400 font-medium mb-3">Strengths</p>
                  <ul className="space-y-2">
                    {feedback.strengths?.map((s, i) => (
                      <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-green-400 mt-0.5">✓</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <p className="text-sm text-red-400 font-medium mb-3">Areas to Improve</p>
                  <ul className="space-y-2">
                    {feedback.weaknesses?.map((w, i) => (
                      <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-red-400 mt-0.5">→</span>{w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Round feedback */}
              {feedback.roundFeedback?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-300 mb-3">Round-wise Feedback</p>
                  <div className="space-y-3">
                    {feedback.roundFeedback.map((rf, i) => (
                      <div key={i} className="bg-gray-800 rounded-xl p-4">
                        <p className="text-sm font-medium text-white mb-1">{rf.round}</p>
                        <p className="text-sm text-gray-400 mb-2">{rf.feedback}</p>
                        <ul className="space-y-1">
                          {rf.tips?.map((tip, j) => (
                            <li key={j} className="text-xs text-gray-500 flex items-start gap-2">
                              <span className="text-blue-400">·</span>{tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Study plan */}
              {feedback.studyPlan?.length > 0 && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                  <p className="text-sm text-purple-400 font-medium mb-3">Your Study Plan</p>
                  <ol className="space-y-2">
                    {feedback.studyPlan.map((step, i) => (
                      <li key={i} className="text-sm text-gray-300 flex items-start gap-3">
                        <span className="bg-purple-500/20 text-purple-400 w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Try again */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium transition"
          >
            Try Another Company →
          </button>
        </div>
      </div>
    </div>
  )
}
