
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import { ToastProvider } from './components/Toast'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import UsersPage from './pages/UsersPage'
import SplitsPage from './pages/SplitsPage'
import ExercisesPage from './pages/ExercisesPage'
import ExerciseRequestsPage from './pages/ExerciseRequestsPage'
import CreateExercisePage from './pages/CreateExercisePage'
import ActivityPage from './pages/ActivityPage'
import NotificationsPage from './pages/NotificationsPage'
import SettingsPage from './pages/SettingsPage'
import OnboardingPage from './pages/OnboardingPage'
import { getAdminKey } from './api'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/users': 'Users',
  '/splits': 'Splits',
  '/exercises': 'Exercises',
  '/exercise-requests': 'Exercise Requests',
  '/create-exercise': 'Create Exercise',
  '/activity': 'Live Activity',
  '/notifications': 'Notifications',
  '/settings': 'Settings',
  '/onboarding': 'Onboarding Analytics',
}

function ProtectedLayout() {
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] || 'Ryze Admin'

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-title">{title}</div>
          <div className="topbar-right">
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 6px var(--success)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>API Online</span>
          </div>
        </header>
        <main className="page-content">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/splits" element={<SplitsPage />} />
            <Route path="/exercises" element={<ExercisesPage />} />
            <Route path="/exercise-requests" element={<ExerciseRequestsPage />} />
            <Route path="/create-exercise" element={<CreateExercisePage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function AuthGuard() {
  const hasKey = !!getAdminKey()
  return hasKey ? <ProtectedLayout /> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<AuthGuard />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}
