import React from 'react'
import { useRealtime, RealtimeStatus } from '../contexts/RealtimeContext'

export function useRealtimeAudioFiles({ autoSync = true } = {}) {
  const { audioFiles, status, sync } = useRealtime()
  const [loading, setLoading] = React.useState(false)

  const refresh = React.useCallback(async () => {
    setLoading(true)
    try {
      await sync()
    } finally {
      setLoading(false)
    }
  }, [sync])

  React.useEffect(() => {
    if (!autoSync) return
    if (status === RealtimeStatus.CONNECTED) {
      refresh()
    }
  }, [autoSync, refresh, status])

  return {
    items: audioFiles,
    status,
    loading,
    refresh,
  }
}

export function useRealtimeAudio(audioId) {
  const { audioFiles } = useRealtime()
  return React.useMemo(() => audioFiles.find((item) => item.id === audioId) || null, [audioFiles, audioId])
}
