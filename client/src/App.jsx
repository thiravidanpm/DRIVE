import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import DriveConfig from './pages/DriveConfig'
import ExamRoom from './pages/ExamRoom'
import Results from './pages/Results'
import Profile from './pages/Profile'

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/config/:companyId" element={<PrivateRoute><DriveConfig /></PrivateRoute>} />
        <Route path="/exam/:sessionId" element={<PrivateRoute><ExamRoom /></PrivateRoute>} />
        <Route path="/results/:sessionId" element={<PrivateRoute><Results /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  )
}