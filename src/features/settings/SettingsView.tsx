import { ArrowLeft, LogOut, Save, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useApp } from '../../hooks/useApp'

export function SettingsView() {
  const { sources, settings, userEmail, navigate, updateDefaultSource, logout } = useApp()
  const [defaultSource, setDefaultSource] = useState(settings.default_source_id)
  const [saved, setSaved] = useState(false)

  const save = async () => {
    await updateDefaultSource(defaultSource)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1800)
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

        <button onClick={() => void logout()} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 font-bold text-coral"><LogOut size={19} />Cerrar sesión</button>
      </div>
    </main>
  )
}
