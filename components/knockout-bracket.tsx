"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Crown, Target, Zap, Shuffle, RotateCcw } from "lucide-react"
import type { Team, Match } from "@/types/tournament"

interface KnockoutBracketProps {
  matches: Match[]
  updateMatch: (matchId: number, updates: Partial<Match>) => Promise<void>
  createMatches: (matches: Omit<Match, "id">[]) => Promise<void>
  byeTeam: Team | null
}

export default function KnockoutBracket({ matches, updateMatch, createMatches, byeTeam }: KnockoutBracketProps) {
  const [editingMatch, setEditingMatch] = useState<number | null>(null)
  const [tempScores, setTempScores] = useState<{ team1: string; team2: string }>({ team1: "", team2: "" })

  // Group matches by round
  const matchesByRound = matches.reduce(
    (acc, match) => {
      const round = match.round || 1
      if (!acc[round]) acc[round] = []
      acc[round].push(match)
      return acc
    },
    {} as Record<number, Match[]>,
  )

  const rounds = Object.keys(matchesByRound)
    .map(Number)
    .sort((a, b) => a - b)

  // Calculate total expected rounds based on number of teams
  const totalTeams = matches.length > 0 ? Math.pow(2, Math.ceil(Math.log2(matches.length * 2))) : 0
  const expectedRounds = totalTeams > 0 ? Math.log2(totalTeams) : 0

  const getRoundName = (round: number) => {
    const roundsFromEnd = expectedRounds - round + 1
    if (roundsFromEnd === 1) return "Championship"
    if (roundsFromEnd === 2) return "Semifinals"
    if (roundsFromEnd === 3) return "Quarterfinals"
    return `Round ${round}`
  }

  const getTargetScore = (round: number) => {
    const roundsFromEnd = expectedRounds - round + 1
    // Semifinals and Championship are to 21, all others to 15
    return roundsFromEnd <= 2 ? 21 : 15
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

      // Check if we need to advance winners to next round
      await advanceWinners()
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

      // Check if we need to advance winners to next round
      await advanceWinners()
    } catch (error) {
      console.error("Error setting quick score:", error)
      alert("Failed to set score. Please try again.")
    }
  }

  const setWinnerScore = async (matchId: number, winnerIsTeam1: boolean, round: number) => {
    const targetScore = getTargetScore(round)
    const team1Score = winnerIsTeam1 ? targetScore : 0
    const team2Score = winnerIsTeam1 ? 0 : targetScore

    await setQuickScore(matchId, team1Score, team2Score)
  }

  const setCloseGameScore = async (matchId: number, winnerIsTeam1: boolean, round: number) => {
    const targetScore = getTargetScore(round)
    const closeScore = targetScore - 2
    const team1Score = winnerIsTeam1 ? targetScore : closeScore
    const team2Score = winnerIsTeam1 ? closeScore : targetScore

    await setQuickScore(matchId, team1Score, team2Score)
  }

  const advanceWinners = async () => {
    const currentRound = Math.max(...rounds)
    const currentRoundMatches = matchesByRound[currentRound] || []
    const completedMatches = currentRoundMatches.filter((match) => match.completed)

    // Check if all matches in current round are complete
    if (completedMatches.length === currentRoundMatches.length && completedMatches.length > 1) {
      // Create next round matches
      const winners = completedMatches.map((match) => {
        return match.team1Score > match.team2Score ? match.team1 : match.team2
      })

      // Handle bye team advancement
      if (byeTeam && currentRound === 1) {
        winners.unshift(byeTeam)
      }

      if (winners.length >= 2) {
        const nextRoundMatches: Omit<Match, "id">[] = []

        for (let i = 0; i < winners.length; i += 2) {
          if (i + 1 < winners.length) {
            nextRoundMatches.push({
              team1: winners[i],
              team2: winners[i + 1],
              team1Score: 0,
              team2Score: 0,
              completed: false,
              phase: "knockout",
              round: currentRound + 1,
            })
          }
        }

        if (nextRoundMatches.length > 0) {
          try {
            await createMatches(nextRoundMatches)
          } catch (error) {
            console.error("Error creating next round matches:", error)
          }
        }
      }
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
      console.log(`🎲 Generating random knockout scores for ${incompleteMatches.length} matches...`)

      for (let i = 0; i < incompleteMatches.length; i++) {
        const match = incompleteMatches[i]
        const targetScore = getTargetScore(match.round || 1)

        // Knockout games are more competitive
        const isCloseGame = Math.random() > 0.5 // 50% chance of close game

        let team1Score, team2Score
        if (isCloseGame) {
          // Close game
          const winner = Math.random() > 0.5
          const losingScore = targetScore - Math.floor(Math.random() * 4) - 1 // 1-4 points behind
          team1Score = winner ? targetScore : losingScore
          team2Score = winner ? losingScore : targetScore
        } else {
          // More decisive win
          const winner = Math.random() > 0.5
          const losingScore = Math.floor(Math.random() * 8) + Math.floor(targetScore * 0.4) // 40-75% of target
          team1Score = winner ? targetScore : losingScore
          team2Score = winner ? losingScore : targetScore
        }

        await updateMatch(match.id, {
          team1Score,
          team2Score,
          completed: true,
        })

        console.log(
          `✅ Knockout match ${i + 1}/${incompleteMatches.length}: ${match.team1.name} ${team1Score}-${team2Score} ${match.team2.name}`,
        )

        // Small delay between updates
        if (i < incompleteMatches.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 200))
        }
      }

      // Advance winners after all scores are set
      console.log("🏆 Advancing winners to next round...")
      await advanceWinners()

      console.log("🎉 All knockout scores generated and winners advanced!")
    } catch (error) {
      console.error("❌ Error generating random scores:", error)
      alert(`Failed to generate random scores: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const resetAllScores = async () => {
    if (!confirm("Reset all bracket scores? This will remove all rounds except the first.")) return

    try {
      // Reset all matches to incomplete
      for (const match of matches) {
        await updateMatch(match.id, {
          team1Score: 0,
          team2Score: 0,
          completed: false,
        })
      }
    } catch (error) {
      console.error("Error resetting scores:", error)
      alert("Failed to reset scores. Please try again.")
    }
  }

  const getChampion = () => {
    const finalRound = Math.max(...rounds)
    const finalMatch = matchesByRound[finalRound]?.[0]

    if (finalMatch?.completed) {
      return finalMatch.team1Score > finalMatch.team2Score ? finalMatch.team1 : finalMatch.team2
    }
    return null
  }

  const champion = getChampion()

  if (matches.length === 0) {
    return (
      <Card className="bg-white border-0 shadow-sm">
        <CardContent className="p-12 text-center">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Knockout Bracket Yet</h3>
          <p className="text-gray-600">Complete pool play matches to generate the knockout bracket.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Champion Banner */}
      {champion && (
        <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300">
          <CardContent className="p-6 text-center">
            <Crown className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-yellow-900 mb-2">🏆 TOURNAMENT CHAMPION! 🏆</h2>
            <h3 className="text-xl font-semibold text-yellow-800">{champion.name}</h3>
            <p className="text-yellow-700 mt-2">{champion.players.join(" & ")}</p>
          </CardContent>
        </Card>
      )}

      {/* Testing Tools */}
      <Card className="bg-amber-50 border-amber-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900">Testing Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              Reset Bracket
            </Button>
          </div>
          <p className="text-sm text-amber-800 text-center">Testing tools for quick bracket simulation</p>
        </CardContent>
      </Card>

      {/* Bye Team Display */}
      {byeTeam && (
        <Card className="bg-blue-50 border-blue-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Zap className="w-5 h-5 text-blue-600" />
              Bye Round
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-4 bg-blue-100 rounded-lg">
              <h3 className="font-semibold text-blue-900">{byeTeam.name}</h3>
              <p className="text-sm text-blue-700">{byeTeam.players.join(" & ")}</p>
              <Badge className="mt-2 bg-blue-200 text-blue-800">Advances Automatically</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bracket Rounds */}
      {rounds.map((round) => (
        <Card key={round} className="bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Trophy className="w-5 h-5 text-amber-600" />
              {getRoundName(round)}
              <Badge variant="outline" className="ml-2 text-xs">
                Games to {getTargetScore(round)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {matchesByRound[round].map((match) => (
                <div
                  key={match.id}
                  className={`p-6 rounded-lg border-2 transition-all duration-200 ${
                    match.completed
                      ? "border-green-200 bg-green-50"
                      : editingMatch === match.id
                        ? "border-blue-300 bg-blue-50"
                        : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-lg text-gray-900">{match.team1.name}</span>
                        <span className="text-3xl font-bold text-gray-900">
                          {editingMatch === match.id ? (
                            <Input
                              type="number"
                              value={tempScores.team1}
                              onChange={(e) => setTempScores({ ...tempScores, team1: e.target.value })}
                              className="w-20 h-12 text-center text-2xl font-bold"
                              min="0"
                            />
                          ) : (
                            match.team1Score
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-lg text-gray-900">{match.team2.name}</span>
                        <span className="text-3xl font-bold text-gray-900">
                          {editingMatch === match.id ? (
                            <Input
                              type="number"
                              value={tempScores.team2}
                              onChange={(e) => setTempScores({ ...tempScores, team2: e.target.value })}
                              className="w-20 h-12 text-center text-2xl font-bold"
                              min="0"
                            />
                          ) : (
                            match.team2Score
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="ml-6 flex flex-col gap-3">
                      {editingMatch === match.id ? (
                        <div className="flex gap-2">
                          <Button
                            size="lg"
                            onClick={() => handleScoreUpdate(match.id)}
                            className="flag-gradient h-12 px-6 font-semibold"
                          >
                            Save Score
                          </Button>
                          <Button
                            size="lg"
                            variant="outline"
                            onClick={cancelEditing}
                            className="border-gray-300 text-gray-700 hover:bg-gray-50 h-12 px-6 bg-transparent"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <Button
                            size="lg"
                            variant="outline"
                            onClick={() => startEditing(match)}
                            className="border-gray-300 text-gray-700 hover:bg-gray-50 h-12 px-6 font-medium"
                          >
                            {match.completed ? "Edit Score" : "Enter Score"}
                          </Button>
                          {!match.completed && (
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setWinnerScore(match.id, true, round)}
                                className="border-green-300 text-green-700 hover:bg-green-50 h-10 px-3 text-sm font-medium"
                              >
                                {match.team1.name} Wins ({getTargetScore(round)}-0)
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setWinnerScore(match.id, false, round)}
                                className="border-green-300 text-green-700 hover:bg-green-50 h-10 px-3 text-sm font-medium"
                              >
                                {match.team2.name} Wins ({getTargetScore(round)}-0)
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setCloseGameScore(match.id, true, round)}
                                className="border-blue-300 text-blue-700 hover:bg-blue-50 h-10 px-3 text-sm font-medium"
                              >
                                Close Game ({getTargetScore(round)}-{getTargetScore(round) - 2})
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setCloseGameScore(match.id, false, round)}
                                className="border-blue-300 text-blue-700 hover:bg-blue-50 h-10 px-3 text-sm font-medium"
                              >
                                Close Game ({getTargetScore(round) - 2}-{getTargetScore(round)})
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {match.completed && (
                    <div className="mt-4 text-center">
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        <Target className="w-3 h-3 mr-1" />
                        Winner: {match.team1Score > match.team2Score ? match.team1.name : match.team2.name}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
