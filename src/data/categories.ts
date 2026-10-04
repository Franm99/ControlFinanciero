import type { Category } from '../types'

export const CATEGORIES: Category[] = [
  { id: 'hogar', name: 'HOGAR', subcategories: ['nómina', 'comida', 'alquiler', 'suscripciones', 'internet', 'luz'] },
  { id: 'transporte', name: 'TRANSPORTE', subcategories: ['gasolina', 'transporte público', 'avión'] },
  { id: 'actividades', name: 'ACTIVIDADES', subcategories: ['gimnasio', 'cerámica', 'yoga', 'baloncesto'] },
  { id: 'ocio', name: 'OCIO', subcategories: ['hostelería', 'cine', 'otro'] },
  { id: 'extra', name: 'EXTRA', subcategories: ['regalos', 'bizum', 'proyectos', 'peluquería', 'ropa', 'salud', 'coche'] },
  { id: 'desconocido', name: 'DESCONOCIDO', subcategories: [] },
]
