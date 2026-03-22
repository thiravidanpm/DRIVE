import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import CodeEditor from '../components/CodeEditor'

// ── Cutoff simulation ──────────────────────────────────────────────
function simulateCandidatePool(mean, stdDev, count = 500) {
  return Array.from({ length: count }, () => {
    const u1 = Math.random(), u2 = Math.random()
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    return Math.max(0, Math.min(100, Math.round(mean + z * stdDev)))
  })
}

function calculateResult(score, total, cutoffPct) {
  const pct = Math.round((score / total) * 100)
  const pool = simulateCandidatePool(58, 12)
  const studentScore = pct
  const rank = pool.filter(s => s > studentScore).length + 1
  const percentile = ((500 - rank) / 500 * 100).toFixed(1)
  const sortedPool = [...pool].sort((a, b) => b - a)
  const cutoffIndex = Math.floor(500 * (cutoffPct / 100))
  const cutoffScore = sortedPool[Math.min(cutoffIndex, 499)]
  const passed = pct >= cutoffPct
  return { pct, rank: Math.min(rank, 500), percentile: Math.max(0, percentile), cutoffScore, passed }
}

// ── Sample questions (used when DB is empty) ──────────────────────
const SAMPLE_QUESTIONS = {
  aptitude: [
    { text: 'If a train travels 360 km in 4 hours, what is its speed in m/s?', options: ['25 m/s', '90 m/s', '100 m/s', '40 m/s'], answer: 0 },
    { text: 'A shopkeeper sells an item for ₹540 at 20% profit. What is the cost price?', options: ['₹400', '₹450', '₹480', '₹500'], answer: 1 },
    { text: 'What is the next number in the series: 2, 6, 12, 20, 30, ?', options: ['40', '42', '44', '46'], answer: 1 },
    { text: 'If 6 workers complete a job in 12 days, how many days will 9 workers take?', options: ['6', '8', '9', '10'], answer: 1 },
    { text: 'A and B together can do a work in 12 days. A alone in 20 days. How many days for B alone?', options: ['25', '28', '30', '35'], answer: 2 },
    { text: 'The average of 5 numbers is 27. If one number is excluded, average becomes 25. Find excluded number.', options: ['30', '32', '35', '37'], answer: 3 },
    { text: 'What is 15% of 240?', options: ['32', '34', '36', '38'], answer: 2 },
    { text: 'A car covers 300 km at 60 km/h and 200 km at 40 km/h. Average speed?', options: ['48', '50', '52', '54'], answer: 1 },
    { text: 'In how many ways can 4 people be seated in a row?', options: ['12', '16', '24', '32'], answer: 2 },
    { text: 'Find the odd one out: 8, 27, 64, 100, 125', options: ['8', '27', '100', '125'], answer: 2 },
  ],
  technical: [
    { text: 'Which data structure uses LIFO principle?', options: ['Queue', 'Stack', 'LinkedList', 'Tree'], answer: 1 },
    { text: 'What is the time complexity of Binary Search?', options: ['O(n)', 'O(n²)', 'O(log n)', 'O(n log n)'], answer: 2 },
    { text: 'Which of these is NOT an OOP principle?', options: ['Encapsulation', 'Polymorphism', 'Compilation', 'Inheritance'], answer: 2 },
    { text: 'What does SQL stand for?', options: ['Structured Query Language', 'Simple Query Language', 'Standard Query Logic', 'Sequential Query Language'], answer: 0 },
    { text: 'Which sorting algorithm has best average case O(n log n)?', options: ['Bubble Sort', 'Insertion Sort', 'Merge Sort', 'Selection Sort'], answer: 2 },
    { text: 'What is a foreign key in a database?', options: ['Primary key of same table', 'Key that references primary key of another table', 'Unique key', 'Index key'], answer: 1 },
    { text: 'Which HTTP method is used to update a resource?', options: ['GET', 'POST', 'PUT', 'DELETE'], answer: 2 },
    { text: 'What does RAM stand for?', options: ['Read Access Memory', 'Random Access Memory', 'Rapid Access Memory', 'Read And Memory'], answer: 1 },
    { text: 'In OSI model, which layer handles routing?', options: ['Physical', 'Data Link', 'Network', 'Transport'], answer: 2 },
    { text: 'What is the output of: console.log(typeof null)?', options: ['null', 'undefined', 'object', 'string'], answer: 2 },
  ],
  hr: [
    { text: 'What is the most important quality for a software engineer?', options: ['Technical skills only', 'Communication and collaboration', 'Working alone', 'Speed of coding'], answer: 1 },
    { text: 'How do you handle tight deadlines?', options: ['Panic and rush', 'Prioritize tasks and communicate', 'Ignore the deadline', 'Ask others to do your work'], answer: 1 },
    { text: 'What does teamwork mean to you?', options: ['Doing all work yourself', 'Collaborating towards a shared goal', 'Letting others do the work', 'Competing with teammates'], answer: 1 },
    { text: 'Why do you want to join this company?', options: ['Only for salary', 'For growth and learning', 'No other option', 'My friend works here'], answer: 1 },
    { text: 'How do you handle constructive criticism?', options: ['Get defensive', 'Ignore it', 'Accept and improve', 'Argue back'], answer: 2 },
  ]
}

