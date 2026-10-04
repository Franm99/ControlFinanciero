import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AppView, Operation, OperationDraft, OperationType, Source, UserSettings } from '../../types'
import {
  add_operation as persistOperation,
  get_operations,
  get_sources,
  get_user_settings,
  isSupabaseConfigured,
  save_user_settings,
  supabase,
} from '../../services/supabase'

const DEMO_SOURCES: Source[] = [
  { id: 'shared-bank', name: 'Cuenta común', balance: 2840.5, description: 'Gastos del hogar', owner: '' },
  { id: 'cash', name: 'Efectivo', balance: 185, description: 'Dinero en casa', owner: '' },
  { id: 'savings', name: 'Ahorro', balance: 6200, description: 'Fondo compartido', owner: '' },
]

type AppContextValue = {
  view: AppView
  selectedType: OperationType
  sources: Source[]
  operations: Operation[]
  settings: UserSettings
  userId: string | null
  userEmail: string | null
  authLoading: boolean
  navigate: (view: AppView) => void
  startOperation: (type: OperationType) => void
  submitOperation: (draft: OperationDraft) => Promise<void>
  updateDefaultSource: (sourceId: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const AppContext = createContext<AppContextValue | null>(null)

function applyBalance(sources: Source[], operation: OperationDraft): Source[] {
  return sources.map((source) => {
    if (source.id === operation.source_id) {
      const delta = operation.type === 'income' ? operation.amount : -operation.amount
      return { ...source, balance: source.balance + delta }
    }
    if (operation.type === 'transfer' && source.id === operation.destination_source_id) {
      return { ...source, balance: source.balance + operation.amount }
    }
    return source
  })
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<AppView>('selector')
  const [selectedType, setSelectedType] = useState<OperationType>('expense')
  const [sources, setSources] = useState<Source[]>(DEMO_SOURCES)
  const [operations, setOperations] = useState<Operation[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [settings, setSettings] = useState<UserSettings>({ user_id: '', default_source_id: DEMO_SOURCES[0].id })

  useEffect(() => {
    async function restoreSession() {
      if (supabase) {
        const { data } = await supabase.auth.getSession()
        if (data.session?.user) {
          setUserId(data.session.user.id)
          setUserEmail(data.session.user.email ?? null)
          const [remoteSources, remoteOperations, remoteSettings] = await Promise.all([
            get_sources(), get_operations(), get_user_settings(),
          ])
          setSources(remoteSources)
          setOperations(remoteOperations)
          if (remoteSettings) setSettings(remoteSettings)
        }
      } else {
        const email = localStorage.getItem('household-demo-session')
        if (email) {
          setUserId(email)
          setUserEmail(email)
          setSettings((current) => ({ ...current, user_id: email }))
        }
      }
      setAuthLoading(false)
    }
    void restoreSession().catch(() => setAuthLoading(false))
  }, [])

  const startOperation = (type: OperationType) => {
    setSelectedType(type)
    setView('form')
  }

  const login = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase()
    const allowed = ((import.meta.env.VITE_ALLOWED_EMAILS as string | undefined) ?? '')
      .split(',').map((item) => item.trim().toLowerCase()).filter(Boolean)
    if (allowed.length && !allowed.includes(normalizedEmail)) throw new Error('Este correo no tiene acceso a este hogar.')

    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
      if (error) throw error
      if (!data.user) throw new Error('No se pudo iniciar sesión.')
      setUserId(data.user.id)
      setUserEmail(data.user.email ?? normalizedEmail)
      const [remoteSources, remoteOperations, remoteSettings] = await Promise.all([
        get_sources(), get_operations(), get_user_settings(),
      ])
      setSources(remoteSources)
      setOperations(remoteOperations)
      setSettings(remoteSettings ?? { user_id: data.user.id, default_source_id: remoteSources[0]?.id ?? '' })
    } else {
      localStorage.setItem('household-demo-session', normalizedEmail)
      setUserId(normalizedEmail)
      setUserEmail(normalizedEmail)
      setSettings((current) => ({ ...current, user_id: normalizedEmail }))
    }
  }

  const logout = async () => {
    if (supabase) await supabase.auth.signOut()
    localStorage.removeItem('household-demo-session')
    setUserId(null)
    setUserEmail(null)
    setView('selector')
  }

  const submitOperation = async (draft: OperationDraft) => {
    const operation = isSupabaseConfigured
      ? await persistOperation(draft)
      : { ...draft, id: crypto.randomUUID(), creation_date: new Date().toISOString() }
    setOperations((current) => [operation, ...current])
    setSources((current) => applyBalance(current, draft))
    setView('dashboard')
  }

  const updateDefaultSource = async (sourceId: string) => {
    const next = { user_id: userId ?? '', default_source_id: sourceId }
    setSettings(next)
    if (isSupabaseConfigured) await save_user_settings(next)
  }

  const value = useMemo(() => ({
    view, selectedType, sources, operations, settings, userId, userEmail, authLoading,
    navigate: setView, startOperation, submitOperation, updateDefaultSource, login, logout,
  }), [view, selectedType, sources, operations, settings, userId, userEmail, authLoading])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
