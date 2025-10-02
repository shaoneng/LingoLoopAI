import React from 'react'
import { loadSupabaseClient } from '../lib/supabase/client'
import { resolveApiUrl } from '../lib/api-client'
import { useAuth } from './AuthContext'

const AUDIO_CACHE_KEY = 'lingoloop.cache.audioFiles.v1'
const RUN_CACHE_KEY = 'lingoloop.cache.transcriptRuns.v1'
const USAGE_CACHE_KEY = 'lingoloop.cache.usageLogs.v1'
const MUTATION_QUEUE_KEY = 'lingoloop.cache.pendingMutations.v1'

const STATUS = {
  DISABLED: 'disabled',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  OFFLINE: 'offline',
  ERROR: 'error',
}

function isBrowser() {
  return typeof window !== 'undefined'
}

function readStorage(key, fallback) {
  if (!isBrowser()) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch (error) {
    console.warn('Failed to parse realtime cache', key, error)
    return fallback
  }
}

function writeStorage(key, value) {
  if (!isBrowser()) return
  try {
    if (value == null) {
      window.localStorage.removeItem(key)
    } else {
      window.localStorage.setItem(key, JSON.stringify(value))
    }
  } catch (error) {
    console.warn('Failed to write realtime cache', key, error)
  }
}

function sortByUpdatedAt(items) {
  return [...items].sort((a, b) => {
    const aTs = a?.updatedAt ? new Date(a.updatedAt).getTime() : 0
    const bTs = b?.updatedAt ? new Date(b.updatedAt).getTime() : 0
    return bTs - aTs
  })
}

function mergeRecord(map, record) {
  if (!record || !record.id) return false
  const existing = map.get(record.id)
  if (!existing) {
    map.set(record.id, record)
    return true
  }
  const existingTs = existing?.updatedAt ? new Date(existing.updatedAt).getTime() : 0
  const incomingTs = record?.updatedAt ? new Date(record.updatedAt).getTime() : Date.now()
  if (incomingTs >= existingTs) {
    map.set(record.id, { ...existing, ...record })
    return true
  }
  return false
}

function removeRecord(map, id) {
  if (!id) return false
  return map.delete(id)
}

const RealtimeContext = React.createContext({
  status: STATUS.DISABLED,
  audioFiles: [],
  transcriptRuns: [],
  usageLogs: [],
  pendingMutations: [],
  sync: async () => {},
  registerPendingMutation: () => {},
  clearPendingMutation: (id) => {},
})

