import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/AuthContext'
import LandingPage from './pages/LandingPage'
import HomePage from './pages/HomePage'
import FirstApproachPage from './pages/FirstApproachPage'
import ResultPage from './pages/ResultPage'
import ReplyInputPage from './pages/ReplyInputPage'
import ReplyResultPage from './pages/ReplyResultPage'
import MyPage from './pages/MyPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/home"
        element={
          <PrivateRoute>
            <HomePage />
          </PrivateRoute>
        }
      />
      <Route
        path="/first-approach"
        element={
          <PrivateRoute>
            <FirstApproachPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/result"
        element={
          <PrivateRoute>
            <ResultPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/reply"
        element={
          <PrivateRoute>
            <ReplyInputPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/reply-result"
        element={
          <PrivateRoute>
            <ReplyResultPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/mypage"
        element={
          <PrivateRoute>
            <MyPage />
          </PrivateRoute>
        }
      />
    </Routes>
  )
}
