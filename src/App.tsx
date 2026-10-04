import { LoadingScreen } from './components/LoadingScreen'
import { Dashboard } from './features/dashboard/Dashboard'
import { LoginView } from './features/auth/LoginView'
import { OperationForm } from './features/operations/OperationForm'
import { OperationSelector } from './features/operations/OperationSelector'
import { SettingsView } from './features/settings/SettingsView'
import { useApp } from './hooks/useApp'

export default function App() {
  const { view, userId, authLoading } = useApp()

  if (authLoading) return <LoadingScreen />
  if (!userId) return <LoginView />

  if (view === 'form') return <OperationForm />
  if (view === 'dashboard') return <Dashboard />
  if (view === 'settings') return <SettingsView />
  return <OperationSelector />
}
