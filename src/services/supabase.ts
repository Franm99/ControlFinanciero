import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Operation, OperationDraft, OperationFilters, Source, UserSettings } from '../types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null
export const isSupabaseConfigured = Boolean(supabase)

function client(): SupabaseClient {
  if (!supabase) throw new Error('Supabase no está configurado. Añade las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.')
  return supabase
}

export async function get_sources(): Promise<Source[]> {
  const { data, error } = await client().from('sources').select('*').order('name')
  if (error) throw error
  return data as Source[]
}

export async function get_operations(filters: OperationFilters = {}): Promise<Operation[]> {
  let query = client().from('operations').select('*').order('date', { ascending: false })
  if (filters.from) query = query.gte('date', filters.from)
  if (filters.to) query = query.lte('date', filters.to)
  if (filters.categoryId) query = query.eq('category_id', filters.categoryId)
  if (filters.sourceId) {
    query = query.or(`source_id.eq.${filters.sourceId},destination_source_id.eq.${filters.sourceId}`)
  }
  const { data, error } = await query
  if (error) throw error
  return data as Operation[]
}

/** Balance changes are performed atomically by the corresponding database RPC. */
export async function add_operation(operation: OperationDraft): Promise<Operation> {
  const { data, error } = await client().rpc('add_operation', { operation_data: operation })
  if (error) throw error
  return data as Operation
}

export async function update_operation(id: string, operation: Partial<OperationDraft>): Promise<Operation> {
  const { data, error } = await client().rpc('update_operation', {
    operation_id: id,
    operation_data: operation,
  })
  if (error) throw error
  return data as Operation
}

export async function delete_operation(id: string): Promise<void> {
  const { error } = await client().rpc('delete_operation', { operation_id: id })
  if (error) throw error
}

export async function combine_operations(
  operationIds: string[],
  newOperationData: OperationDraft,
): Promise<Operation> {
  const { data, error } = await client().rpc('combine_operations', {
    operation_ids: operationIds,
    new_operation_data: newOperationData,
  })
  if (error) throw error
  return data as Operation
}

export async function get_user_settings(): Promise<UserSettings | null> {
  const { data: auth } = await client().auth.getUser()
  if (!auth.user) return null
  const { data, error } = await client()
    .from('user_settings')
    .select('*')
    .eq('user_id', auth.user.id)
    .maybeSingle()
  if (error) throw error
  return data as UserSettings | null
}

export async function save_user_settings(settings: UserSettings): Promise<void> {
  const { error } = await client().from('user_settings').upsert(settings)
  if (error) throw error
}