// ── Disqualified Screen ───────────────────────────────────────────
function DisqualifiedScreen({ tabSwitches, onViewReport }) {
  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-red-500 rounded-2xl p-10 w-full max-w-md mx-4 text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-2xl font-bold text-red-400 mb-2">Disqualified</h2>
        <p className="text-gray-400 text-sm mb-6">
          You have been disqualified from this round due to{' '}
          <span className="text-red-400 font-medium">{tabSwitches} tab switches / window violations</span>.
          Real placement drives terminate candidates for this behaviour.
        </p>
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-left space-y-2">
          <p className="text-red-400 text-xs font-medium">Violations recorded:</p>
          <p className="text-gray-400 text-xs">• {tabSwitches} tab switch / window focus violations</p>
          <p className="text-gray-400 text-xs">• Exiting fullscreen counts as a violation</p>
          <p className="text-gray-400 text-xs">• Maximum allowed: 2 warnings</p>
        </div>
        <button
          onClick={onViewReport}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-medium transition"
        >
          View Report & Feedback
        </button>
      </div>
    </div>
  )
}

// ── Emergency Exit Modal ──────────────────────────────────────────
function EmergencyExit({ onClose, onExit }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  const tryExit = () => {
    if (code === 'DRIVE-EXIT') {
      onExit()
    } else {
      setError('Wrong code. Hint: DRIVE-EXIT')
      setTimeout(() => setError(''), 2000)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-red-500/50 rounded-2xl p-8 w-full max-w-md mx-4">
        <h3 className="text-red-400 font-semibold text-lg mb-2">Emergency Exit</h3>
        <p className="text-gray-400 text-sm mb-6">
          Enter the emergency exit code to end this session. This will be logged.
        </p>
        <input
          type="text"
          placeholder="Enter exit code..."
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && tryExit()}
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-500 mb-3"
          autoFocus
        />
        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-700 text-gray-400 hover:text-white py-2 rounded-lg text-sm transition">
            Cancel
          </button>
          <button onClick={tryExit} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm transition">
            Exit Drive
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Round Result Modal ────────────────────────────────────────────
function RoundResult({ result, roundName, onNext, isLast, eliminated }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className={`bg-gray-900 border ${result.passed ? 'border-green-500/50' : 'border-red-500/50'} rounded-2xl p-8 w-full max-w-md mx-4`}>
        <div className="text-center mb-6">
          <div className={`text-5xl mb-3`}>{result.passed ? '✅' : '❌'}</div>
          <h3 className={`text-xl font-bold ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
            {result.passed ? 'Shortlisted!' : 'Eliminated'}
          </h3>
          <p className="text-gray-400 text-sm mt-1">{roundName}</p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between bg-gray-800 rounded-lg px-4 py-3">
            <span className="text-gray-400 text-sm">Your Score</span>
            <span className="text-white font-semibold">{result.pct}%</span>
          </div>
          <div className="flex justify-between bg-gray-800 rounded-lg px-4 py-3">
            <span className="text-gray-400 text-sm">Cutoff Score</span>
            <span className="text-white font-semibold">{result.cutoffScore}%</span>
          </div>
          <div className="flex justify-between bg-gray-800 rounded-lg px-4 py-3">
            <span className="text-gray-400 text-sm">Your Percentile</span>
            <span className="text-blue-400 font-semibold">Top {100 - result.percentile}%</span>
          </div>
          <div className="flex justify-between bg-gray-800 rounded-lg px-4 py-3">
            <span className="text-gray-400 text-sm">Rank</span>
            <span className="text-white font-semibold">{result.rank} / 500</span>
          </div>
        </div>

        {result.passed ? (
          <button onClick={onNext} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition">
            {isLast ? 'View Full Report →' : 'Proceed to Next Round →'}
          </button>
        ) : (
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-4">
              You needed {result.cutoffScore}% but scored {result.pct}%. Better luck next time!
            </p>
            <button onClick={onNext} className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-medium transition">
              View Feedback Report
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main ExamRoom ─────────────────────────────────────────────────
export default function ExamRoom() {
  const { sessionId } = useParams()
  const navigate = useNavigate()

  const [session, setSession] = useState(null)
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentRound, setCurrentRound] = useState(0)
  const [questions, setQuestions] = useState([])
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [tabSwitches, setTabSwitches] = useState(0)
  const [showWarning, setShowWarning] = useState(false)
  const [showExit, setShowExit] = useState(false)
  const [roundResult, setRoundResult] = useState(null)
  const [writtenAnswers, setWrittenAnswers] = useState({})
  const [hrScores, setHrScores] = useState({})
  const [evaluatingHR, setEvaluatingHR] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [driveComplete, setDriveComplete] = useState(false)
  const [disqualified, setDisqualified] = useState(false)
  const [fullscreenReady, setFullscreenReady] = useState(false)
  const [codingProblems, setCodingProblems] = useState([])
const [currentProblem, setCurrentProblem] = useState(0)
const [codingScores, setCodingScores] = useState({})

  const timerRef = useRef(null)
  const tabSwitchRef = useRef(0)
  const warningCountRef = useRef(0)

  // ── Load session ────────────────────────────────────────────────
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
      const companyData = res.data.companyId
      setCompany(companyData)
      const firstRound = companyData.rounds[0]
      loadQuestions(firstRound.type, firstRound.num_questions, companyData.name)
      setTimeLeft(firstRound.duration_mins * 60)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // ── Load questions ──────────────────────────────────────────────
const loadQuestions = async (type, limit, companyName = '') => {
    if (type === 'coding') {
      await loadCodingProblems(limit, companyName)
      return
    }
    try {
      const res = await axios.get(
        `/api/questions?type=${type}&limit=${limit}&company=${encodeURIComponent(companyName.toLowerCase())}`
      )
      if (res.data.length > 0) {
        setQuestions(res.data)
      } else {
        const samples = SAMPLE_QUESTIONS[type] || SAMPLE_QUESTIONS.aptitude
        setQuestions(samples.slice(0, Math.min(limit, samples.length)))
      }
      setAnswers({})
      setWrittenAnswers({})
      setCurrentQ(0)
    } catch (err) {
      const samples = SAMPLE_QUESTIONS[type] || SAMPLE_QUESTIONS.aptitude
      setQuestions(samples.slice(0, Math.min(limit, samples.length)))
      setAnswers({})
      setWrittenAnswers({})
      setCurrentQ(0)
    }
  }

  const loadCodingProblems = async (limit, companyName = '') => {
    try {
      const res = await axios.get(
        `/api/coding?limit=${limit}&company=${encodeURIComponent(companyName.toLowerCase())}`
      )
      setCodingProblems(res.data)
      setCurrentProblem(0)
      setCodingScores({})
    } catch (err) {
      console.error('Error loading coding problems:', err)
    }
  }

  // ── Timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft <= 0 || roundResult || loading) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          submitRound(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [timeLeft, roundResult, loading])

// ── Tab switch detection ────────────────────────────────────────
  const handleViolation = useCallback(() => {
    if (roundResult || submitting) return
    tabSwitchRef.current += 1
    setTabSwitches(tabSwitchRef.current)
    setShowWarning(true)
    setTimeout(() => setShowWarning(false), 3000)

    // Disqualify after 3 violations
    if (tabSwitchRef.current >= 3) {
      setDisqualified(true)
    }
  }, [roundResult, submitting])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) handleViolation()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [handleViolation])

// ── Fullscreen enforcement ──────────────────────────────────────
  const enterFullscreen = useCallback(() => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (!fullscreenReady) return

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !roundResult && !disqualified && fullscreenReady) {
        handleViolation()
        setTimeout(() => enterFullscreen(), 2000)
      }
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [roundResult, disqualified, handleViolation, fullscreenReady, enterFullscreen])

 // ── ESC key + block shortcuts ───────────────────────────────────
  useEffect(() => {
    const handleKey = (e) => {
      // Emergency exit
      if (e.key === 'Escape') {
        e.preventDefault()
        setShowExit(true)
        return
      }
      // Block Alt+Tab, Alt+F4, Ctrl+W, Ctrl+T, Ctrl+N, Windows key
      if (
        (e.altKey && e.key === 'Tab') ||
        (e.altKey && e.key === 'F4') ||
        (e.ctrlKey && e.key === 'w') ||
        (e.ctrlKey && e.key === 't') ||
        (e.ctrlKey && e.key === 'n') ||
        (e.ctrlKey && e.key === 'Tab') ||
        e.key === 'Meta' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        e.key === 'F12'
      ) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    document.addEventListener('keydown', handleKey, true)
    return () => document.removeEventListener('keydown', handleKey, true)
  }, [])

// ── Window blur detection (catches Alt+Tab on Windows) ──────────
  useEffect(() => {
    const handleBlur = () => {
      if (!document.hidden && !roundResult && !submitting) {
        handleViolation()
      }
    }
    window.addEventListener('blur', handleBlur)
    return () => window.removeEventListener('blur', handleBlur)
  }, [handleViolation, roundResult, submitting])




  // ── Submit round ────────────────────────────────────────────────
  const submitRound = useCallback(async (autoSubmit = false, directScore = null) => {
    if (submitting) return
    clearInterval(timerRef.current)
    setSubmitting(true)

    const round = company?.rounds[currentRound]
    if (!round) return

    // Calculate score
    let score = 0
    const currentRoundType = company?.rounds[currentRound]?.type

      if (currentRoundType === 'coding') {
      if (directScore !== null) {
        score = directScore
      } else {
        const scores = Object.values(codingScores)
        score = scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0
      }
    }  else {
      // MCQ scoring
            // aptitude, technical, hr — all MCQ

      questions.forEach((q, i) => {
        if (answers[i] === q.answer) score++
      })
    }

    const result = calculateResult(score, questions.length, round.cutoff_pct)

  console.log('Round type:', currentRoundType)
  console.log('Answers:', answers)
  console.log('Questions count:', questions.length)
  console.log('Score calculated:', score)

    // Save to backend
    try {
      const token = localStorage.getItem('token')
      await axios.post('/api/drive/submit-round',
        {
          sessionId,
          roundIndex: currentRound,
          score,
          totalQuestions: currentRoundType === 'coding'
            ? codingProblems.length 
            : questions.length > 0 ? questions.length : 5,
          tabSwitches: tabSwitchRef.current,
          percentile: parseFloat(result.percentile),
          passed: result.passed
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    } catch (err) {
      console.error('Error saving round:', err)
    }

    setRoundResult({ ...result, score, total: questions.length })
    setSubmitting(false)
  }, [answers, questions, currentRound, company, sessionId, submitting])

  // ── Go to next round ────────────────────────────────────────────
  const goToNextRound = () => {
    if (!roundResult.passed) {
      navigate(`/results/${sessionId}`)
      return
    }

    const nextRound = currentRound + 1
    if (nextRound >= company.rounds.length) {
      navigate(`/results/${sessionId}`)
      return
    }

    const next = company.rounds[nextRound]
    setCurrentRound(nextRound)
    setRoundResult(null)
    setSubmitting(false)
    setTimeLeft(next.duration_mins * 60)
    loadQuestions(next.type, next.num_questions, company.name)
    tabSwitchRef.current = 0
    setTabSwitches(0)
  }

  // ── Emergency exit ──────────────────────────────────────────────
  const handleEmergencyExit = () => {
    if (document.fullscreenElement) document.exitFullscreen()
    navigate(`/results/${sessionId}`)
  }

  // ── Timer display ───────────────────────────────────────────────
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const timerColor = timeLeft < 60 ? 'text-red-400' :
                     timeLeft < 300 ? 'text-yellow-400' : 'text-green-400'

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-gray-400">Loading exam...</div>
    </div>
  )

  const round = company?.rounds[currentRound]
  const answered = Object.keys(answers).length

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Fullscreen gate — must click to enter */}
      {!fullscreenReady && !loading && (
        <div className="fixed inset-0 bg-gray-950 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-blue-500/50 rounded-2xl p-10 w-full max-w-md mx-4 text-center">
            <div className="text-6xl mb-4">🖥️</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Ready to start?
            </h2>
            <p className="text-gray-400 text-sm mb-2">
              <span className="text-white font-medium">{company?.name}</span> — {round?.name}
            </p>
            <p className="text-gray-400 text-sm mb-8">
              The exam will open in fullscreen mode. Exiting fullscreen or switching tabs counts as a violation.
              <span className="text-red-400"> 3 violations = disqualification.</span>
            </p>
            <div className="bg-gray-800 rounded-xl p-4 mb-6 text-left space-y-2">
              <p className="text-xs text-gray-400 flex items-center gap-2">
                <span className="text-yellow-400">⚠️</span>
                Do not switch tabs or windows during the exam
              </p>
              <p className="text-xs text-gray-400 flex items-center gap-2">
                <span className="text-yellow-400">⚠️</span>
                Do not exit fullscreen mode
              </p>
              <p className="text-xs text-gray-400 flex items-center gap-2">
                <span className="text-green-400">✓</span>
                Press ESC only for genuine emergencies
              </p>
            </div>
            <button
              onClick={() => {
                enterFullscreen()
                setFullscreenReady(true)
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold text-lg transition"
            >
              Enter Fullscreen & Start Exam →
            </button>
          </div>
        </div>
      )}
      {/* Disqualified screen */}
      {disqualified && (
        <DisqualifiedScreen
          tabSwitches={tabSwitches}
          onViewReport={() => navigate(`/results/${sessionId}`)}
        />
      )}

      {/* Tab switch warning */}
      {showWarning && !disqualified && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg animate-pulse text-center">
          <div>⚠️ Violation {tabSwitches} of 3 detected!</div>
          <div className="text-xs mt-1 text-red-200">
            {3 - tabSwitches === 0
              ? 'Disqualifying...'
              : `${3 - tabSwitches} more violation${3 - tabSwitches > 1 ? 's' : ''} will disqualify you`}
          </div>
        </div>
      )}

      {/* Emergency exit modal */}
      {showExit && (
        <EmergencyExit
          onClose={() => setShowExit(false)}
          onExit={handleEmergencyExit}
        />
      )}

      {/* Round result modal */}
      {roundResult && (
        <RoundResult
          result={roundResult}
          roundName={round?.name}
          onNext={goToNextRound}
          isLast={currentRound === company.rounds.length - 1}
          eliminated={!roundResult.passed}
        />
      )}

      {/* Top bar */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="font-bold text-lg">D<span className="text-blue-500">R</span>IVE</span>
          <div className="h-4 w-px bg-gray-700" />
          <span className="text-gray-400 text-sm">{company?.name}</span>
          <div className="h-4 w-px bg-gray-700" />
          <span className="text-white text-sm font-medium">
            Round {currentRound + 1}/{company?.rounds.length}: {round?.name}
          </span>
        </div>
        <div className="flex items-center gap-6">
          {tabSwitches > 0 && (
            <span className="text-red-400 text-sm">
              ⚠️ {tabSwitches} tab switch{tabSwitches > 1 ? 'es' : ''}
            </span>
          )}
          <div className={`font-mono text-xl font-bold ${timerColor}`}>
            {formatTime(timeLeft)}
          </div>
          <button
            onClick={() => setShowExit(true)}
            className="text-xs text-gray-600 hover:text-red-400 transition"
          >
            ESC to exit
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-800">
        <div
          className="h-1 bg-blue-500 transition-all duration-300"
          style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="flex flex-1 overflow-hidden">

          {/* Coding round — full width editor */}
        {round?.type === 'coding' ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            {codingProblems.length > 0 ? (
              <CodeEditor
  problem={codingProblems[currentProblem]}
  problemIndex={currentProblem}
  totalProblems={codingProblems.length}
  onScore={(idx, score) => {
    setCodingScores(prev => ({ ...prev, [idx]: score }))
  }}
  onNext={(lastScore) => {
    if (currentProblem < codingProblems.length - 1) {
      setCurrentProblem(p => p + 1)
    } else {
      // Pass scores directly to avoid stale state
      const allScores = { ...codingScores, [currentProblem]: lastScore }
      const scores = Object.values(allScores)
      const finalScore = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0
      submitRound(false, finalScore)
    }
  }}
  isLast={currentProblem === codingProblems.length - 1}
/>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                Loading problems...
              </div>
            )}
          </div>
        ) : (
          <>
            {/* MCQ Question panel */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-2xl mx-auto">

                {/* Question header */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-gray-400 text-sm">
                    Question {currentQ + 1} of {questions.length}
                  </span>
                  <span className="text-gray-400 text-sm">
                    {answered} answered
                  </span>
                </div>

                {/* Question */}
                {questions[currentQ] && (
                  <div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
                      <p className="text-white text-lg leading-relaxed">
                        {questions[currentQ].text}
                      </p>
                    </div>

                    {/* HR Written Answer */}
                    {/* HR Written Answer - disabled, using MCQ */}
                    {round?.type === 'hr_written' ? (
                      <div>
                        <textarea
                          value={writtenAnswers[currentQ] || ''}
                          onChange={e => setWrittenAnswers({
                            ...writtenAnswers,
                            [currentQ]: e.target.value
                          })}
                          placeholder="Type your answer here... Be specific and use examples from your experience."
                          rows={6}
                          className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-blue-500 transition resize-none"
                        />
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {(writtenAnswers[currentQ] || '').trim().split(/\s+/).filter(Boolean).length} words
                            {' · '}Aim for at least 30 words for a good score
                          </span>
                          {writtenAnswers[currentQ]?.length > 10 && !hrScores[currentQ] && (
                            <button
                              onClick={async () => {
                                setEvaluatingHR(true)
                                try {
                                  const token = localStorage.getItem('token')
                                  const res = await axios.post('/api/feedback/evaluate-hr',
                                    {
                                      question: questions[currentQ].text,
                                      answer: writtenAnswers[currentQ]
                                    },
                                    { headers: { Authorization: `Bearer ${token}` } }
                                  )
                                  setHrScores({ ...hrScores, [currentQ]: res.data.score })
                                } catch (err) {
                                  console.error(err)
                                } finally {
                                  setEvaluatingHR(false)
                                }
                              }}
                              disabled={evaluatingHR}
                              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition"
                            >
                              {evaluatingHR ? 'Evaluating...' : 'Evaluate Answer'}
                            </button>
                          )}
                        </div>

                        {/* HR Score feedback */}
                        {hrScores[currentQ] !== undefined && (
                          <div className={`mt-3 p-3 rounded-lg border text-sm ${
                            hrScores[currentQ] >= 70
                              ? 'bg-green-500/10 border-green-500/30 text-green-400'
                              : hrScores[currentQ] >= 40
                              ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                              : 'bg-red-500/10 border-red-500/30 text-red-400'
                          }`}>
                            Answer score: {hrScores[currentQ]}/100
                          </div>
                        )}
                      </div>
                    ) : (
                      /* MCQ Options */
                      <div className="space-y-3">
                        {questions[currentQ].options?.map((option, i) => (
                          <button
                            key={i}
                            onClick={() => setAnswers({ ...answers, [currentQ]: i })}
                            className={`w-full text-left px-5 py-4 rounded-xl border transition-all ${
                              answers[currentQ] === i
                                ? 'bg-blue-600/20 border-blue-500 text-white'
                                : 'bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white'
                            }`}
                          >
                            <span className={`inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-bold mr-3 ${
                              answers[currentQ] === i ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'
                            }`}>
                              {['A','B','C','D'][i]}
                            </span>
                            {option}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Nav buttons */}
                    <div className="flex justify-between mt-8">
                      <button
                        onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
                        disabled={currentQ === 0}
                        className="px-6 py-2.5 border border-gray-700 text-gray-400 hover:text-white rounded-lg text-sm transition disabled:opacity-30"
                      >
                        ← Previous
                      </button>
                      {currentQ < questions.length - 1 ? (
                        <button
                          onClick={() => setCurrentQ(q => q + 1)}
                          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition"
                        >
                          Next →
                        </button>
                      ) : (
                        <button
                          onClick={() => submitRound(false)}
                          disabled={submitting}
                          className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-lg text-sm transition font-medium"
                        >
                          {submitting ? 'Submitting...' : 'Submit Round ✓'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Question navigator sidebar */}
            <div className="w-56 bg-gray-900 border-l border-gray-800 p-4 overflow-y-auto flex-shrink-0">
              <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">Questions</p>
              <div className="grid grid-cols-5 gap-1.5">
                {questions.map((_, i) => {
                  const isAnswered = round?.type === 'hr'
                    ? writtenAnswers[i]?.length > 0
                    : answers[i] !== undefined
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentQ(i)}
                      className={`w-8 h-8 rounded text-xs font-medium transition ${
                        i === currentQ
                          ? 'bg-blue-600 text-white'
                          : isAnswered
                          ? 'bg-green-600/30 text-green-400 border border-green-600/50'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {i + 1}
                    </button>
                  )
                })}
              </div>
              <div className="mt-4 space-y-2 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-600" />
                  Current
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-600/30 border border-green-600/50" />
                  Answered
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-gray-800" />
                  Not answered
                </div>
              </div>
              

              {/* Submit button in sidebar */}
              <button
                onClick={() => submitRound(false)}
                disabled={submitting}
                className="w-full mt-6 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white py-2 rounded-lg text-xs font-medium transition"
              >
                Submit Round
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
  }