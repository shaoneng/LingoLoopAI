import { getSupabaseAdminClient } from '../../utils/supabase'

export async function getUserById(id) {
  if (!id) return null
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('User')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`获取用户失败: ${error.message}`)
  }

  return data ?? null
}
