import type { Category } from '../types'

const expense = (name: string) => ({ id: name, name, type: 'expense' as const })
const income = (name: string) => ({ id: name, name, type: 'income' as const })
const both = (name: string) => ({ id: name, name, type: 'both' as const })

export const CATEGORIES: Category[] = [
  {
    id: 'comun',
    name: 'COMÚN',
    subcategories: [income('nómina'), expense('comida'), expense('alquiler'), expense('suscripciones'), expense('internet'), expense('luz'), both('ayuda'), expense('educación'), expense('mascotas'), expense('hogar')],
  },
  { id: 'transporte', name: 'TRANSPORTE', subcategories: [expense('gasolina'), expense('transporte público'), expense('avión')] },
  { id: 'actividades', name: 'ACTIVIDADES', subcategories: [expense('gimnasio'), expense('cerámica'), expense('yoga'), expense('baloncesto')] },
  { id: 'ocio', name: 'OCIO', subcategories: [expense('hostelería'), expense('viajes'), expense('jolgorio'), expense('actividades de grupo'), expense('celebraciones')] },
  { id: 'extra', name: 'EXTRA', subcategories: [both('regalos'), both('bizum'), both('proyectos'), expense('peluquería'), expense('ropa'), expense('salud'), expense('coche'), expense('reparaciones')] },
  { id: 'desconocido', name: 'DESCONOCIDO', subcategories: [] },
]
