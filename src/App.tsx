import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import CreateTournament from './pages/CreateTournament'
import TournamentDetails from './pages/TournamentDetails'
import EditTournament from './pages/EditTournament'
import Leaderboard from './pages/Leaderboard'
import Matches from './pages/Matches'
import TournamentMatches from './pages/TournamentMatches'
import TournamentLeaderboard from './pages/TournamentLeaderboard'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import LoadingScreen from './components/LoadingScreen'

function App() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="*" element={<Navigate to="/sign-in" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/create-tournament" element={<CreateTournament />} />
      <Route path="/tournament/:id" element={<TournamentDetails />} />
      <Route path="/tournament/:id/matches" element={<TournamentMatches />} />
      <Route path="/tournament/:id/leaderboard" element={<TournamentLeaderboard />} />
      <Route path="/edit-tournament/:id" element={<EditTournament />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/matches" element={<Matches />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
