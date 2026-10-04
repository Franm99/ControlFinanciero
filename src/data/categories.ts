import type { Category } from '../types'

export const CATEGORIES: Category[] = [
  { id: 'comun', name: 'COMÚN', subcategories: ['nómina', 'comida', 'alquiler', 'suscripciones', 'internet', 'luz', 'ayuda', 'educación', 'mascotas', 'hogar'] },
  { id: 'transporte', name: 'TRANSPORTE', subcategories: ['gasolina', 'transporte público', 'avión'] },
  { id: 'actividades', name: 'ACTIVIDADES', subcategories: ['gimnasio', 'cerámica', 'yoga', 'baloncesto'] },
  { id: 'ocio', name: 'OCIO', subcategories: ['hostelería', 'viajes', 'jolgorio', 'actividades de grupo', 'celebraciones'] },
  { id: 'extra', name: 'EXTRA', subcategories: ['regalos', 'bizum', 'proyectos', 'peluquería', 'ropa', 'salud', 'coche', 'reparaciones'] },
  { id: 'desconocido', name: 'DESCONOCIDO', subcategories: [] },
]
