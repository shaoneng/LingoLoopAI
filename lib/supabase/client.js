const SUPABASE_EPOCH = 'https://esm.sh/@supabase/supabase-js@2.58.0?bundle'

let clientPromise = null
let modulePromise = null
let cachedClient = null

function readEnv(name) {
  if (typeof window !== 'undefined') {
    return window.__ENV__?.[name] ?? process.env?.[name]
  }
  return process.env?.[name]
}

async function loadModule() {
  if (typeof window === 'undefined') return null
  if (!modulePromise) {
    modulePromise = import(/* webpackIgnore: true */ SUPABASE_EPOCH)
  }
  try {
    return await modulePromise
  } catch (error) {
    console.warn('Failed to load Supabase module', error)
    return null
  }
}

async function initClient() {
  if (cachedClient) return cachedClient
  const mod = await loadModule()
  if (!mod?.createClient) {
    return null
  }

  const url = readEnv('NEXT_PUBLIC_SUPABASE_URL')
  const key = readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  if (!url || !key) {
    console.warn('Supabase realtime disabled: missing NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY')
    return null
  }

  cachedClient = mod.createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      params: {
        eventsPerSecond: Number(readEnv('NEXT_PUBLIC_SUPABASE_EVENTS_PER_SEC') || 10),
      },
    },
  })
  return cachedClient
}

export function resetSupabaseClient() {
  cachedClient = null
  clientPromise = null
}

export async function loadSupabaseClient() {
  if (!clientPromise) {
    clientPromise = initClient()
  }
  return clientPromise
}
