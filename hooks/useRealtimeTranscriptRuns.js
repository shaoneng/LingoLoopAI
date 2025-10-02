import React from 'react'
import { useRealtime, RealtimeStatus } from '../contexts/RealtimeContext'

export function useRealtimeTranscriptRuns({ audioId, autoSync = false } = {}) {
  const { transcriptRuns, status, sync } = useRealtime()
  const [loading, setLoading] = React.useState(false)

  const refresh = React.useCallback(async () => {
    setLoading(true)
    try {
      await sync()
    } finally {
      setLoading(false)
    }
  }, [sync])

  const runs = React.useMemo(() => {
    if (!audioId) return transcriptRuns
    return transcriptRuns.filter((run) => run.audioId === audioId)
  }, [audioId, transcriptRuns])

  React.useEffect(() => {
    if (!autoSync) return
    if (status === RealtimeStatus.CONNECTED) {
      refresh()
    }
  }, [autoSync, refresh, status])

  return {
    runs,
    status,
    loading,
    refresh,
  }
}

export function useRealtimeRun(runId) {
  const { transcriptRuns } = useRealtime()
  return React.useMemo(() => transcriptRuns.find((item) => item.id === runId) || null, [runId, transcriptRuns])
}
