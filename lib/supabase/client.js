import { createClient } from '@supabase/supabase-js'

let browserClient = null

function readEnv(name) {
  if (typeof window !== 'undefined') {
    return window.__ENV__?.[name] || process.env[name]
  }
  return process.env[name]
}

export function getSupabaseClient() {
  if (typeof window === 'undefined') {
    return null
  }
  if (browserClient) return browserClient

  const url = readEnv('NEXT_PUBLIC_SUPABASE_URL')
  const key = readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  if (!url || !key) {
    console.warn('Supabase realtime disabled: missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
    return null
  }

  browserClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      params: {
        eventsPerSecond: Number(process.env.NEXT_PUBLIC_SUPABASE_EVENTS_PER_SEC || 10),
      },
    },
  })

  return browserClient
}

export function resetSupabaseClient() {
  if (browserClient) {
    browserClient.realtime.disconnect()
  }
  browserClient = null
}
