import { useMemo, useState } from 'react'
import { BarChart3, Plus, Settings, WalletCards } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CATEGORIES } from '../../data/categories'
import { useApp } from '../../hooks/useApp'
import { supportsOperationType } from '../../types'

const COLORS = ['#2f6b4f', '#89aa8d', '#d5a85c', '#5376a6', '#bd6c61', '#8c789d']
const money = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })
const compactNumber = new Intl.NumberFormat('es-ES', { notation: 'compact', maximumFractionDigits: 1 })

export function Dashboard() {
  const { sources, operations, navigate } = useApp()
  const [sourceFilter, setSourceFilter] = useState('all')
  const total = sources.reduce((sum, source) => sum + source.balance, 0)
  const pieData = sources.filter((source) => source.balance > 0).map((source) => ({ name: source.name, value: source.balance }))

  const filtered = useMemo(() => operations.filter((operation) => sourceFilter === 'all' || operation.source_id === sourceFilter || operation.destination_source_id === sourceFilter), [operations, sourceFilter])
  const monthly = useMemo(() => {
    const formatter = new Intl.DateTimeFormat('es-ES', { month: 'short' })
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(); date.setMonth(date.getMonth() - (5 - index))
      const month = date.getMonth(); const year = date.getFullYear()
      const inMonth = filtered.filter((operation) => { const current = new Date(operation.date); return current.getMonth() === month && current.getFullYear() === year })
      return { month: formatter.format(date).replace('.', ''), Ingresos: inMonth.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0), Gastos: inMonth.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0) }
    })
  }, [filtered])
  const categories = CATEGORIES.map((category) => ({ name: category.name.slice(0, 5), value: filtered.filter((item) => item.type === 'expense' && item.category_id === category.id).reduce((sum, item) => sum + item.amount, 0) })).filter((item) => item.value > 0)
  const subcategories = useMemo(() => CATEGORIES.flatMap((category, categoryIndex) => (
    category.subcategories
      .filter((subcategory) => supportsOperationType(subcategory, 'expense'))
      .map((subcategory) => ({
        name: subcategory.name,
        category: category.name,
        color: COLORS[categoryIndex % COLORS.length],
        value: filtered
          .filter((operation) => operation.type === 'expense' && operation.category_id === category.id && operation.subcategory_id === subcategory.id)
          .reduce((sum, operation) => sum + operation.amount, 0),
      }))
  )).filter((subcategory) => subcategory.value > 0), [filtered])

  return (
    <main className="safe-top min-h-screen bg-paper px-5 pb-32">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between pb-7 pt-2"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-moss">Panel general</p><h1 className="font-display text-3xl font-extrabold">Vuestra casa</h1></div><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sage text-moss"><BarChart3 size={22} /></div></header>

        <section className="card overflow-hidden p-6 md:grid md:grid-cols-2 md:items-center">
          <div><div className="mb-4 flex items-center gap-2 text-sm font-semibold text-black/50"><WalletCards size={18} /> Total disponible</div><p className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">{money.format(total)}</p><p className="mt-2 text-sm text-black/45">En {sources.length} fuentes de dinero</p></div>
          <div className="mt-5 h-48 md:mt-0"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={76} paddingAngle={3}>{pieData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip formatter={(value) => money.format(Number(value))} /></PieChart></ResponsiveContainer></div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 md:col-span-2">{pieData.map((item, index) => <div key={item.name} className="flex items-center gap-2 text-xs font-semibold"><span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />{item.name}</div>)}</div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-5">
          <div className="card p-5 lg:col-span-3">
            <div className="mb-5 flex items-start justify-between gap-3"><div><h2 className="font-display text-lg font-extrabold">Ingresos vs. gastos</h2><p className="text-xs text-black/40">Últimos 6 meses</p></div><select aria-label="Filtrar por fuente" className="rounded-xl border border-black/10 bg-paper px-3 py-2 text-xs font-semibold outline-none" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}><option value="all">Todas</option>{sources.map((source) => <option key={source.id} value={source.id}>{source.name}</option>)}</select></div>
            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthly} barGap={2}><CartesianGrid vertical={false} stroke="#e9e9e2" /><XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={11} /><YAxis hide /><Tooltip formatter={(value) => money.format(Number(value))} cursor={{ fill: '#f7f7f2' }} /><Bar dataKey="Ingresos" fill="#4c8969" radius={[5, 5, 0, 0]} /><Bar dataKey="Gastos" fill="#db6c60" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div>
          </div>

          <div className="card p-5 lg:col-span-2"><h2 className="font-display text-lg font-extrabold">Gastos por categoría</h2><p className="mb-3 text-xs text-black/40">Según el filtro actual</p><div className="h-64">{categories.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={categories} layout="vertical"><XAxis type="number" hide /><YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={48} fontSize={10} /><Tooltip formatter={(value) => money.format(Number(value))} /><Bar dataKey="value" fill="#d5a85c" radius={[0, 7, 7, 0]} /></BarChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-center text-sm text-black/35">Aún no hay gastos<br />para mostrar</div>}</div></div>
        </section>

        <section className="card mt-5 p-5">
          <h2 className="font-display text-lg font-extrabold">Gastos por subcategoría</h2>
          <p className="mb-4 text-xs text-black/40">Subcategorías de gasto según el filtro actual</p>
          {subcategories.length ? <>
            <div style={{ height: Math.max(260, subcategories.length * 42) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subcategories} layout="vertical" margin={{ top: 8, right: 20, left: 4, bottom: 8 }}>
                  <CartesianGrid horizontal={false} stroke="#e9e9e2" />
                  <XAxis type="number" axisLine={false} tickLine={false} fontSize={10} tickFormatter={(value) => `${compactNumber.format(value)} €`} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={130} fontSize={11} />
                  <Tooltip formatter={(value) => money.format(Number(value))} cursor={{ fill: '#f7f7f2' }} />
                  <Bar dataKey="value" name="Gastos" barSize={22} radius={[0, 7, 7, 0]}>
                    {subcategories.map((subcategory) => <Cell key={`${subcategory.category}-${subcategory.name}`} fill={subcategory.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-black/[0.06] pt-4">
              {CATEGORIES.filter((category) => subcategories.some((subcategory) => subcategory.category === category.name)).map((category) => {
                const categoryIndex = CATEGORIES.findIndex((item) => item.id === category.id)
                return <div key={category.id} className="flex items-center gap-2 text-xs font-semibold"><span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[categoryIndex % COLORS.length] }} />{category.name}</div>
              })}
            </div>
          </> : <div className="flex h-48 items-center justify-center text-center text-sm text-black/35">Aún no hay gastos por subcategoría<br />para mostrar</div>}
        </section>
      </div>

      <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-20 border-t border-black/[0.06] bg-white/90 px-5 pt-3 backdrop-blur-xl"><div className="relative mx-auto flex max-w-lg items-center justify-around"><button className="flex flex-col items-center gap-1 text-[11px] font-bold text-moss"><BarChart3 size={21} />Panel</button><button onClick={() => navigate('selector')} className="-mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-ink text-white shadow-xl" aria-label="Nueva operación"><Plus size={30} /></button><button onClick={() => navigate('settings')} className="flex flex-col items-center gap-1 text-[11px] font-bold text-black/35"><Settings size={21} />Ajustes</button></div></nav>
    </main>
  )
}
