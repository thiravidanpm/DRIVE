import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

const typeColor = {
  aptitude:  { bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/30'   },
  technical: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  coding:    { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  hr:        { bg: 'bg-pink-500/10',   text: 'text-pink-400',   border: 'border-pink-500/30'   }
}

const typeIcon = {
  aptitude:  '🧮',
  technical: '💻',
  coding:    '⌨️',
  hr:        '🤝'
}

export default function DriveConfig() {
  const { companyId } = useParams()
  const navigate = useNavigate()
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    fetchCompany()
  }, [companyId])

  const fetchCompany = async () => {
    try {
      const res = await axios.get(`/api/companies/${companyId}`)
      setCompany(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const startDrive = async () => {
    setStarting(true)
    try {
      const token = localStorage.getItem('token')
      const res = await axios.post('/api/drive/start',
        { companyId, rounds: company.rounds },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      navigate(`/exam/${res.data._id}`)
    } catch (err) {
      console.error(err)
      alert('Failed to start drive. Please try again.')
    } finally {
      setStarting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-gray-400">Loading...</div>
    </div>
  )

  if (!company) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-gray-400">Company not found</div>
    </div>
  )

  const totalMins = company.rounds.reduce((s, r) => s + r.duration_mins, 0)
  const hours = Math.floor(totalMins / 60)
  const mins = totalMins % 60

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="border-b border-gray-800 bg-gray-900 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-white transition text-sm flex items-center gap-2"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold">
            D<span className="text-blue-500">R</span>IVE
          </h1>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Company header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center overflow-hidden">
            <img
              src={company.logo}
              alt={company.name}
              className="w-10 h-10 object-contain"
              onError={e => {
                e.target.style.display = 'none'
                e.target.parentElement.innerHTML = `<span class="text-gray-900 font-bold text-xl">${company.name[0]}</span>`
              }}
            />
          </div>
          <div>
            <h2 className="text-3xl font-bold">{company.name}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-gray-400 text-sm">{company.rounds.length} rounds</span>
              <span className="text-gray-600">·</span>
              <span className="text-gray-400 text-sm">{hours}h {mins}m total</span>
              <span className="text-gray-600">·</span>
              <span className={`text-sm font-medium capitalize ${
                company.difficulty === 'easy' ? 'text-green-400' :
                company.difficulty === 'medium' ? 'text-yellow-400' : 'text-red-400'
              }`}>{company.difficulty}</span>
            </div>
          </div>
        </div>

        {/* Warning banner */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-8 flex items-start gap-3">
          <span className="text-yellow-400 text-lg">⚠️</span>
          <div>
            <p className="text-yellow-400 font-medium text-sm">Real Drive Conditions Apply</p>
            <p className="text-yellow-400/70 text-xs mt-1">
              Once started, tab switching will be monitored and logged. Exiting fullscreen will trigger warnings.
              The drive simulates real placement conditions — treat it seriously.
            </p>
          </div>
        </div>

        {/* Rounds timeline */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Drive Structure</h3>
          <div className="space-y-3">
            {company.rounds.map((round, i) => {
              const colors = typeColor[round.type]
              return (
                <div
                  key={i}
                  className={`${colors.bg} border ${colors.border} rounded-xl p-4 flex items-center justify-between`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-xs font-bold ${colors.text}`}>
                      {i + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{typeIcon[round.type]}</span>
                        <span className="font-medium text-white">{round.name}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-xs capitalize ${colors.text}`}>{round.type}</span>
                        <span className="text-gray-600 text-xs">·</span>
                        <span className="text-gray-400 text-xs">{round.num_questions} questions</span>
                        <span className="text-gray-600 text-xs">·</span>
                        <span className="text-gray-400 text-xs">{round.duration_mins} minutes</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${colors.text}`}>
                      Cutoff: {round.cutoff_pct}%
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">to proceed</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Rules */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-8">
          <h3 className="font-semibold mb-3 text-white">Rules & Guidelines</h3>
          <div className="space-y-2">
            {[
              'You must score above the cutoff percentage in each round to proceed',
              'Tab switching is monitored — each switch is logged and shown in your report',
              'Each round is strictly time-bound — it auto-submits when time runs out',
              'You cannot go back to a previous round once submitted',
              'Emergency exit: press ESC then enter code DRIVE-EXIT to end the session',
              'AI feedback will be generated after completing all rounds'
            ].map((rule, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-gray-400">
                <span className="text-blue-500 mt-0.5 flex-shrink-0">→</span>
                {rule}
              </div>
            ))}
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={startDrive}
          disabled={starting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition text-lg"
        >
          {starting ? 'Starting Drive...' : `Start ${company.name} Placement Drive →`}
        </button>

        <p className="text-center text-gray-600 text-xs mt-3">
          By starting, you agree to simulate real placement drive conditions
        </p>
      </div>
    </div>
  )
}