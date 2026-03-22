import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const difficultyColor = {
  easy: 'text-green-400 bg-green-400/10',
  medium: 'text-yellow-400 bg-yellow-400/10',
  hard: 'text-red-400 bg-red-400/10'
}

const typeColor = {
  aptitude: 'bg-blue-500/10 text-blue-400',
  technical: 'bg-purple-500/10 text-purple-400',
  coding: 'bg-orange-500/10 text-orange-400',
  hr: 'bg-pink-500/10 text-pink-400'
}

export default function Dashboard() {
  const [companies, setCompanies] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const [customSearch, setCustomSearch] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      const res = await axios.get('/api/companies')
      setCompanies(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  const searchCustomCompany = async () => {
    if (!customSearch.trim()) return
    setSearching(true)
    setSearchError('')
    try {
      const res = await axios.get(`/api/companies/search?name=${encodeURIComponent(customSearch)}`)
      navigate(`/config/${res.data._id}`)
    } catch (err) {
      setSearchError(`No drive configuration found for "${customSearch}". Try: Amazon, Microsoft, Paypal, Walmart, Atlassian`)
    } finally {
      setSearching(false)
    }
  }

  const filtered = companies.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || c.difficulty === filter
    return matchSearch && matchFilter
  })

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="border-b border-gray-800 bg-gray-900 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            D<span className="text-blue-500">R</span>IVE
          </h1>
          <div className="flex items-center gap-4">
              <span className="text-gray-400 text-sm">
                Hey, <span className="text-white font-medium">{user.name}</span>
              </span>
              <button
                onClick={() => navigate('/profile')}
                className="text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition"
              >
                My Profile
              </button>
              <button
                onClick={logout}
              className="text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Choose Your Company</h2>
          <p className="text-gray-400">Select a company to simulate their full placement drive</p>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <input
            type="text"
            placeholder="Search companies..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"
          />
          <div className="flex gap-2">
            {['all', 'easy', 'medium', 'hard'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-900 border border-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{companies.length}</div>
            <div className="text-xs text-gray-500 mt-1">Companies Available</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-400">
              {companies.reduce((sum, c) => sum + c.rounds.length, 0)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Total Rounds</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">
              {companies.reduce((sum, c) => sum + c.rounds.reduce((s, r) => s + r.duration_mins, 0), 0)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Total Minutes</div>
          </div>
        </div>
        {/* Custom company search */}
        <div className="bg-gray-900 border border-blue-500/30 rounded-xl p-5 mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-blue-400 text-lg">🔍</span>
            <div>
              <h3 className="text-white font-medium text-sm">Search Any Company</h3>
              <p className="text-gray-500 text-xs">Enter any company name to simulate their placement drive</p>
            </div>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="eg.. Amazon"
              value={customSearch}
              onChange={e => setCustomSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchCustomCompany()}
              className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"
            />
            <button
              onClick={searchCustomCompany}
              disabled={searching || !customSearch.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-sm font-medium transition"
            >
              {searching ? 'Searching...' : 'Search →'}
            </button>
          </div>
          {searchError && (
            <p className="text-red-400 text-xs mt-2">{searchError}</p>
          )}
        </div>

        {/* Company Grid */}
        {loading ? (
          <div className="text-center text-gray-500 py-20">Loading companies...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-500 py-20">No companies found</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(company => (
              <div
                key={company._id}
                onClick={() => navigate(`/config/${company._id}`)}
                className="bg-gray-900 border border-gray-800 hover:border-blue-500/50 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5 group"
              >
                {/* Company header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img
                      src={company.logo}
                      alt={company.name}
                      className="w-8 h-8 object-contain"
                      onError={e => {
                        e.target.style.display = 'none'
                        e.target.parentElement.innerHTML = `<span class="text-gray-900 font-bold text-sm">${company.name[0]}</span>`
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-blue-400 transition">
                      {company.name}
                    </h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${difficultyColor[company.difficulty]}`}>
                      {company.difficulty}
                    </span>
                  </div>
                </div>

                {/* Rounds */}
                <div className="space-y-1.5 mb-4">
                  {company.rounds.map((round, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 text-xs w-4">{i + 1}.</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${typeColor[round.type]}`}>
                          {round.type}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">{round.duration_mins}m</span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {company.rounds.length} rounds · {company.rounds.reduce((s, r) => s + r.duration_mins, 0)} min
                  </span>
                  <span className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition">
                    Start →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}