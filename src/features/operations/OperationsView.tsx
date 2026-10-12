import { useMemo, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from 'react'
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowRightLeft,
  ArrowUpRight,
  Check,
  Filter,
  LoaderCircle,
  Pencil,
  Trash2,
  X,
} from 'lucide-react'
import { CATEGORIES } from '../../data/categories'
import { useApp } from '../../hooks/useApp'
import { supportsOperationType, type Operation, type OperationDraft } from '../../types'

const money = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })
const dateFormatter = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
const TYPE_LABELS = { income: 'Ingreso', expense: 'Gasto', transfer: 'Transferencia' }

function localDate(value: Date) {
  return new Date(value.getTime() - value.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

function currentMonthRange() {
  const now = new Date()
  return {
    from: localDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: localDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  }
}

function dateValue(value: string) {
  return value.slice(0, 10)
}

function categoryName(id: string) {
  return CATEGORIES.find((category) => category.id === id)?.name ?? id
}

function subcategoryName(categoryId: string, subcategoryId?: string) {
  if (!subcategoryId) return 'Sin subcategoría'
  return CATEGORIES.find((category) => category.id === categoryId)
    ?.subcategories.find((subcategory) => subcategory.id === subcategoryId)?.name ?? subcategoryId
}

function TypeIcon({ operation }: { operation: Operation }) {
  const className = operation.type === 'income'
    ? 'bg-moss/10 text-moss'
    : operation.type === 'expense'
      ? 'bg-coral/10 text-coral'
      : 'bg-blue-50 text-blue-700'
  return <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${className}`}>
    {operation.type === 'income' ? <ArrowDownLeft size={20} /> : operation.type === 'expense' ? <ArrowUpRight size={20} /> : <ArrowRightLeft size={20} />}
  </span>
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-0 sm:items-center sm:p-5" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <div className="safe-bottom max-h-[90vh] w-full overflow-y-auto rounded-t-[2rem] bg-paper p-5 shadow-2xl sm:max-w-lg sm:rounded-[2rem]">{children}</div>
  </div>
}

function EditOperationDialog({ operation, onClose }: { operation: Operation; onClose: () => void }) {
  const { updateOperation } = useApp()
  const [amount, setAmount] = useState(String(operation.amount).replace('.', ','))
  const [date, setDate] = useState(dateValue(operation.date))
  const [category, setCategory] = useState(operation.category)
  const [subcategory, setSubcategory] = useState(operation.subcategory ?? '')
  const [description, setDescription] = useState(operation.description ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const availableSubcategories = CATEGORIES.find((item) => item.id === category)?.subcategories
    .filter((item) => supportsOperationType(item, operation.type)) ?? []

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const numericAmount = Number(amount.replace(',', '.'))
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return setError('Introduce una cantidad mayor que cero.')
    setBusy(true)
    setError('')
    try {
      await updateOperation(String(operation.id), {
        amount: numericAmount,
        date: new Date(`${date}T12:00:00`).toISOString(),
        category: operation.type === 'transfer' ? operation.category : category,
        subcategory: operation.type === 'transfer' || !subcategory ? undefined : subcategory,
        description: description.trim() || undefined,
      })
      onClose()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo actualizar la operación.')
      setBusy(false)
    }
  }

  return <Modal onClose={onClose}>
    <div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-moss">Editar</p><h2 className="font-display text-2xl font-extrabold">{TYPE_LABELS[operation.type]}</h2></div><button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full bg-black/5" aria-label="Cerrar"><X size={21} /></button></div>
    <form onSubmit={submit} className="space-y-4">
      <div><label className="label" htmlFor="edit-amount">Cantidad</label><input id="edit-amount" className="field" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} /></div>
      <div><label className="label" htmlFor="edit-date">Fecha</label><input id="edit-date" type="date" className="field" required value={date} onChange={(event) => setDate(event.target.value)} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label" htmlFor="edit-category">Categoría</label><select id="edit-category" className="field" disabled={operation.type === 'transfer'} value={category} onChange={(event) => { setCategory(event.target.value); setSubcategory('') }}>{CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
        <div><label className="label" htmlFor="edit-subcategory">Subcategoría</label><select id="edit-subcategory" className="field" disabled={operation.type === 'transfer' || !availableSubcategories.length} value={subcategory} onChange={(event) => setSubcategory(event.target.value)}><option value="">Ninguna</option>{availableSubcategories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
      </div>
      <div><label className="label" htmlFor="edit-description">Descripción</label><input id="edit-description" className="field" value={description} onChange={(event) => setDescription(event.target.value)} /></div>
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-coral">{error}</p>}
      <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-4 font-bold text-white disabled:opacity-60">{busy ? <LoaderCircle className="animate-spin" size={20} /> : <><Check size={20} /> Guardar cambios</>}</button>
    </form>
  </Modal>
}

export function OperationsView() {
  const { operations, sources, users, userId, navigate, deleteOperation, combineOperations } = useApp()
  const initialRange = useMemo(currentMonthRange, [])
  const [sourceFilter, setSourceFilter] = useState('all')
  const [from, setFrom] = useState(initialRange.from)
  const [to, setTo] = useState(initialRange.to)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [subcategoryFilter, setSubcategoryFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [actionOperation, setActionOperation] = useState<Operation | null>(null)
  const [editOperation, setEditOperation] = useState<Operation | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Operation | null>(null)
  const [confirmCombine, setConfirmCombine] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const pressTimer = useRef<number | null>(null)
  const longPressTriggered = useRef(false)

  const allowedSources = useMemo(() => sources.filter((source) => source.owner == null || String(source.owner) === String(userId)), [sources, userId])
  const commonSources = useMemo(() => allowedSources.filter((source) => source.owner == null), [allowedSources])
  const personalSources = useMemo(() => allowedSources.filter((source) => String(source.owner) === String(userId)), [allowedSources, userId])
  const sourceMap = useMemo(() => new Map(sources.map((source) => [String(source.id), source.name])), [sources])
  const userMap = useMemo(() => new Map(users.map((user) => [String(user.id), user.name])), [users])
  const selected = useMemo(() => operations.filter((operation) => selectedIds.has(String(operation.id))), [operations, selectedIds])

  const subcategoryOptions = useMemo(() => {
    if (categoryFilter === 'all') return CATEGORIES.flatMap((category) => category.subcategories)
    return CATEGORIES.find((category) => category.id === categoryFilter)?.subcategories ?? []
  }, [categoryFilter])

  const filtered = useMemo(() => {
    const sourceIds = sourceFilter === 'all'
      ? new Set(allowedSources.map((source) => String(source.id)))
      : sourceFilter === 'common'
        ? new Set(commonSources.map((source) => String(source.id)))
        : sourceFilter === 'personal'
          ? new Set(personalSources.map((source) => String(source.id)))
          : new Set([sourceFilter])
    return operations.filter((operation) => {
      const operationDate = dateValue(operation.date)
      return sourceIds.has(String(operation.source_id))
        && (!from || operationDate >= from)
        && (!to || operationDate <= to)
        && (categoryFilter === 'all' || operation.category === categoryFilter)
        && (subcategoryFilter === 'all' || operation.subcategory === subcategoryFilter)
    }).sort((a, b) => b.date.localeCompare(a.date) || String(b.id).localeCompare(String(a.id)))
  }, [allowedSources, categoryFilter, commonSources, from, operations, personalSources, sourceFilter, subcategoryFilter, to])

  const combinationTotal = useMemo(() => selected.reduce((sum, operation) => (
    sum + (operation.type === 'income' ? operation.amount : -operation.amount)
  ), 0), [selected])
  const combinationIsZero = Math.abs(combinationTotal) < 0.005
  const combinationDominant = useMemo(() => {
    if (!selected.length || combinationIsZero) return null
    const resultType = combinationTotal > 0 ? 'income' : 'expense'
    return selected
      .filter((operation) => operation.type === resultType)
      .reduce((largest, operation) => operation.amount > largest.amount ? operation : largest)
  }, [combinationIsZero, combinationTotal, selected])

  const combineError = useMemo(() => {
    if (selected.length < 2) return 'Selecciona al menos dos operaciones.'
    const first = selected[0]
    if (selected.some((operation) => String(operation.created_by) !== String(userId))) return 'Solo puedes combinar tus propias operaciones.'
    if (selected.some((operation) => operation.type === 'transfer')) return 'Las transferencias no se pueden combinar.'
    if (selected.some((operation) => String(operation.source_id) !== String(first.source_id))) return 'Las operaciones deben pertenecer a la misma cuenta.'
    return ''
  }, [selected, userId])

  const selectionMode = selectedIds.size > 0
  const isOwned = (operation: Operation) => String(operation.created_by) === String(userId)
  const toggleSelection = (operation: Operation) => {
    if (!isOwned(operation)) return
    setActionOperation(null)
    setSelectedIds((current) => {
      const next = new Set(current)
      const id = String(operation.id)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }
  const startPress = (operation: Operation, event: ReactPointerEvent) => {
    if (!isOwned(operation) || event.pointerType === 'mouse' && event.button !== 0) return
    longPressTriggered.current = false
    pressTimer.current = window.setTimeout(() => {
      longPressTriggered.current = true
      toggleSelection(operation)
    }, 550)
  }
  const stopPress = () => {
    if (pressTimer.current != null) window.clearTimeout(pressTimer.current)
    pressTimer.current = null
  }
  const activate = (operation: Operation) => {
    if (longPressTriggered.current) { longPressTriggered.current = false; return }
    if (selectionMode) toggleSelection(operation)
    else setActionOperation(operation)
  }

  const runDelete = async () => {
    if (!deleteTarget) return
    setBusy(true); setError('')
    try {
      await deleteOperation(String(deleteTarget.id))
      setDeleteTarget(null)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo eliminar la operación.')
    } finally { setBusy(false) }
  }
  const runCombine = async () => {
    if (combineError) return
    setBusy(true); setError('')
    try {
      await combineOperations(selected.map((operation) => String(operation.id)))
      setSelectedIds(new Set()); setConfirmCombine(false)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudieron combinar las operaciones.')
    } finally { setBusy(false) }
  }

  const rowEvents = (operation: Operation) => ({
    onPointerDown: (event: ReactPointerEvent) => startPress(operation, event),
    onPointerUp: stopPress,
    onPointerCancel: stopPress,
    onPointerLeave: stopPress,
    onClick: () => activate(operation),
    onContextMenu: (event: React.MouseEvent) => event.preventDefault(),
  })

  return <main className="safe-top min-h-screen bg-paper px-4 pb-32 sm:px-5">
    <div className="mx-auto max-w-6xl">
      <header className="flex items-center gap-3 pb-5 pt-1">
        <button type="button" onClick={() => navigate('dashboard')} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-card" aria-label="Volver al panel"><ArrowLeft size={21} /></button>
        <div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-[0.18em] text-moss">Historial</p><h1 className="font-display text-3xl font-extrabold">Operaciones</h1></div>
        <button type="button" onClick={() => setShowFilters((current) => !current)} className={`flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-bold ${showFilters ? 'bg-ink text-white' : 'bg-white shadow-card'}`}><Filter size={18} /><span className="hidden sm:inline">Filtros</span></button>
      </header>

      {showFilters && <section className="card mb-5 grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div><label className="label" htmlFor="filter-source">Fuente</label><select id="filter-source" className="field" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}><option value="all">Todas las cuentas</option><option value="common">Cuentas comunes</option><option value="personal">Cuentas personales</option>{allowedSources.map((source) => <option key={source.id} value={String(source.id)}>{source.name}</option>)}</select></div>
        <div><label className="label" htmlFor="filter-from">Desde</label><input id="filter-from" type="date" className="field" value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} /></div>
        <div><label className="label" htmlFor="filter-to">Hasta</label><input id="filter-to" type="date" className="field" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} /></div>
        <div><label className="label" htmlFor="filter-category">Categoría</label><select id="filter-category" className="field" value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); setSubcategoryFilter('all') }}><option value="all">Todas</option>{CATEGORIES.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
        <div><label className="label" htmlFor="filter-subcategory">Subcategoría</label><select id="filter-subcategory" className="field" value={subcategoryFilter} onChange={(event) => setSubcategoryFilter(event.target.value)}><option value="all">Todas</option>{subcategoryOptions.map((subcategory) => <option key={`${subcategory.type}-${subcategory.id}`} value={subcategory.id}>{subcategory.name}</option>)}</select></div>
      </section>}

      <div className="mb-3 flex items-center justify-between px-1 text-sm text-black/45"><span>{filtered.length} {filtered.length === 1 ? 'operación' : 'operaciones'}</span><span>{from === initialRange.from && to === initialRange.to ? 'Mes actual' : 'Periodo personalizado'}</span></div>

      <section className="space-y-3 md:hidden">
        {filtered.map((operation) => {
          const chosen = selectedIds.has(String(operation.id))
          return <button type="button" key={operation.id} {...rowEvents(operation)} className={`card flex w-full touch-manipulation select-none items-center gap-3 p-4 text-left transition ${chosen ? 'border-moss bg-moss/5 ring-2 ring-moss/20' : ''}`}>
            {selectionMode && isOwned(operation) ? <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${chosen ? 'border-moss bg-moss text-white' : 'border-black/15'}`}>{chosen && <Check size={16} />}</span> : <TypeIcon operation={operation} />}
            <span className="min-w-0 flex-1"><span className="block truncate font-bold">{operation.description || subcategoryName(operation.category, operation.subcategory)}</span><span className="mt-0.5 block truncate text-xs text-black/45">{dateFormatter.format(new Date(`${dateValue(operation.date)}T12:00:00`))} · {sourceMap.get(String(operation.source_id)) ?? 'Cuenta'} · {userMap.get(String(operation.created_by)) ?? 'Otro usuario'}</span></span>
            <span className={`shrink-0 font-display text-base font-extrabold ${operation.type === 'income' ? 'text-moss' : operation.type === 'expense' ? 'text-coral' : 'text-blue-700'}`}>{operation.type === 'income' ? '+' : operation.type === 'expense' ? '−' : ''}{money.format(operation.amount)}</span>
          </button>
        })}
      </section>

      <section className="card hidden overflow-hidden md:block">
        <table className="w-full border-collapse text-left"><thead><tr className="border-b border-black/[0.06] text-xs uppercase tracking-wider text-black/40"><th className="px-5 py-4">Tipo</th><th className="px-4 py-4">Fecha</th><th className="px-4 py-4">Cuenta</th><th className="px-4 py-4">Categoría</th><th className="px-4 py-4">Descripción</th><th className="px-5 py-4 text-right">Cantidad</th></tr></thead><tbody>{filtered.map((operation) => {
          const chosen = selectedIds.has(String(operation.id))
          return <tr key={operation.id} {...rowEvents(operation)} className={`cursor-pointer select-none border-b border-black/[0.05] transition last:border-0 hover:bg-black/[0.02] ${chosen ? 'bg-moss/10' : ''}`}><td className="px-5 py-4"><span className="flex items-center gap-3"><TypeIcon operation={operation} /><span className="font-semibold">{TYPE_LABELS[operation.type]}</span></span></td><td className="whitespace-nowrap px-4 py-4 text-sm">{dateFormatter.format(new Date(`${dateValue(operation.date)}T12:00:00`))}</td><td className="px-4 py-4 text-sm">{sourceMap.get(String(operation.source_id))}</td><td className="px-4 py-4 text-sm">{categoryName(operation.category)}<span className="block text-xs text-black/40">{subcategoryName(operation.category, operation.subcategory)}</span></td><td className="max-w-[16rem] truncate px-4 py-4 text-sm">{operation.description || '—'}</td><td className={`whitespace-nowrap px-5 py-4 text-right font-display font-extrabold ${operation.type === 'income' ? 'text-moss' : operation.type === 'expense' ? 'text-coral' : 'text-blue-700'}`}>{operation.type === 'income' ? '+' : operation.type === 'expense' ? '−' : ''}{money.format(operation.amount)}</td></tr>
        })}</tbody></table>
      </section>

      {!filtered.length && <div className="card py-16 text-center"><p className="font-display text-lg font-bold">No hay operaciones</p><p className="mt-1 text-sm text-black/40">Prueba a cambiar los filtros seleccionados.</p></div>}
      <p className="mt-4 text-center text-xs text-black/35 md:hidden">Mantén pulsada una operación propia para seleccionar varias.</p>
    </div>

    {selectionMode && <div className="safe-bottom fixed bottom-0 left-0 right-0 z-30 border-t border-black/10 bg-white/95 px-4 pt-3 backdrop-blur-xl"><div className="mx-auto flex max-w-lg items-center gap-3"><button type="button" onClick={() => setSelectedIds(new Set())} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black/5" aria-label="Cancelar selección"><X size={21} /></button><div className="min-w-0 flex-1"><p className="font-bold">{selectedIds.size} seleccionadas</p>{combineError && <p className="truncate text-xs text-coral">{combineError}</p>}</div><button type="button" disabled={Boolean(combineError)} onClick={() => setConfirmCombine(true)} className="rounded-2xl bg-ink px-5 py-3 font-bold text-white disabled:opacity-35">Combinar</button></div></div>}

    {actionOperation && <Modal onClose={() => setActionOperation(null)}><div className="flex items-start gap-3"><TypeIcon operation={actionOperation} /><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wider text-black/40">{TYPE_LABELS[actionOperation.type]}</p><h2 className="truncate font-display text-2xl font-extrabold">{actionOperation.description || subcategoryName(actionOperation.category, actionOperation.subcategory)}</h2><p className="mt-1 text-sm text-black/45">{dateFormatter.format(new Date(`${dateValue(actionOperation.date)}T12:00:00`))} · {sourceMap.get(String(actionOperation.source_id))}</p></div><button type="button" onClick={() => setActionOperation(null)} className="flex h-10 w-10 items-center justify-center rounded-full bg-black/5"><X size={20} /></button></div><p className={`mt-6 font-display text-4xl font-extrabold ${actionOperation.type === 'income' ? 'text-moss' : actionOperation.type === 'expense' ? 'text-coral' : 'text-blue-700'}`}>{money.format(actionOperation.amount)}</p>{isOwned(actionOperation) ? <div className="mt-6 grid grid-cols-2 gap-3"><button type="button" onClick={() => { setEditOperation(actionOperation); setActionOperation(null) }} className="flex items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-4 font-bold text-white"><Pencil size={19} />Editar</button><button type="button" onClick={() => { setDeleteTarget(actionOperation); setActionOperation(null); setError('') }} className="flex items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-4 font-bold text-coral"><Trash2 size={19} />Eliminar</button></div> : <p className="mt-6 rounded-2xl bg-black/[0.04] p-4 text-sm text-black/55">Esta operación pertenece a {userMap.get(String(actionOperation.created_by)) ?? 'otro usuario'} y solo su creador puede modificarla.</p>}</Modal>}
    {editOperation && <EditOperationDialog operation={editOperation} onClose={() => setEditOperation(null)} />}
    {deleteTarget && <Modal onClose={() => !busy && setDeleteTarget(null)}><h2 className="font-display text-2xl font-extrabold">Eliminar operación</h2><p className="mt-3 text-black/60">Se eliminará la operación y se revertirá su efecto sobre el saldo de la cuenta. Esta acción no se puede deshacer.</p>{error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-coral">{error}</p>}<div className="mt-6 grid grid-cols-2 gap-3"><button type="button" disabled={busy} onClick={() => setDeleteTarget(null)} className="rounded-2xl bg-black/5 px-4 py-4 font-bold">Cancelar</button><button type="button" disabled={busy} onClick={runDelete} className="flex items-center justify-center gap-2 rounded-2xl bg-coral px-4 py-4 font-bold text-white disabled:opacity-60">{busy ? <LoaderCircle className="animate-spin" size={20} /> : <Trash2 size={19} />}Eliminar</button></div></Modal>}
    {confirmCombine && <Modal onClose={() => !busy && setConfirmCombine(false)}><h2 className="font-display text-2xl font-extrabold">Combinar {selected.length} operaciones</h2>{combinationIsZero ? <p className="mt-3 text-black/60">Los importes se cancelan entre sí. Las operaciones seleccionadas se eliminarán y no se creará una operación nueva.</p> : <><p className="mt-3 text-black/60">Las operaciones originales se sustituirán por una sola. Se usará la fecha más antigua y la descripción solo se conservará si todas coinciden.</p><div className="mt-4 rounded-2xl bg-white p-4"><p className="text-xs font-bold uppercase tracking-wider text-black/40">Resultado</p><p className={`mt-1 font-display text-2xl font-extrabold ${combinationTotal > 0 ? 'text-moss' : 'text-coral'}`}>{combinationTotal > 0 ? '+' : '−'}{money.format(Math.abs(combinationTotal))}</p>{combinationDominant && <p className="mt-1 text-sm text-black/50">{categoryName(combinationDominant.category)} · {subcategoryName(combinationDominant.category, combinationDominant.subcategory)}</p>}</div></>}{error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-coral">{error}</p>}<div className="mt-6 grid grid-cols-2 gap-3"><button type="button" disabled={busy} onClick={() => setConfirmCombine(false)} className="rounded-2xl bg-black/5 px-4 py-4 font-bold">Cancelar</button><button type="button" disabled={busy || Boolean(combineError)} onClick={runCombine} className="flex items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-4 font-bold text-white disabled:opacity-60">{busy ? <LoaderCircle className="animate-spin" size={20} /> : combinationIsZero ? <Trash2 size={19} /> : <ArrowRightLeft size={19} />}{combinationIsZero ? 'Eliminar seleccionadas' : 'Combinar'}</button></div></Modal>}
  </main>
}
