import { ArrowDownLeft, ArrowUpRight, Home, MoveRight } from 'lucide-react'
import { useApp } from '../../hooks/useApp'
import type { OperationType } from '../../types'

const ACTIONS: { type: OperationType; title: string; hint: string; icon: typeof ArrowDownLeft; styles: string }[] = [
  { type: 'income', title: 'Ingreso', hint: 'Dinero que entra', icon: ArrowDownLeft, styles: 'bg-[#dcebdd] text-[#22563d]' },
  { type: 'expense', title: 'Gasto', hint: 'Compra o pago', icon: ArrowUpRight, styles: 'bg-[#f6ded9] text-[#a13f35]' },
  { type: 'transfer', title: 'Transferencia', hint: 'Entre tus cuentas', icon: MoveRight, styles: 'bg-[#dfe6f5] text-[#36558d]' },
]

export function OperationSelector() {
  const { startOperation, navigate, userEmail } = useApp()
  const firstName = userEmail?.split('@')[0] ?? 'casa'

  return (
    <main className="safe-top min-h-screen bg-paper px-5 pb-28">
      <div className="mx-auto max-w-lg">
        <header className="flex items-center justify-between pb-10 pt-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ink text-white"><Home size={20} /></div>
            <div><p className="text-xs font-bold uppercase tracking-widest text-black/40">Casa</p><p className="text-sm font-semibold capitalize">Hola, {firstName}</p></div>
          </div>
          <button onClick={() => navigate('dashboard')} className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-bold">Ver panel</button>
        </header>

        <div className="mb-8">
          <p className="mb-2 text-sm font-bold text-moss">NUEVA OPERACIÓN</p>
          <h1 className="font-display text-[2.5rem] font-extrabold leading-[1.05] tracking-tight">¿Qué quieres<br />registrar?</h1>
        </div>

        <div className="grid gap-3">
          {ACTIONS.map(({ type, title, hint, icon: Icon, styles }) => (
            <button key={type} onClick={() => startOperation(type)} className={`${styles} group flex min-h-28 items-center rounded-[1.75rem] p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-card active:scale-[0.98]`}>
              <span className="mr-5 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/65"><Icon size={27} strokeWidth={2.3} /></span>
              <span className="flex-1"><span className="font-display block text-xl font-extrabold">{title}</span><span className="text-sm font-medium opacity-70">{hint}</span></span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/50 transition group-hover:translate-x-1"><MoveRight size={18} /></span>
            </button>
          ))}
        </div>
      </div>
    </main>
  )
}
