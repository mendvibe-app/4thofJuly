"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import Standings from "@/components/standings"
import type { Team, Match } from "@/types/tournament"

export default function StandingsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [poolPlayMatches, setPoolPlayMatches] = useState<Match[]>([])
  const router = useRouter()

  // Load data from localStorage on mount
  useEffect(() => {
    const savedTeams = localStorage.getItem("tournament-teams")
    const savedPoolPlayMatches = localStorage.getItem("pool-play-matches")

    if (savedTeams) setTeams(JSON.parse(savedTeams))
    if (savedPoolPlayMatches) setPoolPlayMatches(JSON.parse(savedPoolPlayMatches))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 via-white to-blue-100 p-2 sm:p-4 relative overflow-hidden">
      {/* Add patriotic background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-red-500 via-white to-blue-500"></div>
        <div className="absolute top-16 left-0 w-full h-32 bg-gradient-to-r from-blue-500 via-white to-red-500"></div>
        <div className="absolute top-32 left-0 w-full h-32 bg-gradient-to-r from-red-500 via-white to-blue-500"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-50 bg-transparent min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />🏠 Back to Tournament
          </Button>
        </div>

        {/* Standings Component */}
        {teams.length > 0 ? (
          <Standings teams={teams} matches={poolPlayMatches} showTitle={true} />
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-2xl font-bold text-blue-900 mb-2">No Tournament Data</h2>
            <p className="text-blue-700 mb-6">Start a tournament to see standings here!</p>
            <Button
              onClick={() => router.push("/")}
              className="bg-red-600 hover:bg-red-700 text-white font-bold min-h-[48px] px-6"
            >
              🚀 Start Tournament
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
