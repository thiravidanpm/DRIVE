import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function Profile() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await axios.get('/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setData(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-gray-400">Loading profile...</div>
    </div>
  )

  const { user, stats, sessions, companyStats } = data

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="border-b border-gray-800 bg-gray-900 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-400 hover:text-white text-sm transition"
            >
              ← Dashboard
            </button>
            <h1 className="text-xl font-bold">
              D<span className="text-blue-500">R</span>IVE
            </h1>
          </div>
          <span className="text-gray-400 text-sm">My Profile</span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Profile header */}
        <div className="flex items-center gap-5 mb-10">
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold text-white">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-gray-400 text-sm mt-0.5">{user.email}</p>
            <p className="text-gray-500 text-xs mt-1">
              Member since {new Date(user.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center">
            <div className="text-3xl font-bold text-blue-400">{stats.totalDrives}</div>
            <div className="text-xs text-gray-500 mt-1">Drives Taken</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center">
            <div className="text-3xl font-bold text-green-400">{stats.avgScore}%</div>
            <div className="text-xs text-gray-500 mt-1">Avg Score</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center">
            <div className="text-3xl font-bold text-purple-400">{stats.bestScore}%</div>
            <div className="text-xs text-gray-500 mt-1">Best Score</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center">
            <div className={`text-3xl font-bold ${stats.totalViolations > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {stats.totalViolations}
            </div>
            <div className="text-xs text-gray-500 mt-1">Tab Violations</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Company performance */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Company Performance</h3>
            {companyStats.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500 text-sm">
                No drives completed yet
              </div>
            ) : (
              <div className="space-y-3">
                {companyStats
                  .sort((a, b) => b.bestScore - a.bestScore)
                  .map((c, i) => (
                  <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <img
                        src={c.logo}
                        alt={c.name}
                        className="w-8 h-8 object-contain"
                        onError={e => {
                          e.target.style.display = 'none'
                          e.target.parentElement.innerHTML = `<span class="text-gray-900 font-bold text-sm">${c.name[0]}</span>`
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{c.name}</span>
                        <span className={`text-sm font-bold ${
                          c.bestScore >= 70 ? 'text-green-400' :
                          c.bestScore >= 50 ? 'text-yellow-400' : 'text-red-400'
                        }`}>{c.bestScore}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            c.bestScore >= 70 ? 'bg-green-500' :
                            c.bestScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${c.bestScore}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {c.attempts} attempt{c.attempts > 1 ? 's' : ''} · Best score
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Drive history */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Drive History</h3>
            {sessions.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500 text-sm">
                No drives taken yet.{' '}
                <button onClick={() => navigate('/dashboard')} className="text-blue-400 hover:underline">
                  Start your first drive →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session, i) => {
                  const completedRounds = session.rounds.filter(r => r.completedAt)
                  const passed = session.rounds.filter(r => r.passed).length
                  const avgScore = completedRounds.length > 0
                    ? Math.round(completedRounds.reduce((s, r) => {
                        const pct = r.totalQuestions > 0
                          ? Math.min(100, (r.score / r.totalQuestions) * 100)
                          : 0
                        return s + pct
                      }, 0) / completedRounds.length)
                    : 0
                  const violations = completedRounds.reduce((s, r) =>
                    s + (r.tabSwitches || 0), 0)

                  return (
                    <div
                      key={i}
                      onClick={() => navigate(`/results/${session._id}`)}
                      className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl p-4 cursor-pointer transition group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm group-hover:text-blue-400 transition">
                            {session.companyId?.name || 'Unknown'}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            session.status === 'completed'
                              ? 'bg-green-500/20 text-green-400'
                              : session.status === 'eliminated'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {session.status === 'completed' ? 'Completed' :
                             session.status === 'eliminated' ? 'Eliminated' : 'Active'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(session.startedAt).toLocaleDateString('en-IN')}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>{completedRounds.length} round{completedRounds.length !== 1 ? 's' : ''}</span>
                        <span className="text-gray-600">·</span>
                        <span className={avgScore >= 70 ? 'text-green-400' : avgScore >= 50 ? 'text-yellow-400' : 'text-red-400'}>
                          {avgScore}% avg
                        </span>
                        <span className="text-gray-600">·</span>
                        <span>{passed} cleared</span>
                        {violations > 0 && (
                          <>
                            <span className="text-gray-600">·</span>
                            <span className="text-red-400">{violations} violations</span>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Start new drive CTA */}
        <div className="mt-10 text-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium transition"
          >
            Start New Drive →
          </button>
        </div>
      </div>
    </div>
  )
}