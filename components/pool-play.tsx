"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trophy, Users, Target, TrendingUp, Settings, Zap, Shuffle, RotateCcw } from "lucide-react"
import type { Team, Match } from "@/types/tournament"

interface PoolPlayProps {
  teams: Team[]
  matches: Match[]
  updateMatch: (matchId: number, updates: Partial<Match>) => Promise<void>
  createMatches: (matches: Omit<Match, "id">[]) => Promise<void>
  onAdvanceToKnockout: () => void
  setByeTeamId: (teamId: number | null) => Promise<void>
}

export default function PoolPlay({
  teams,
  matches,
  updateMatch,
  createMatches,
  onAdvanceToKnockout,
  setByeTeamId,
}: PoolPlayProps) {
  const [gamesPerTeam, setGamesPerTeam] = useState(3)
  const [isGenerating, setIsGenerating] = useState(false)
  const [editingMatch, setEditingMatch] = useState<number | null>(null)
  const [tempScores, setTempScores] = useState<{ team1: string; team2: string }>({ team1: "", team2: "" })

  // Calculate team standings
  const calculateStandings = () => {
    const standings = teams.map((team) => {
      const teamMatches = matches.filter((match) => match.team1.id === team.id || match.team2.id === team.id)
      const completedMatches = teamMatches.filter((match) => match.completed)

      let wins = 0
      let losses = 0
      let pointsFor = 0
      let pointsAgainst = 0

      completedMatches.forEach((match) => {
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

      const pointDifferential = pointsFor - pointsAgainst
      const winPercentage = completedMatches.length > 0 ? wins / completedMatches.length : 0

      return {
        ...team,
        wins,
        losses,
        pointsFor,
        pointsAgainst,
        pointDifferential,
        winPercentage,
        gamesPlayed: completedMatches.length,
      }
    })

    // Sort by win percentage, then point differential, then points for
    return standings.sort((a, b) => {
      if (b.winPercentage !== a.winPercentage) return b.winPercentage - a.winPercentage
      if (b.pointDifferential !== a.pointDifferential) return b.pointDifferential - a.pointDifferential
      return b.pointsFor - a.pointsFor
    })
  }

  const generateMatches = async () => {
    if (teams.length < 4) return

    setIsGenerating(true)
    try {
      const newMatches: Omit<Match, "id">[] = []
      const totalGames = Math.min(gamesPerTeam, teams.length - 1)

      // Create round-robin style matches
      for (let i = 0; i < teams.length; i++) {
        let gamesForTeam = 0
        for (let j = i + 1; j < teams.length && gamesForTeam < totalGames; j++) {
          // Check if this matchup already exists
          const existingMatch = matches.find(
            (match) =>
              (match.team1.id === teams[i].id && match.team2.id === teams[j].id) ||
              (match.team1.id === teams[j].id && match.team2.id === teams[i].id),
          )

          if (!existingMatch) {
            newMatches.push({
              team1: teams[i],
              team2: teams[j],
              team1Score: 0,
              team2Score: 0,
              completed: false,
              phase: "pool-play",
              round: null,
            })
            gamesForTeam++
          }
        }
      }

      if (newMatches.length > 0) {
        await createMatches(newMatches)
      }
    } catch (error) {
      console.error("Error generating matches:", error)
      alert("Failed to generate matches. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const generateKnockoutBracket = async () => {
    const standings = calculateStandings()
    const completedMatches = matches.filter((match) => match.completed)

    if (completedMatches.length === 0) {
      alert("Please complete some pool play matches first!")
      return
    }

    try {
      // Determine how many teams advance (minimum 4, maximum 8, or all teams if 8 or fewer)
      let advancingTeams = Math.min(8, Math.max(4, teams.length))

      // For odd numbers, ensure we have an even number for bracket
      if (advancingTeams % 2 !== 0 && advancingTeams < teams.length) {
        advancingTeams += 1
      }

      // If we have exactly the number of teams as advancing spots, all advance
      if (teams.length <= 8) {
        advancingTeams = teams.length
      }

      console.log(`Teams: ${teams.length}, Advancing: ${advancingTeams}`)

      const topTeams = standings.slice(0, advancingTeams)

      // Handle bye team for odd numbers
      let byeTeam = null
      let bracketTeams = topTeams

      if (topTeams.length % 2 !== 0) {
        // Give bye to top seed
        byeTeam = topTeams[0]
        bracketTeams = topTeams.slice(1)
        await setByeTeamId(byeTeam.id)
        console.log(`Bye team: ${byeTeam.name}`)
      } else {
        await setByeTeamId(null)
      }

      // Create first round matches with proper seeding
      const knockoutMatches: Omit<Match, "id">[] = []
      const numMatches = Math.floor(bracketTeams.length / 2)

      for (let i = 0; i < numMatches; i++) {
        const team1 = bracketTeams[i]
        const team2 = bracketTeams[bracketTeams.length - 1 - i]

        knockoutMatches.push({
          team1,
          team2,
          team1Score: 0,
          team2Score: 0,
          completed: false,
          phase: "knockout",
          round: 1,
        })
      }

      if (knockoutMatches.length > 0) {
        await createMatches(knockoutMatches)
      }

      onAdvanceToKnockout()
    } catch (error) {
      console.error("Error generating knockout bracket:", error)
      alert("Failed to generate knockout bracket. Please try again.")
    }
  }

  const handleScoreUpdate = async (matchId: number) => {
    const team1Score = Number.parseInt(tempScores.team1) || 0
    const team2Score = Number.parseInt(tempScores.team2) || 0

    if (team1Score < 0 || team2Score < 0) {
      alert("Scores cannot be negative!")
      return
    }

    try {
      await updateMatch(matchId, {
        team1Score,
        team2Score,
        completed: true,
      })

      setEditingMatch(null)
      setTempScores({ team1: "", team2: "" })
    } catch (error) {
      console.error("Error updating match:", error)
      alert("Failed to update match. Please try again.")
    }
  }

  const startEditing = (match: Match) => {
    setEditingMatch(match.id)
    setTempScores({
      team1: match.team1Score.toString(),
      team2: match.team2Score.toString(),
    })
  }

  const cancelEditing = () => {
    setEditingMatch(null)
    setTempScores({ team1: "", team2: "" })
  }

  const setQuickScore = async (matchId: number, team1Score: number, team2Score: number) => {
    try {
      await updateMatch(matchId, {
        team1Score,
        team2Score,
        completed: true,
      })
    } catch (error) {
      console.error("Error setting quick score:", error)
      alert("Failed to set score. Please try again.")
    }
  }

  const generateRandomScores = async () => {
    const incompleteMatches = matches.filter((match) => !match.completed)

    if (incompleteMatches.length === 0) {
      alert("No incomplete matches to score!")
      return
    }

    if (!confirm(`Generate random scores for ${incompleteMatches.length} matches?`)) return

    try {
      console.log(`🎲 Generating random scores for ${incompleteMatches.length} matches...`)

      for (let i = 0; i < incompleteMatches.length; i++) {
        const match = incompleteMatches[i]

        // More realistic scoring - games typically go to 21
        const isCloseGame = Math.random() > 0.6 // 40% chance of close game
        const isBlowout = Math.random() > 0.8 // 20% chance of blowout

        let team1Score, team2Score

        if (isBlowout) {
          // Blowout game
          const winner = Math.random() > 0.5
          team1Score = winner ? 21 : Math.floor(Math.random() * 8) + 5 // 5-12 points
          team2Score = winner ? Math.floor(Math.random() * 8) + 5 : 21
        } else if (isCloseGame) {
          // Close game
          const winner = Math.random() > 0.5
          const losingScore = Math.floor(Math.random() * 4) + 17 // 17-20 points
          team1Score = winner ? 21 : losingScore
          team2Score = winner ? losingScore : 21
        } else {
          // Normal game
          const winner = Math.random() > 0.5
          const losingScore = Math.floor(Math.random() * 8) + 10 // 10-17 points
          team1Score = winner ? 21 : losingScore
          team2Score = winner ? losingScore : 21
        }

        await updateMatch(match.id, {
          team1Score,
          team2Score,
          completed: true,
        })

        console.log(
          `✅ Match ${i + 1}/${incompleteMatches.length}: ${match.team1.name} ${team1Score}-${team2Score} ${match.team2.name}`,
        )

        // Small delay to avoid overwhelming the database
        if (i < incompleteMatches.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      }

      console.log("🎉 All random scores generated successfully!")
    } catch (error) {
      console.error("❌ Error generating random scores:", error)
      alert(`Failed to generate random scores: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const resetAllScores = async () => {
    if (matches.length === 0) {
      alert("No matches to reset!")
      return
    }

    if (!confirm(`Reset all ${matches.length} match scores? This cannot be undone.`)) return

    try {
      console.log(`🔄 Resetting ${matches.length} match scores...`)

      for (let i = 0; i < matches.length; i++) {
        const match = matches[i]
        await updateMatch(match.id, {
          team1Score: 0,
          team2Score: 0,
          completed: false,
        })

        console.log(`✅ Reset match ${i + 1}/${matches.length}`)

        // Small delay to avoid overwhelming the database
        if (i < matches.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 50))
        }
      }

      console.log("🎉 All match scores reset successfully!")
    } catch (error) {
      console.error("❌ Error resetting scores:", error)
      alert(`Failed to reset scores: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const standings = calculateStandings()
  const completedMatches = matches.filter((match) => match.completed).length
  const totalMatches = matches.length
  const progressPercentage = totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Pool Play Setup */}
      {matches.length === 0 && (
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Settings className="w-5 h-5 text-blue-600" />
              Pool Play Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-900">Games per team:</label>
              <Input
                type="number"
                min="1"
                max={teams.length - 1}
                value={gamesPerTeam}
                onChange={(e) => setGamesPerTeam(Number.parseInt(e.target.value) || 1)}
                className="w-20 h-10"
              />
              <span className="text-sm text-gray-600">(max {teams.length - 1} vs all other teams)</span>
            </div>
            <Button
              onClick={generateMatches}
              disabled={isGenerating || teams.length < 4}
              className="flag-gradient h-12 font-semibold transition-all duration-200"
            >
              {isGenerating ? "Generating..." : `Generate Pool Play (${teams.length} teams)`}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Testing Tools - Always Visible */}
      <Card className="bg-amber-50 border-amber-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900">Testing Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              onClick={generateRandomScores}
              variant="outline"
              className="border-amber-300 text-amber-700 hover:bg-amber-100 h-11 font-medium bg-transparent"
            >
              <Shuffle className="w-4 h-4 mr-2" />
              Random Scores
            </Button>
            <Button
              onClick={resetAllScores}
              variant="outline"
              className="border-amber-300 text-amber-700 hover:bg-amber-100 h-11 font-medium bg-transparent"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Scores
            </Button>
            <Button
              onClick={generateKnockoutBracket}
              variant="outline"
              disabled={completedMatches === 0}
              className="border-amber-300 text-amber-700 hover:bg-amber-100 h-11 font-medium bg-transparent"
            >
              <Zap className="w-4 h-4 mr-2" />
              Quick Bracket
            </Button>
          </div>
          <p className="text-sm text-amber-800 text-center">Testing tools for quick tournament simulation</p>
        </CardContent>
      </Card>

      {/* Progress Overview */}
      {matches.length > 0 && (
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Pool Play Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                  Matches Completed: {completedMatches}/{totalMatches}
                </span>
                <span className="text-sm font-bold text-green-600">{progressPercentage.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              {progressPercentage >= 50 && (
                <Button
                  onClick={generateKnockoutBracket}
                  className="flag-gradient h-12 font-semibold w-full transition-all duration-200"
                >
                  <Trophy className="w-5 h-5 mr-2" />
                  Advance to Knockout Bracket
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Standings */}
      {matches.length > 0 && (
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Trophy className="w-5 h-5 text-amber-600" />
              Current Standings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-center">W-L</TableHead>
                  <TableHead className="text-center">PF</TableHead>
                  <TableHead className="text-center">PA</TableHead>
                  <TableHead className="text-center">Diff</TableHead>
                  <TableHead className="text-center">GP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standings.map((team, index) => (
                  <TableRow key={team.id} className={index < 4 ? "bg-green-50" : ""}>
                    <TableCell className="font-medium">
                      {index + 1}
                      {index < 4 && <Badge className="ml-2 bg-green-100 text-green-800">Q</Badge>}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-semibold text-gray-900">{team.name}</div>
                        <div className="text-sm text-gray-600">{team.players.join(" & ")}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {team.wins}-{team.losses}
                    </TableCell>
                    <TableCell className="text-center">{team.pointsFor}</TableCell>
                    <TableCell className="text-center">{team.pointsAgainst}</TableCell>
                    <TableCell className="text-center">
                      <span className={team.pointDifferential >= 0 ? "text-green-600" : "text-red-600"}>
                        {team.pointDifferential > 0 ? "+" : ""}
                        {team.pointDifferential}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">{team.gamesPlayed}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Matches */}
      {matches.length > 0 && (
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Users className="w-5 h-5 text-blue-600" />
              Pool Play Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {matches.map((match) => (
                <div
                  key={match.id}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    match.completed
                      ? "border-green-200 bg-green-50"
                      : editingMatch === match.id
                        ? "border-blue-300 bg-blue-50"
                        : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900">{match.team1.name}</span>
                        <span className="text-2xl font-bold text-gray-900">
                          {editingMatch === match.id ? (
                            <Input
                              type="number"
                              value={tempScores.team1}
                              onChange={(e) => setTempScores({ ...tempScores, team1: e.target.value })}
                              className="w-16 h-8 text-center text-lg font-bold"
                              min="0"
                            />
                          ) : (
                            match.team1Score
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">{match.team2.name}</span>
                        <span className="text-2xl font-bold text-gray-900">
                          {editingMatch === match.id ? (
                            <Input
                              type="number"
                              value={tempScores.team2}
                              onChange={(e) => setTempScores({ ...tempScores, team2: e.target.value })}
                              className="w-16 h-8 text-center text-lg font-bold"
                              min="0"
                            />
                          ) : (
                            match.team2Score
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="ml-4 flex flex-col gap-2">
                      {editingMatch === match.id ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleScoreUpdate(match.id)}
                            className="flag-gradient h-10 px-4 font-medium"
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEditing}
                            className="border-gray-300 text-gray-700 hover:bg-gray-50 h-10 px-4 bg-transparent"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditing(match)}
                            className="border-gray-300 text-gray-700 hover:bg-gray-50 h-10 px-4"
                          >
                            {match.completed ? "Edit" : "Enter Score"}
                          </Button>
                          {!match.completed && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setQuickScore(match.id, 21, 0)}
                                className="border-green-300 text-green-700 hover:bg-green-50 h-8 px-2 text-xs"
                              >
                                21-0
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setQuickScore(match.id, 0, 21)}
                                className="border-green-300 text-green-700 hover:bg-green-50 h-8 px-2 text-xs"
                              >
                                0-21
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setQuickScore(match.id, 21, 19)}
                                className="border-blue-300 text-blue-700 hover:bg-blue-50 h-8 px-2 text-xs"
                              >
                                21-19
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {match.completed && (
                    <div className="mt-2 text-center">
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        <Target className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
