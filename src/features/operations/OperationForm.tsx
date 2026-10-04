import { useMemo, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, Check, LoaderCircle } from 'lucide-react'
import { CATEGORIES } from '../../data/categories'
import { useApp } from '../../hooks/useApp'

const TITLES = { income: 'Nuevo ingreso', expense: 'Nuevo gasto', transfer: 'Nueva transferencia' }
const ACCENTS = { income: 'bg-[#2f6b4f]', expense: 'bg-[#c84f45]', transfer: 'bg-[#4868a8]' }

function today() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

export function OperationForm() {
  const { selectedType: type, sources, settings, userId, userEmail, navigate, submitOperation } = useApp()
  const [amount, setAmount] = useState('')
  const [sourceId, setSourceId] = useState(settings.default_source_id || sources[0]?.id || '')
  const [destinationId, setDestinationId] = useState('')
  const [categoryId, setCategoryId] = useState('desconocido')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [date, setDate] = useState(today())
  const [description, setDescription] = useState('')
  const [responsible, setResponsible] = useState(userId ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const category = useMemo(() => CATEGORIES.find((item) => item.id === categoryId), [categoryId])
  const selectedSource = sources.find((source) => source.id === sourceId)
  const isShared = selectedSource?.owner === ''

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const numericAmount = Number(amount.replace(',', '.'))
    if (!numericAmount || numericAmount <= 0) return setError('Introduce una cantidad mayor que cero.')
    if (type === 'transfer' && (!destinationId || sourceId === destinationId)) return setError('Elige una cuenta de destino diferente.')
    setBusy(true)
    setError('')
    try {
      await submitOperation({
        type,
        amount: numericAmount,
        source_id: sourceId,
        destination_source_id: type === 'transfer' ? destinationId : undefined,
        category_id: type === 'transfer' ? 'desconocido' : categoryId,
        subcategory_id: type !== 'transfer' && subcategoryId ? subcategoryId : undefined,
        date: new Date(`${date}T12:00:00`).toISOString(),
        description: description.trim() || undefined,
        created_by: responsible || userId || '',
      })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo guardar la operación.')
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-paper pb-8">
      <div className={`${ACCENTS[type]} safe-top rounded-b-[2.5rem] px-5 pb-7 text-white`}>
        <div className="mx-auto max-w-lg">
          <button onClick={() => navigate('selector')} className="mb-7 flex h-10 w-10 items-center justify-center rounded-full bg-white/15" aria-label="Volver"><ArrowLeft size={21} /></button>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-white/65">Operación</p>
          <h1 className="font-display text-3xl font-extrabold">{TITLES[type]}</h1>
        </div>
      </div>

      <form onSubmit={submit} className="mx-auto max-w-lg px-5 pt-7">
        <label className="label" htmlFor="amount">Cantidad</label>
        <div className="relative mb-6">
          <input autoFocus id="amount" inputMode="decimal" className="w-full border-b-2 border-black/15 bg-transparent py-2 pr-12 font-display text-5xl font-extrabold tracking-tight outline-none focus:border-ink" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
          <span className="absolute bottom-3 right-1 text-3xl font-bold text-black/30">€</span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className={type === 'transfer' ? '' : 'sm:col-span-2'}>
            <label className="label" htmlFor="source">{type === 'transfer' ? 'Cuenta origen' : 'Cuenta'}</label>
            <select id="source" className="field" required value={sourceId} onChange={(e) => setSourceId(e.target.value)}>{sources.map((source) => <option key={source.id} value={source.id}>{source.name} · {source.balance.toLocaleString('es-ES')} €</option>)}</select>
          </div>
          {type === 'transfer' && <div><label className="label" htmlFor="destination">Cuenta destino</label><select id="destination" className="field" required value={destinationId} onChange={(e) => setDestinationId(e.target.value)}><option value="">Seleccionar…</option>{sources.filter((source) => source.id !== sourceId).map((source) => <option key={source.id} value={source.id}>{source.name}</option>)}</select></div>}

          <div><label className="label" htmlFor="category">Categoría</label><select id="category" className="field" disabled={type === 'transfer'} value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setSubcategoryId('') }}>{CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
          <div><label className="label" htmlFor="subcategory">Subcategoría</label><select id="subcategory" className="field" disabled={type === 'transfer' || !category?.subcategories.length} value={subcategoryId} onChange={(e) => setSubcategoryId(e.target.value)}><option value="">Sin subcategoría</option>{category?.subcategories.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>

          <div><label className="label" htmlFor="date">Fecha</label><div className="relative"><CalendarDays className="pointer-events-none absolute left-4 top-3.5 text-black/35" size={19} /><input id="date" type="date" className="field pl-11" required value={date} onChange={(e) => setDate(e.target.value)} /></div></div>
          {isShared && <div><label className="label" htmlFor="responsible">Responsable</label><input id="responsible" className="field" value={responsible} onChange={(e) => setResponsible(e.target.value)} placeholder={userEmail ?? 'Usuario'} /></div>}
          <div className="sm:col-span-2"><label className="label" htmlFor="description">Descripción <span className="normal-case tracking-normal text-black/30">(opcional)</span></label><input id="description" className="field" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Añade una nota rápida" /></div>
        </div>

        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-coral">{error}</p>}
        <button disabled={busy} className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-4 font-bold text-white shadow-lg transition active:scale-[0.99] disabled:opacity-60">
          {busy ? <LoaderCircle className="animate-spin" size={21} /> : <><Check size={20} /> Guardar operación <ArrowRight size={18} /></>}
        </button>
      </form>
    </main>
  )
}
