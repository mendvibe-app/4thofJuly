"use client"

import { Button } from "@/components/ui/button"
import { Home, Flag, Users, Play, Trophy, BarChart3 } from "lucide-react"
import { useRouter } from "next/navigation"
import Standings from "@/components/standings"
import { useTournamentData } from "@/hooks/use-tournament-data"

export default function StandingsPage() {
  const router = useRouter()
  const { teams, poolPlayMatches, loading, connectionStatus, currentPhase, updateTournamentPhase } = useTournamentData()

  const navigationItems = [
    { id: "registration", label: "Teams", icon: Users, badge: teams.length },
    { id: "pool-play", label: "Pool Play", icon: Play, badge: poolPlayMatches.filter(m => m.completed).length },
    { id: "knockout", label: "Bracket", icon: Trophy, badge: 0 },
    { id: "standings", label: "Standings", icon: BarChart3, current: true },
    { id: "rules", label: "Rules", icon: Flag, isExternal: true },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="text-8xl mb-6">🔄</div>
          <h2 className="text-3xl font-bold text-white mb-4 outdoor-text">Loading Tournament Data...</h2>
          <p className="text-xl text-blue-300 outdoor-text">Please wait while we load the standings</p>
        </div>
      </div>
    )
  }

  if (connectionStatus === "error") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="text-8xl mb-6">❌</div>
          <h2 className="text-3xl font-bold text-red-400 mb-4 outdoor-text">Connection Error</h2>
          <p className="text-xl text-red-300 mb-8 outdoor-text">Failed to load tournament data from database</p>
          <Button
            onClick={() => router.push("/")}
            className="touch-target bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 outdoor-text"
          >
            <Home className="w-5 h-5 mr-3" />
            🏠 Return to Tournament
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 relative">
      {/* Patriotic Header */}
      <header className="sticky-header usa-header-gradient">
        <div className="safe-area-top">
          <div className="px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 text-center">
                <h1 className="text-2xl sm:text-3xl font-black text-white">
                  🇺🇸 Tournament Standings 🇺🇸
                </h1>
                <p className="text-lg font-semibold text-white opacity-90">
                  16th Annual • Harbor Way Soccer Tennis
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 pb-24">

        {/* Standings Component */}
        {teams.length > 0 ? (
          <Standings teams={teams} matches={poolPlayMatches} showTitle={true} />
        ) : (
          <div className="text-center py-16 max-w-md mx-auto">
            <div className="text-8xl mb-6">🏆</div>
            <h2 className="text-3xl font-bold text-white mb-4 outdoor-text">No Tournament Data</h2>
            <p className="text-xl text-blue-300 mb-8 outdoor-text">Start a tournament to see standings here!</p>
            <Button
              onClick={() => router.push("/")}
              className="touch-target bg-red-600 hover:bg-red-700 text-white font-bold px-8 outdoor-text"
            >
              <Home className="w-5 h-5 mr-3" />
              🚀 Start Tournament
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Navigation - Mobile First */}
      <nav className="bottom-nav">
        <div className="flex">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = item.current || currentPhase === item.id
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "standings") {
                    // Already on standings page
                    return
                  }
                  if (item.id === "rules") {
                    router.push("/rules")
                    return
                  }
                  router.push("/")
                  setTimeout(() => updateTournamentPhase(item.id as any), 100)
                }}
                className={`
                  bottom-nav-item relative
                  ${isActive ? 'active' : ''}
                `}
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-sm font-medium">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center border-2 border-white">
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
