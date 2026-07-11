"use client"

import { WifiOff, AlertCircle, Radio } from "lucide-react"

type ConnectionStatus = "connecting" | "connected" | "error"

type ConnectionStatusBadgeProps = {
  connectionStatus: ConnectionStatus
  realtimeConnected: boolean
  isPolling: boolean
  loading?: boolean
}

export function ConnectionStatusBadge({
  connectionStatus,
  realtimeConnected,
  isPolling,
  loading = false,
}: ConnectionStatusBadgeProps) {
  const baseClasses =
    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 border-2 shadow-lg"

  if (connectionStatus === "error") {
    return (
      <div className={`${baseClasses} bg-red-500 text-white border-white`} title="Cannot reach the database">
        <WifiOff className="w-3 h-3" />
        <span>OFFLINE</span>
      </div>
    )
  }

  if (connectionStatus === "connecting" || loading) {
    return (
      <div
        className={`${baseClasses} bg-blue-400 text-white border-white animate-pulse`}
        title="Connecting to tournament data"
      >
        <AlertCircle className="w-3 h-3" />
        <span>CONNECTING</span>
      </div>
    )
  }

  if (realtimeConnected) {
    return (
      <div
        className={`${baseClasses} bg-green-400 text-white border-white animate-pulse`}
        title="Live updates via realtime"
      >
        <Radio className="w-3 h-3" />
        <span>LIVE</span>
      </div>
    )
  }

  if (isPolling) {
    return (
      <div
        className={`${baseClasses} bg-amber-500 text-white border-white`}
        title="Realtime unavailable — refreshing every 30 seconds"
      >
        <Radio className="w-3 h-3" />
        <span>POLLING</span>
      </div>
    )
  }

  return (
    <div
      className={`${baseClasses} bg-green-400 text-white border-white`}
      title="Connected"
    >
      <Radio className="w-3 h-3" />
      <span>CONNECTED</span>
    </div>
  )
}
