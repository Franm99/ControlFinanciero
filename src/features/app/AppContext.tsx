import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type {
  AppUser,
  AppView,
  Operation,
  OperationDraft,
  OperationType,
  RecurrentOperation,
  RecurrentOperationDraft,
  Source,
  UserSettings,
} from '../../types'
import {
  add_operation as persistOperation,
  add_recurrent_operation as persistRecurrentOperation,
  combine_operations as persistCombinedOperation,
  delete_operation as removeOperation,
  delete_recurrent_operation as removeRecurrentOperation,
  get_operations,
  get_recurrent_operations,
  get_sources,
  get_user_settings,
  get_users,
  isSupabaseConfigured,
  save_user_settings,
  supabase,
  toggle_recurrent_operation as persistRecurrentStatus,
  update_operation as persistOperationUpdate,
} from '../../services/supabase'

const DEMO_USERS: AppUser[] = [
  { id: 'fran.moreno.se@gmail.com', email: 'fran.moreno.se@gmail.com', name: 'Fran' },
  { id: 'paulaval214@gmail.com', email: 'paulaval214@gmail.com', name: 'Paula' },
]

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
  recurrentOperations: RecurrentOperation[]
  settings: UserSettings
  users: AppUser[]
  userId: string | null
  userEmail: string | null
  userName: string | null
  authLoading: boolean
  navigate: (view: AppView) => void
  startOperation: (type: OperationType) => void
  submitOperation: (draft: OperationDraft, recurrentDraft?: RecurrentOperationDraft) => Promise<void>
  updateOperation: (id: string, changes: Pick<OperationDraft, 'amount' | 'date' | 'category' | 'subcategory' | 'description'>) => Promise<void>
  deleteOperation: (id: string) => Promise<void>
  combineOperations: (ids: string[]) => Promise<void>
  toggleRecurrentOperation: (id: string, isActive: boolean) => Promise<void>
  deleteRecurrentOperation: (id: string) => Promise<void>
  updateDefaultSource: (sourceId: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const AppContext = createContext<AppContextValue | null>(null)

function operationDraft(operation: Operation): OperationDraft {
  const { id: _id, creation_date: _creationDate, ...draft } = operation
  return draft
}

function applyBalance(sources: Source[], operation: OperationDraft, direction = 1): Source[] {
  const sourceId = String(operation.source_id)
  const destinationSourceId = operation.destination_source_id == null
    ? null
    : String(operation.destination_source_id)

  return sources.map((source) => {
    const currentSourceId = String(source.id)
    if (currentSourceId === sourceId) {
      const delta = operation.type === 'income' ? operation.amount : -operation.amount
      return { ...source, balance: source.balance + (delta * direction) }
    }
    if (operation.type === 'transfer' && currentSourceId === destinationSourceId) {
      return { ...source, balance: source.balance + (operation.amount * direction) }
    }
    return source
  })
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<AppView>('selector')
  const [selectedType, setSelectedType] = useState<OperationType>('expense')
  const [sources, setSources] = useState<Source[]>(DEMO_SOURCES)
  const [operations, setOperations] = useState<Operation[]>([])
  const [recurrentOperations, setRecurrentOperations] = useState<RecurrentOperation[]>([])
  const [users, setUsers] = useState<AppUser[]>(DEMO_USERS)
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
          const [remoteSources, remoteOperations, remoteRecurrentOperations, remoteSettings, remoteUsers] = await Promise.all([
            get_sources(), get_operations(), get_recurrent_operations(), get_user_settings(), get_users(),
          ])
          setSources(remoteSources)
          setOperations(remoteOperations)
          setRecurrentOperations(remoteRecurrentOperations)
          setUsers(remoteUsers)
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
      const [remoteSources, remoteOperations, remoteRecurrentOperations, remoteSettings, remoteUsers] = await Promise.all([
        get_sources(), get_operations(), get_recurrent_operations(), get_user_settings(), get_users(),
      ])
      setSources(remoteSources)
      setOperations(remoteOperations)
      setRecurrentOperations(remoteRecurrentOperations)
      setUsers(remoteUsers)
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
    setRecurrentOperations([])
    setView('selector')
  }

  const submitOperation = async (draft: OperationDraft, recurrentDraft?: RecurrentOperationDraft) => {
    const operation = isSupabaseConfigured
      ? await persistOperation(draft)
      : { ...draft, id: crypto.randomUUID(), creation_date: new Date().toISOString() }
    const recurrentOperation = recurrentDraft
      ? isSupabaseConfigured
        ? await persistRecurrentOperation(recurrentDraft)
        : { ...recurrentDraft, id: crypto.randomUUID() }
      : null

    setOperations((current) => [operation, ...current])
    if (recurrentOperation) setRecurrentOperations((current) => [...current, recurrentOperation])
    setSources((current) => applyBalance(current, draft))
    setView('dashboard')
  }

  const assertOwnedOperation = (operation: Operation | undefined) => {
    if (!operation) throw new Error('No se encontró la operación.')
    if (String(operation.created_by) !== String(userId)) {
      throw new Error('Solo puedes modificar tus propias operaciones.')
    }
    return operation
  }

  const updateOperation = async (
    id: string,
    changes: Pick<OperationDraft, 'amount' | 'date' | 'category' | 'subcategory' | 'description'>,
  ) => {
    const current = assertOwnedOperation(operations.find((operation) => String(operation.id) === String(id)))
    const nextDraft = { ...operationDraft(current), ...changes }
    const updated = isSupabaseConfigured
      ? await persistOperationUpdate(id, changes)
      : { ...current, ...changes }

    setOperations((items) => items.map((item) => String(item.id) === String(id) ? updated : item))
    setSources((items) => applyBalance(applyBalance(items, operationDraft(current), -1), nextDraft))
  }

  const deleteOperation = async (id: string) => {
    const current = assertOwnedOperation(operations.find((operation) => String(operation.id) === String(id)))
    if (isSupabaseConfigured) await removeOperation(id)
    setOperations((items) => items.filter((item) => String(item.id) !== String(id)))
    setSources((items) => applyBalance(items, operationDraft(current), -1))
  }

  const combineOperations = async (ids: string[]) => {
    const selected = ids.map((id) => assertOwnedOperation(
      operations.find((operation) => String(operation.id) === String(id)),
    ))
    if (selected.length < 2) throw new Error('Selecciona al menos dos operaciones.')
    const first = selected[0]
    const compatible = selected.every((operation) => (
      operation.type !== 'transfer'
      && String(operation.source_id) === String(first.source_id)
    ))
    if (first.type === 'transfer' || !compatible) {
      throw new Error('Las operaciones deben compartir cuenta y no pueden ser transferencias.')
    }

    const signedAmount = selected.reduce((sum, operation) => (
      sum + (operation.type === 'income' ? operation.amount : -operation.amount)
    ), 0)
    const isZeroResult = Math.abs(signedAmount) < 0.005
    const resultType = signedAmount > 0 ? 'income' : 'expense'
    const dominantOperation = isZeroResult
      ? null
      : selected
        .filter((operation) => operation.type === resultType)
        .reduce((largest, operation) => operation.amount > largest.amount ? operation : largest)
    const descriptions = new Set(selected.map((operation) => operation.description?.trim() ?? ''))
    const draft: OperationDraft | null = dominantOperation ? {
      type: resultType,
      amount: Math.abs(signedAmount),
      source_id: first.source_id,
      category: dominantOperation.category,
      subcategory: dominantOperation.subcategory,
      date: selected.reduce((oldest, operation) => operation.date < oldest ? operation.date : oldest, first.date),
      description: descriptions.size === 1 ? first.description : undefined,
      created_by: userId ?? '',
    } : null
    const combined = isSupabaseConfigured
      ? await persistCombinedOperation(ids, draft)
      : draft ? { ...draft, id: crypto.randomUUID(), creation_date: new Date().toISOString() } : null
    const selectedIds = new Set(ids.map(String))
    setOperations((items) => [
      ...(combined ? [combined] : []),
      ...items.filter((item) => !selectedIds.has(String(item.id))),
    ])
    setSources((items) => {
      const reverted = selected.reduce(
        (currentSources, operation) => applyBalance(currentSources, operationDraft(operation), -1),
        items,
      )
      return draft ? applyBalance(reverted, draft) : reverted
    })
  }

  const toggleRecurrentOperation = async (id: string, isActive: boolean) => {
    if (isSupabaseConfigured) await persistRecurrentStatus(id, isActive)
    setRecurrentOperations((current) => current.map((item) => (
      item.id === id ? { ...item, is_active: isActive } : item
    )))
  }

  const deleteRecurrentOperation = async (id: string) => {
    if (isSupabaseConfigured) await removeRecurrentOperation(id)
    setRecurrentOperations((current) => current.filter((item) => item.id !== id))
  }

  const updateDefaultSource = async (sourceId: string) => {
    const next = { user_id: userId ?? '', default_source_id: sourceId }
    setSettings(next)
    if (isSupabaseConfigured) await save_user_settings(next)
  }

  const userName = users.find((user) => user.id === userId || user.email === userEmail)?.name ?? null

  const value = useMemo(() => ({
    view, selectedType, sources, operations, recurrentOperations, settings, users, userId, userEmail, userName, authLoading,
    navigate: setView, startOperation, submitOperation, updateOperation, deleteOperation, combineOperations,
    toggleRecurrentOperation, deleteRecurrentOperation, updateDefaultSource, login, logout,
  }), [view, selectedType, sources, operations, recurrentOperations, settings, users, userId, userEmail, userName, authLoading])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
