import React from 'react'
import { useRealtime } from '../contexts/RealtimeContext'

export function useRealtimeUsageLogs({ userId } = {}) {
  const { usageLogs } = useRealtime()
  return React.useMemo(() => {
    if (!userId) return usageLogs
    return usageLogs.filter((log) => log.userId === userId)
  }, [usageLogs, userId])
}
