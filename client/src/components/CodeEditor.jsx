import { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import axios from 'axios'

const LANGUAGES = [
  { id: 'python',     label: 'Python',     monacoId: 'python'     },
  { id: 'javascript', label: 'JavaScript', monacoId: 'javascript' },
  { id: 'java',       label: 'Java',       monacoId: 'java'       },
  { id: 'cpp',        label: 'C++',        monacoId: 'cpp'        }
]

export default function CodeEditor({ problem, problemIndex, totalProblems, onScore, onNext, isLast }) {
  const [language, setLanguage]     = useState('python')
  const [code, setCode]             = useState('')
  const [running, setRunning]       = useState(false)
  const [results, setResults]       = useState(null)
  const [score, setScore]           = useState(null)

  useEffect(() => {
    if (problem?.starterCode) {
      setCode(problem.starterCode[language] || '')
      setResults(null)
      setScore(null)
    }
  }, [problem, language])

  const runCode = async () => {
    if (!code.trim()) return
    setRunning(true)
    setResults(null)
    try {
      const token = localStorage.getItem('token')
      const res = await axios.post('/api/coding/run',
        { code, language, problemId: problem._id },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setResults(res.data.results)
      setScore(res.data.score)
      onScore(problemIndex, res.data.score)
    } catch (err) {
      setResults([{
        passed: false,
        status: 'Error',
        actualOutput: err.response?.data?.msg || 'Server error'
      }])
    } finally {
      setRunning(false)
    }
  }

  if (!problem) return null

  return (
    <div className="flex flex-col h-full">

      {/* Problem header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-800 flex-shrink-0">
        <div>
          <span className="text-gray-500 text-xs">Problem {problemIndex + 1}/{totalProblems}</span>
          <h3 className="text-white font-semibold">{problem.title}</h3>
        </div>
        <div className="flex items-center gap-3">
          {/* Language selector */}
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none"
          >
            {LANGUAGES.map(l => (
              <option key={l.id} value={l.id}>{l.label}</option>
            ))}
          </select>
          <button
            onClick={runCode}
            disabled={running}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2"
          >
            {running ? (
              <>
                <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Running...
              </>
            ) : '▶ Run Code'}
          </button>
            {score !== null && (
  <button
    onClick={() => onNext(score)}
    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition"
  >
    {isLast ? 'Submit Round →' : 'Next Problem →'}
  </button>
)}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* Left — Problem description */}
        <div className="w-80 border-r border-gray-800 overflow-y-auto p-5 flex-shrink-0">
          <div className="mb-4">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              problem.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
              problem.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>{problem.difficulty}</span>
          </div>

          <p className="text-gray-300 text-sm leading-relaxed mb-5">
            {problem.description}
          </p>

          <div className="space-y-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Examples</p>
            {problem.examples?.map((ex, i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-3 text-xs font-mono">
                <div className="text-gray-400 mb-1">Input: <span className="text-white">{ex.input}</span></div>
                <div className="text-gray-400 mb-1">Output: <span className="text-white">{ex.output}</span></div>
                {ex.explanation && <div className="text-gray-500">{ex.explanation}</div>}
              </div>
            ))}
          </div>

          {/* Test results */}
          {results && (
            <div className="mt-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Test Results — {results.filter(r => r.passed).length}/{results.length} passed
              </p>
              <div className="space-y-2">
                {results.map((r, i) => (
                  <div key={i} className={`rounded-lg p-3 text-xs border ${
                    r.passed
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                  }`}>
                    <div className={`font-medium mb-1 ${r.passed ? 'text-green-400' : 'text-red-400'}`}>
                      {r.passed ? '✓ Passed' : '✗ Failed'} — {r.status}
                    </div>
                    <div className="font-mono text-gray-400">
                      <div>Input: {r.input}</div>
                      <div>Expected: {r.expectedOutput}</div>
                      {!r.passed && <div className="text-red-400">Got: {r.actualOutput || 'No output'}</div>}
                    </div>
                    {r.stderr && <div className="text-red-400 mt-1">{r.stderr}</div>}
                  </div>
                ))}
              </div>

              {score !== null && (
                <div className={`mt-3 p-3 rounded-lg text-center font-semibold ${
                  score === 100 ? 'bg-green-500/20 text-green-400' :
                  score >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  Score: {score}/100
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right — Code editor */}
        <div className="flex-1 overflow-hidden">
          <Editor
            height="100%"
            language={LANGUAGES.find(l => l.id === language)?.monacoId || 'python'}
            value={code}
            onChange={val => setCode(val || '')}
            theme="vs-dark"
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
              padding: { top: 16 }
            }}
          />
        </div>
      </div>
    </div>
  )
}