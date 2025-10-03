import { getSupabaseAdminClient } from '../../utils/supabase'

const TABLE_LEARNING_SESSION = 'LearningSession'
const NO_ROWS_ERROR = 'PGRST116'

function normalizeError(error, action) {
  if (!error) return null
  if (error.code === NO_ROWS_ERROR) return null
  throw new Error(`${action}失败: ${error.message}`)
}

export async function fetchLearningSessionsWithAudio(userId) {
  if (!userId) return []
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from(TABLE_LEARNING_SESSION)
    .select(`
      id,
      userId,
      completedSegments,
      createdAt,
      deletedAt,
      audioFile:AudioFile(durationMs)
    `)
    .eq('userId', userId)
    .is('deletedAt', null)
    .order('createdAt', { ascending: false })

  normalizeError(error, '获取学习会话')
  return data ?? []
}

export async function fetchRecentSessionTimestamps(userId, limit = 30) {
  if (!userId) return []
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from(TABLE_LEARNING_SESSION)
    .select('createdAt')
    .eq('userId', userId)
    .is('deletedAt', null)
    .order('createdAt', { ascending: false })
    .limit(limit)

  normalizeError(error, '获取学习会话时间')
  return data ?? []
}
