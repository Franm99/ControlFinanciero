import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, Check, LoaderCircle } from 'lucide-react'
import { CATEGORIES } from '../../data/categories'
import { useApp } from '../../hooks/useApp'
import { supportsOperationType, type OperationDraft, type RecurrentFrequency, type RecurrentOperationDraft } from '../../types'

const TITLES = { income: 'Nuevo ingreso', expense: 'Nuevo gasto', transfer: 'Nuevo movimiento' }
const ACCENTS = { income: 'bg-[#2f6b4f]', expense: 'bg-[#c84f45]', transfer: 'bg-[#4868a8]' }

function today() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

function idValue(value: unknown): string {
  return value == null ? '' : String(value)
}

export function OperationForm() {
  // Read from context
  const { selectedType: type, sources, settings, users, userId, userEmail, navigate, submitOperation } = useApp()

  // Native select values are strings, so normalize IDs loaded from the API before comparing them.
  const defaultSourceId = idValue(settings.default_source_id)

  // Define states for every field to fill in the operation form
  const [amount, setAmount] = useState('')
  const [sourceId, setSourceId] = useState(() => (
    sources.some((source) => idValue(source.id) === defaultSourceId)
      ? defaultSourceId
      : idValue(sources[0]?.id)
  ))
  const [destinationId, setDestinationId] = useState('')
  const [categoryId, setCategoryId] = useState(type === 'expense' ? 'comun' : 'desconocido')
  const [subcategoryId, setSubcategoryId] = useState(type === 'expense' ? 'comida' : '')
  const [date, setDate] = useState(today())
  const [description, setDescription] = useState('')
  const [responsible, setResponsible] = useState(() => idValue(
    users.find((user) => idValue(user.id) === idValue(userId) || user.email === userEmail)?.id ?? users[0]?.id,
  ))
  const [isRecurring, setIsRecurring] = useState(false)
  const [frequency, setFrequency] = useState<RecurrentFrequency>('monthly')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setSourceId((current) => {
      if (sources.some((source) => idValue(source.id) === current)) return current
      if (sources.some((source) => idValue(source.id) === defaultSourceId)) return defaultSourceId
      return idValue(sources[0]?.id)
    })
  }, [defaultSourceId, sources])

  useEffect(() => {
    if (destinationId && (!sources.some((source) => idValue(source.id) === destinationId) || destinationId === sourceId)) {
      setDestinationId('')
    }
  }, [destinationId, sourceId, sources])

  useEffect(() => {
    setResponsible((current) => {
      if (users.some((user) => idValue(user.id) === current)) return current
      return idValue(
        users.find((user) => idValue(user.id) === idValue(userId) || user.email === userEmail)?.id ?? users[0]?.id,
      )
    })
  }, [userEmail, userId, users])

  const category = useMemo(() => CATEGORIES.find((item) => item.id === categoryId), [categoryId])
  const subcategories = useMemo(
    () => category?.subcategories.filter((subcategory) => supportsOperationType(subcategory, type)) ?? [],
    [category, type],
  )
  const selectedSource = sources.find((source) => idValue(source.id) === sourceId)
  const selectedDestination = sources.find((source) => idValue(source.id) === destinationId)
  const isShared = Boolean(selectedSource && !selectedSource.owner)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const numericAmount = Number(amount.replace(',', '.'))
    if (!selectedSource) return setError('Elige una cuenta válida.')
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return setError('Introduce una cantidad mayor que cero.')
    if (type === 'transfer' && (!selectedDestination || sourceId === destinationId)) return setError('Elige una cuenta de destino diferente.')
    if (isShared && !responsible) return setError('Elige un responsable.')
    setBusy(true)
    setError('')

    try {
      const operation: OperationDraft = {
        type,
        amount: numericAmount,
        source_id: sourceId,
        destination_source_id: type === 'transfer' ? destinationId : undefined,
        category: type === 'transfer' ? 'desconocido' : categoryId,
        subcategory: type !== 'transfer' && subcategoryId ? subcategoryId : undefined,
        date: new Date(`${date}T12:00:00`).toISOString(),
        description: description.trim() || undefined,
        created_by: (isShared ? responsible : userId) || responsible || '',
      }

      let recurrentOperation: RecurrentOperationDraft | undefined
      if (isRecurring) {
        recurrentOperation = {
          user_id: userId ?? '',
          type: operation.type,
          amount: operation.amount,
          source_id: operation.source_id,
          destination_source_id: operation.destination_source_id,
          category: operation.category,
          subcategory: operation.subcategory,
          description: operation.description ?? '',
          frequency,
          start_date: new Date(`${date}T12:00:00`).toISOString(),
          is_active: true,
        }
      }

      await submitOperation(operation, recurrentOperation)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo guardar la operación.')
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-paper pb-8">
      <div className={`${ACCENTS[type]} safe-top rounded-b-[2.5rem] px-5 pb-7 text-white`}>
        <div className="mx-auto max-w-lg">
          <button type="button" onClick={() => navigate('selector')} className="mb-7 flex h-10 w-10 items-center justify-center rounded-full bg-white/15" aria-label="Volver"><ArrowLeft size={21} /></button>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-white/65">Operación</p>
          <h1 className="font-display text-3xl font-extrabold">{TITLES[type]}</h1>
        </div>
      </div>

      <form onSubmit={submit} className="mx-auto max-w-lg px-5 pt-7">
        <label className="label" htmlFor="amount">Cantidad</label>
        <div className="relative mb-6">
          <input 
            autoFocus
            id="amount"
            inputMode="decimal"
            className="w-full border-b-2 border-black/15 bg-transparent py-2 pr-12 font-display text-5xl font-extrabold tracking-tight outline-none focus:border-ink"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
          />
          <span className="absolute bottom-3 right-1 text-3xl font-bold text-black/30">€</span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className={type === 'transfer' ? '' : 'sm:col-span-2'}>
            <label className="label" htmlFor="source">{type === 'transfer' ? 'Cuenta origen' : 'Cuenta'}</label>
            <select 
              id="source" 
              className="field" 
              required 
              value={sourceId} 
              onChange={(e) => setSourceId(e.target.value)}
            >
              {sources
                .filter((source) => source.owner === userId || source.owner == null)
                .map((source) => (
                  <option key={source.id} value={idValue(source.id)}>
                    {source.name} · {source.balance.toLocaleString('es-ES')} €
                  </option>
                ))}
            </select>
          </div>
          {type === 'transfer' && 
          <div>
            <label className="label" htmlFor="destination">Cuenta destino</label>
            <select 
              id="destination" 
              className="field" 
              required 
              value={destinationId} 
              onChange={(e) => setDestinationId(e.target.value)}>
              {sources
                .map((source) => (
                  <option key={source.id} value={idValue(source.id)}>
                    {source.name} · {source.balance.toLocaleString('es-ES')} €
                  </option>
                ))}
            </select>
          </div>}

          <div><label className="label" htmlFor="category">Categoría</label><select id="category" className="field" disabled={type === 'transfer'} value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setSubcategoryId('') }}>{CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
          <div><label className="label" htmlFor="subcategory">Subcategoría</label><select id="subcategory" className="field" disabled={type === 'transfer' || !subcategories.length} value={subcategoryId} onChange={(e) => setSubcategoryId(e.target.value)}><option value="">Sin subcategoría</option>{subcategories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>

          <div><label className="label" htmlFor="date">Fecha</label><div className="relative"><CalendarDays className="pointer-events-none absolute left-4 top-3.5 text-black/35" size={19} /><input id="date" type="date" className="field pl-11" required value={date} onChange={(e) => setDate(e.target.value)} /></div></div>
          {isShared && <div><label className="label" htmlFor="responsible">Responsable</label><select id="responsible" className="field" required value={responsible} onChange={(e) => setResponsible(e.target.value)}><option value="" disabled>Seleccionar…</option>{users.map((user) => <option key={user.id} value={idValue(user.id)}>{user.name}</option>)}</select></div>}
          <div className="sm:col-span-2"><label className="label" htmlFor="description">Descripción <span className="normal-case tracking-normal text-black/30">(opcional)</span></label><input id="description" className="field" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Añade una nota rápida" /></div>
        </div>

        <section className="mt-6 rounded-2xl border border-black/[0.08] bg-white p-4">
          <label className="flex cursor-pointer items-center justify-between gap-4" htmlFor="is-recurring">
            <span className="font-semibold">Hacer la operación recurrente</span>
            <span className={`relative h-7 w-12 rounded-full transition ${isRecurring ? 'bg-moss' : 'bg-black/15'}`}>
              <input id="is-recurring" type="checkbox" className="peer sr-only" checked={isRecurring} onChange={(event) => setIsRecurring(event.target.checked)} />
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${isRecurring ? 'left-6' : 'left-1'}`} />
            </span>
          </label>

          {isRecurring && <div className="mt-4 border-t border-black/[0.06] pt-4">
            <label className="label" htmlFor="frequency">Frecuencia</label>
            <select id="frequency" className="field" value={frequency} onChange={(event) => setFrequency(event.target.value as RecurrentFrequency)}>
              <option value="monthly">Mensual</option>
              <option value="weekly">Semanal</option>
              <option value="yearly">Anual</option>
            </select>
          </div>}
        </section>

        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-coral">{error}</p>}
        <button disabled={busy} className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-4 font-bold text-white shadow-lg transition active:scale-[0.99] disabled:opacity-60">
          {busy ? <LoaderCircle className="animate-spin" size={21} /> : <><Check size={20} /> Guardar operación <ArrowRight size={18} /></>}
        </button>
      </form>
    </main>
  )
}
