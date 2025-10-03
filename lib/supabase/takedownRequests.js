import { getSupabaseAdminClient } from '../../utils/supabase'

const TABLE_RESOURCE = 'SharedBbcResource'
const TABLE_TAKEDOWN = 'TakedownRequest'

function isNoRowsError(error) {
  return error?.code === 'PGRST116'
}

export async function findSharedResourceById(resourceId) {
  if (!resourceId) return null
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from(TABLE_RESOURCE)
    .select('id')
    .eq('id', resourceId)
    .maybeSingle()

  if (error && !isNoRowsError(error)) {
    throw new Error(`查询资源失败: ${error.message}`)
  }

  return data ?? null
}

export async function createTakedownRequest({
  resourceId,
  reason,
  contactInfo,
  additionalInfo,
  requestType = 'copyright_infringement',
}) {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from(TABLE_TAKEDOWN)
    .insert({
      resourceId,
      reason,
      contactInfo,
      additionalInfo: additionalInfo ?? null,
      status: 'pending',
      requestType,
    })
    .select('id, status, createdAt')
    .single()

  if (error) {
    throw new Error(`创建下架请求失败: ${error.message}`)
  }

  return data
}

export async function listTakedownRequests() {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from(TABLE_TAKEDOWN)
    .select(`
      id,
      resourceId,
      reason,
      contactInfo,
      additionalInfo,
      requestType,
      status,
      adminNotes,
      resolvedAt,
      resolvedBy,
      createdAt,
      updatedAt,
      resource:${TABLE_RESOURCE} (id, title, sourceType, isPublished)
    `)
    .order('createdAt', { ascending: false })

  if (error) {
    throw new Error(`获取下架请求列表失败: ${error.message}`)
  }

  return data ?? []
}
