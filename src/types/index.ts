export type OperationType = 'income' | 'expense' | 'transfer'
export type RecurrentFrequency = 'weekly' | 'monthly' | 'yearly'

export interface Source {
  id: string
  name: string
  balance: number
  description: string
  /** Empty string means that the source belongs to the household. */
  owner: string
}

export interface Category {
  id: string
  name: string
  subcategories: string[]
}

export interface Operation {
  id: string
  type: OperationType
  /** Always positive; the operation type determines its effect on balances. */
  amount: number
  source_id: string
  destination_source_id?: string
  category_id: string
  subcategory_id?: string
  date: string
  creation_date: string
  description?: string
  created_by: string
}

export interface RecurrentOperation {
  id: string
  user_id: string
  type: OperationType
  /** Always positive; the operation type determines its effect on balances. */
  amount: number
  source_id: string
  destination_source_id?: string
  category_id: string
  subcategory_id?: string
  description: string
  frequency: RecurrentFrequency
  day_of_month: number
  next_run_date: string
  is_active: boolean
}

export type RecurrentOperationDraft = Omit<RecurrentOperation, 'id'>

export interface UserSettings {
  user_id: string
  default_source_id: string
}

export type OperationDraft = Omit<Operation, 'id' | 'creation_date'>

export interface OperationFilters {
  from?: string
  to?: string
  sourceId?: string
  categoryId?: string
}

export type AppView = 'selector' | 'form' | 'dashboard' | 'settings'