export function RealtimeProvider({ children }) {
  const { accessToken } = useAuth()
  const [supabase, setSupabase] = React.useState(null)
  const [status, setStatus] = React.useState(STATUS.CONNECTING)

  React.useEffect(() => {
    if (!isBrowser()) return
    let active = true
    loadSupabaseClient()
      .then((client) => {
        if (!active) return
        if (!client) {
          setStatus(STATUS.DISABLED)
          setSupabase(null)
          return
        }
        setSupabase(client)
        setStatus(navigator.onLine ? STATUS.CONNECTING : STATUS.OFFLINE)
      })
      .catch((error) => {
        if (!active) return
        console.warn('Failed to initialise Supabase client', error)
        setSupabase(null)
        setStatus(STATUS.DISABLED)
      })
    return () => {
      active = false
    }
  }, [])

  const audioMapRef = React.useRef(new Map())
  const runMapRef = React.useRef(new Map())
  const usageMapRef = React.useRef(new Map())
  const [audioFiles, setAudioFiles] = React.useState(() => {
    const cached = readStorage(AUDIO_CACHE_KEY, [])
    const map = audioMapRef.current
    cached.forEach((row) => {
      if (row?.id) map.set(row.id, row)
    })
    return sortByUpdatedAt(cached)
  })
  const [transcriptRuns, setTranscriptRuns] = React.useState(() => {
    const cached = readStorage(RUN_CACHE_KEY, [])
    const map = runMapRef.current
    cached.forEach((row) => {
      if (row?.id) map.set(row.id, row)
    })
    return sortByUpdatedAt(cached)
  })
  const [usageLogs, setUsageLogs] = React.useState(() => {
    const cached = readStorage(USAGE_CACHE_KEY, [])
    const map = usageMapRef.current
    cached.forEach((row) => {
      if (row?.id) map.set(row.id, row)
    })
    return sortByUpdatedAt(cached)
  })
  const [pendingMutations, setPendingMutations] = React.useState(() => readStorage(MUTATION_QUEUE_KEY, []))
  const reconcilingRef = React.useRef(false)

  const persistCaches = React.useCallback(() => {
    writeStorage(AUDIO_CACHE_KEY, Array.from(audioMapRef.current.values()))
    writeStorage(RUN_CACHE_KEY, Array.from(runMapRef.current.values()))
    writeStorage(USAGE_CACHE_KEY, Array.from(usageMapRef.current.values()))
  }, [])

  const refreshSnapshots = React.useCallback(() => {
    setAudioFiles(sortByUpdatedAt(Array.from(audioMapRef.current.values())))
    setTranscriptRuns(sortByUpdatedAt(Array.from(runMapRef.current.values())))
    setUsageLogs(sortByUpdatedAt(Array.from(usageMapRef.current.values())))
    persistCaches()
  }, [persistCaches])

  const applyServerEvent = React.useCallback((table, payload) => {
    if (!payload) return
    const { eventType, new: newRow, old: oldRow } = payload
    switch (table) {
      case 'AudioFile': {
        if (eventType === 'DELETE') {
          if (removeRecord(audioMapRef.current, oldRow?.id)) {
            refreshSnapshots()
          }
          break
        }
        if (mergeRecord(audioMapRef.current, newRow)) {
          refreshSnapshots()
        }
        break
      }
      case 'TranscriptRun': {
        if (eventType === 'DELETE') {
          if (removeRecord(runMapRef.current, oldRow?.id)) {
            refreshSnapshots()
          }
          break
        }
        if (mergeRecord(runMapRef.current, newRow)) {
          refreshSnapshots()
        }
        break
      }
      case 'UsageLog': {
        if (eventType === 'DELETE') {
          if (removeRecord(usageMapRef.current, oldRow?.id)) {
            refreshSnapshots()
          }
          break
        }
        if (mergeRecord(usageMapRef.current, newRow)) {
          refreshSnapshots()
        }
        break
      }
      default:
        break
    }
  }, [refreshSnapshots])

  const registerPendingMutation = React.useCallback((mutation) => {
    setPendingMutations((current) => {
      const next = [...current, mutation]
      writeStorage(MUTATION_QUEUE_KEY, next)
      return next
    })
  }, [])

  const clearPendingMutation = React.useCallback((mutationId) => {
    setPendingMutations((current) => {
      const next = current.filter((item) => item.id !== mutationId)
      writeStorage(MUTATION_QUEUE_KEY, next)
      return next
    })
  }, [])

  const flushPendingMutations = React.useCallback(async () => {
    if (!pendingMutations.length || !accessToken) return
    if (reconcilingRef.current) return
    reconcilingRef.current = true
    try {
      for (const mutation of pendingMutations) {
        if (!mutation?.request) continue
        try {
          const { path, method = 'POST', body } = mutation.request
          const resp = await fetch(resolveApiUrl(path), {
            method,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: body ? JSON.stringify(body) : undefined,
          })
          if (!resp.ok) {
            console.warn('Pending mutation failed after reconnect', mutation, await resp.text())
            continue
          }
          clearPendingMutation(mutation.id)
        } catch (error) {
          console.warn('Failed to replay mutation', mutation, error)
        }
      }
    } finally {
      reconcilingRef.current = false
    }
  }, [accessToken, clearPendingMutation, pendingMutations])

  const sync = React.useCallback(async () => {
    if (!accessToken) return
    try {
      const resp = await fetch(resolveApiUrl('/api/audios?page=1&pageSize=100'), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (resp.ok) {
        const payload = await resp.json()
        const items = Array.isArray(payload?.items) ? payload.items : []
        const audioMap = audioMapRef.current
        audioMap.clear()
        items.forEach((item) => {
          if (item?.id) {
            audioMap.set(item.id, item)
            if (item.latestRun?.id) {
              mergeRecord(runMapRef.current, item.latestRun)
            }
          }
        })
      } else {
        console.warn('Realtime sync failed', resp.status)
      }
    } catch (error) {
      console.warn('Failed to sync realtime data', error)
    }

    refreshSnapshots()
    flushPendingMutations()
  }, [accessToken, flushPendingMutations, refreshSnapshots])

  React.useEffect(() => {
    if (!supabase) return

    const updateStatusFromNetwork = () => {
      if (!navigator.onLine) {
        setStatus(STATUS.OFFLINE)
      } else if (status === STATUS.OFFLINE) {
        setStatus(STATUS.CONNECTING)
        sync()
        flushPendingMutations()
      }
    }

    window.addEventListener('online', updateStatusFromNetwork)
    window.addEventListener('offline', updateStatusFromNetwork)
    return () => {
      window.removeEventListener('online', updateStatusFromNetwork)
      window.removeEventListener('offline', updateStatusFromNetwork)
    }
  }, [flushPendingMutations, status, supabase, sync])

  React.useEffect(() => {
    if (!supabase) return undefined

    const channels = []
    const subscribe = (table) => {
      const channel = supabase.channel(`public:${table}`)
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        applyServerEvent(table, payload)
      })
      channel.subscribe((nextStatus) => {
        if (nextStatus === 'SUBSCRIBED') {
          setStatus((prev) => (prev === STATUS.CONNECTING ? STATUS.CONNECTED : prev))
        }
        if (nextStatus === 'CHANNEL_ERROR') {
          setStatus(STATUS.ERROR)
        }
        if (nextStatus === 'TIMED_OUT') {
          setStatus(STATUS.OFFLINE)
        }
      })
      channels.push(channel)
    }

    setStatus((prev) => (prev === STATUS.DISABLED ? STATUS.CONNECTING : prev))
    subscribe('AudioFile')
    subscribe('TranscriptRun')
    subscribe('UsageLog')

    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel)
      })
    }
  }, [applyServerEvent, supabase])

  React.useEffect(() => {
    if (status === STATUS.CONNECTED && accessToken) {
      sync()
    }
  }, [accessToken, status, sync])

  const value = React.useMemo(() => ({
    status,
    audioFiles,
    transcriptRuns,
    usageLogs,
    pendingMutations,
    sync,
    registerPendingMutation,
    clearPendingMutation,
  }), [audioFiles, clearPendingMutation, pendingMutations, registerPendingMutation, status, sync, transcriptRuns, usageLogs])

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime() {
  const ctx = React.useContext(RealtimeContext)
  if (!ctx) {
    throw new Error('useRealtime must be used within a RealtimeProvider')
  }
  return ctx
}

export const RealtimeStatus = STATUS
