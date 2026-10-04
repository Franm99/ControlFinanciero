import { ArrowLeft, LogOut, Pause, Play, Repeat2, Save, Trash2, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useApp } from '../../hooks/useApp'

export function SettingsView() {
  const {
    sources,
    recurrentOperations,
    settings,
    userEmail,
    navigate,
    updateDefaultSource,
    toggleRecurrentOperation,
    deleteRecurrentOperation,
    logout,
  } = useApp()
  const [defaultSource, setDefaultSource] = useState(settings.default_source_id)
  const [saved, setSaved] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const save = async () => {
    await updateDefaultSource(defaultSource)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1800)
  }

  const toggle = async (id: string, isActive: boolean) => {
    setPendingId(id)
    setError('')
    try {
      await toggleRecurrentOperation(id, isActive)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo actualizar la operación recurrente.')
    } finally {
      setPendingId(null)
    }
  }

  const remove = async (id: string) => {
    if (!window.confirm('¿Eliminar definitivamente esta operación recurrente?')) return
    setPendingId(id)
    setError('')
    try {
      await deleteRecurrentOperation(id)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo eliminar la operación recurrente.')
    } finally {
      setPendingId(null)
    }
  }

  return (
    <main className="safe-top min-h-screen bg-paper px-5 pb-10">
      <div className="mx-auto max-w-lg">
        <header className="mb-9 flex items-center gap-4 pt-2"><button onClick={() => navigate('dashboard')} className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white"><ArrowLeft size={20} /></button><div><p className="text-xs font-bold uppercase tracking-widest text-moss">Preferencias</p><h1 className="font-display text-2xl font-extrabold">Configuración</h1></div></header>

        <section className="card p-5">
          <div className="mb-6 flex items-center gap-3 border-b border-black/[0.06] pb-5"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sage text-moss"><UserRound size={21} /></div><div><p className="text-xs text-black/40">Sesión iniciada</p><p className="font-semibold">{userEmail}</p></div></div>
          <label className="label" htmlFor="default-source">Cuenta predeterminada</label>
          <p className="mb-3 text-sm text-black/45">La seleccionaremos automáticamente al crear una operación.</p>
          <select id="default-source" className="field" value={defaultSource} onChange={(e) => setDefaultSource(e.target.value)}>{sources.map((source) => <option key={source.id} value={source.id}>{source.name}</option>)}</select>
          <button onClick={save} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-3.5 font-bold text-white"><Save size={18} />{saved ? 'Guardado' : 'Guardar cambios'}</button>
        </section>

        <section className="card mt-5 p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sage text-moss"><Repeat2 size={21} /></div>
            <div><h2 className="font-display text-lg font-extrabold">Operaciones recurrentes</h2><p className="text-sm text-black/45">Pausa o elimina tus automatizaciones.</p></div>
          </div>

          {recurrentOperations.length === 0 && <p className="rounded-xl bg-black/[0.03] p-4 text-sm text-black/45">No hay operaciones recurrentes.</p>}
          <div className="space-y-3">
            {recurrentOperations.map((operation) => {
              const source = sources.find((item) => item.id === operation.source_id)
              const frequency = { weekly: 'Semanal', monthly: 'Mensual', yearly: 'Anual' }[operation.frequency]
              return <article key={operation.id} className={`rounded-2xl border p-4 ${operation.is_active ? 'border-black/[0.08]' : 'border-black/[0.04] opacity-60'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{operation.description || operation.category_id}</p>
                    <p className="mt-1 text-sm text-black/45">{frequency} · {source?.name ?? 'Cuenta'} · {operation.amount.toLocaleString('es-ES')} €</p>
                    <p className="mt-1 text-xs text-black/35">{operation.is_active ? `Próxima: ${new Date(`${operation.next_run_date}T12:00:00`).toLocaleDateString('es-ES')}` : 'Pausada'}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${operation.is_active ? 'bg-sage text-moss' : 'bg-black/[0.06] text-black/45'}`}>{operation.is_active ? 'Activa' : 'Pausada'}</span>
                </div>
                <div className="mt-3 flex gap-2 border-t border-black/[0.06] pt-3">
                  <button disabled={pendingId === operation.id} onClick={() => void toggle(operation.id, !operation.is_active)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-black/[0.05] px-3 py-2 text-sm font-bold disabled:opacity-40">
                    {operation.is_active ? <Pause size={16} /> : <Play size={16} />}{operation.is_active ? 'Pausar' : 'Activar'}
                  </button>
                  <button disabled={pendingId === operation.id} onClick={() => void remove(operation.id)} aria-label="Eliminar operación recurrente" className="flex items-center justify-center rounded-xl bg-red-50 px-3 text-coral disabled:opacity-40"><Trash2 size={17} /></button>
                </div>
              </article>
            })}
          </div>
          {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-coral">{error}</p>}
        </section>

        <button onClick={() => void logout()} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 font-bold text-coral"><LogOut size={19} />Cerrar sesión</button>
      </div>
    </main>
  )
}
