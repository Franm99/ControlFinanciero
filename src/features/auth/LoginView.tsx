import { useState, type FormEvent } from 'react'
import { ArrowRight, Home, LoaderCircle, LockKeyhole } from 'lucide-react'
import { useApp } from '../../hooks/useApp'

export function LoginView() {
  const { login } = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try { await login(email, password) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo iniciar sesión.') }
    finally { setBusy(false) }
  }

  return (
    <main className="safe-top flex min-h-screen items-center justify-center overflow-hidden bg-ink px-5 py-10 text-white">
      <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-moss blur-3xl" />
      <div className="relative w-full max-w-sm">
        <div className="mb-10">
          {/* <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10"><Home size={23} /></div> */}
          <h1 className="font-display text-4xl font-extrabold tracking-tight">REGISTRO DE GASTOS</h1>
        </div>
        <form onSubmit={submit} className="rounded-[2rem] bg-paper p-6 text-ink shadow-2xl">
          <div className="mb-5 flex items-center gap-2 text-sm font-semibold"><LockKeyhole size={17} /> Acceso privado</div>

          <label className="label" htmlFor="email">Correo</label>
          <input 
            className="field mb-4"
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
          />

          <label className="label" htmlFor="password">Contraseña</label>
          <input 
            className="field"
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          {error && <p className="mt-3 text-sm font-medium text-coral">{error}</p>}
          
          <button disabled={busy} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-4 font-bold text-white transition hover:bg-moss disabled:opacity-60">
            {busy ? <LoaderCircle className="animate-spin" size={20} /> : <>Entrar <ArrowRight size={19} /></>}
          </button>
        </form>
      </div>
    </main>
  )
}
