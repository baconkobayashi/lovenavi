import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import HomePage from './pages/HomePage'
import FirstApproachPage from './pages/FirstApproachPage'
import ResultPage from './pages/ResultPage'
import ReplyInputPage from './pages/ReplyInputPage'
import ReplyResultPage from './pages/ReplyResultPage'
import MyPage from './pages/MyPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/first-approach" element={<FirstApproachPage />} />
      <Route path="/result" element={<ResultPage />} />
      <Route path="/reply" element={<ReplyInputPage />} />
      <Route path="/reply-result" element={<ReplyResultPage />} />
      <Route path="/mypage" element={<MyPage />} />
    </Routes>
  )
}
