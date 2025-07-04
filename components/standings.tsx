"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trophy } from "lucide-react"
import type { Team, Match } from "@/types/tournament"

interface StandingsProps {
  teams: Team[]
  matches: Match[]
  showTitle?: boolean
}

export default function Standings({ teams, matches, showTitle = true }: StandingsProps) {
  // Calculate team standings
  const calculateStandings = () => {
    const standings = teams.map((team) => {
      const teamMatches = matches.filter(
        (match) => (match.team1.id === team.id || match.team2.id === team.id) && match.completed,
      )

      let wins = 0
      let losses = 0
      let pointsFor = 0
      let pointsAgainst = 0

      teamMatches.forEach((match) => {
        if (match.team1.id === team.id) {
          pointsFor += match.team1Score
          pointsAgainst += match.team2Score
          if (match.team1Score > match.team2Score) wins++
          else losses++
        } else {
          pointsFor += match.team2Score
          pointsAgainst += match.team1Score
          if (match.team2Score > match.team1Score) wins++
          else losses++
        }
      })

      return {
        ...team,
        wins,
        losses,
        pointsFor,
        pointsAgainst,
        pointDifferential: pointsFor - pointsAgainst,
        gamesPlayed: teamMatches.length,
      }
    })

    // Sort by wins (desc), then point differential (desc)
    return standings.sort((a, b) => {
      if (a.wins !== b.wins) return b.wins - a.wins
      return b.pointDifferential - a.pointDifferential
    })
  }

  const getPositionIcon = (position: number, totalTeams: number) => {
    if (position === 1) return "🔥"
    if (position === 2) return "💪"
    if (position === 3) return "👏"
    if (position === totalTeams) return "🍻"
    return ""
  }

  const getPositionBadge = (position: number, totalTeams: number) => {
    if (position === 1) return { text: "1st Place", color: "bg-yellow-600 text-white" }
    if (position === 2) return { text: "2nd Place", color: "bg-gray-400 text-white" }
    if (position === 3) return { text: "3rd Place", color: "bg-orange-600 text-white" }
    if (position === totalTeams) return { text: "Last Place", color: "bg-red-500 text-white" }
    return { text: `${position}th Place`, color: "bg-blue-500 text-white" }
  }

  const standings = calculateStandings()
  const completedMatches = matches.filter((match) => match.completed).length
  const totalMatches = matches.length

  return (
    <div className="space-y-6">
      {showTitle && (
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-red-600 via-blue-600 to-red-600 bg-clip-text text-transparent mb-2 flex items-center justify-center gap-2">
            <Trophy className="w-8 h-8 text-red-600" />
            🇺🇸 Tournament Standings 🏆
          </h1>
          <p className="text-blue-800 font-semibold">🏆 Pool Play Rankings & Statistics</p>
        </div>
      )}

      {/* Progress Summary */}
      <Card className="border-2 border-blue-300 bg-gradient-to-r from-red-50 via-white to-blue-50 shadow-lg">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-red-700 font-semibold">🏆 Matches Completed</p>
              <p className="text-2xl font-bold text-blue-800">
                {completedMatches}/{totalMatches}
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-700 font-semibold">⚽ Teams Playing</p>
              <p className="text-2xl font-bold text-red-800">{teams.length}</p>
            </div>
            <div>
              <p className="text-sm text-red-700 font-semibold">🎯 Games per Team</p>
              <p className="text-2xl font-bold text-blue-800">{teams.length - 1}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Standings Table */}
      <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-white shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-100 to-red-100">
          <CardTitle className="flex items-center gap-2 text-red-900">
            <Trophy className="w-5 h-5 text-blue-600" />🏆 Current Standings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center font-bold">Rank</TableHead>
                  <TableHead className="min-w-[140px] font-bold">Team</TableHead>
                  <TableHead className="text-center font-bold">W-L</TableHead>
                  <TableHead className="text-center font-bold">PF</TableHead>
                  <TableHead className="text-center font-bold">PA</TableHead>
                  <TableHead className="text-center font-bold">Diff</TableHead>
                  <TableHead className="text-center font-bold">GP</TableHead>
                  <TableHead className="text-center font-bold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standings.map((team, index) => {
                  const position = index + 1
                  const positionIcon = getPositionIcon(position, standings.length)
                  const positionBadge = getPositionBadge(position, standings.length)

                  return (
                    <TableRow
                      key={team.id}
                      className={`${
                        position === 1
                          ? "bg-gradient-to-r from-yellow-50 to-yellow-100"
                          : position === 2
                            ? "bg-gradient-to-r from-gray-50 to-gray-100"
                            : position === 3
                              ? "bg-gradient-to-r from-orange-50 to-orange-100"
                              : position === standings.length
                                ? "bg-gradient-to-r from-red-50 to-red-100"
                                : ""
                      }`}
                    >
                      <TableCell className="font-bold text-center text-lg">
                        <div className="flex items-center justify-center gap-1">
                          <span>{position}</span>
                          {positionIcon && <span className="text-xl">{positionIcon}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[140px]">
                        <div>
                          <p className="font-semibold text-base">{team.name}</p>
                          <p className="text-xs text-gray-600 break-words">{team.players.join(" & ")}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        <span
                          className={`${
                            team.wins > team.losses
                              ? "text-green-600"
                              : team.wins < team.losses
                                ? "text-red-600"
                                : "text-blue-600"
                          }`}
                        >
                          {team.wins}-{team.losses}
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-medium">{team.pointsFor}</TableCell>
                      <TableCell className="text-center font-medium">{team.pointsAgainst}</TableCell>
                      <TableCell
                        className={`text-center font-semibold ${
                          team.pointDifferential >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {team.pointDifferential > 0 ? "+" : ""}
                        {team.pointDifferential}
                      </TableCell>
                      <TableCell className="text-center font-medium">{team.gamesPlayed}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={`text-xs px-2 py-1 ${positionBadge.color}`}>{positionBadge.text}</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Position Legends */}
      <Card className="border-2 border-green-300 bg-gradient-to-r from-green-50 to-blue-50 shadow-lg">
        <CardContent className="pt-4">
          <div className="text-center">
            <h3 className="text-lg font-bold text-green-800 mb-3">🏆 Position Guide</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center justify-center gap-2 p-2 bg-yellow-100 rounded-lg border border-yellow-300">
                <span className="text-2xl">🔥</span>
                <span className="font-semibold text-yellow-800">1st Place</span>
              </div>
              <div className="flex items-center justify-center gap-2 p-2 bg-gray-100 rounded-lg border border-gray-300">
                <span className="text-2xl">💪</span>
                <span className="font-semibold text-gray-800">2nd Place</span>
              </div>
              <div className="flex items-center justify-center gap-2 p-2 bg-orange-100 rounded-lg border border-orange-300">
                <span className="text-2xl">👏</span>
                <span className="font-semibold text-orange-800">3rd Place</span>
              </div>
              <div className="flex items-center justify-center gap-2 p-2 bg-red-100 rounded-lg border border-red-300">
                <span className="text-2xl">🍻</span>
                <span className="font-semibold text-red-800">Last Place</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Legend */}
      <Card className="border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-white shadow-lg">
        <CardContent className="pt-4">
          <div className="text-center">
            <h3 className="text-lg font-bold text-blue-800 mb-3">📊 Statistics Guide</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <p className="font-semibold text-blue-900">W-L</p>
                <p className="text-blue-700">Wins - Losses</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-blue-900">PF</p>
                <p className="text-blue-700">Points For</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-blue-900">PA</p>
                <p className="text-blue-700">Points Against</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-blue-900">GP</p>
                <p className="text-blue-700">Games Played</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
