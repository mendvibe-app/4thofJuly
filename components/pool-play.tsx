"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trophy, Users, Target, TrendingUp, Settings, Zap, Shuffle, RotateCcw } from "lucide-react"
import type { Team, Match } from "@/types/tournament"
import { useAdmin } from "@/hooks/use-admin"
import { calculateStandings, generatePoolPlaySchedule } from "@/lib/pool-play"

interface PoolPlayProps {
  teams: Team[]
  matches: Match[]
  updateMatch: (matchId: number, updates: Partial<Match>) => Promise<void>
  createMatches: (matches: Array<Omit<Match, "id" | "tournamentId" | "tournament"> & { tournamentId?: number }>) => Promise<void>
  onAdvanceToKnockout: () => void
  setByeTeamId: (teamId: number | null) => Promise<void>
  resetTournament?: () => Promise<void>
}

export default function PoolPlay({
  teams,
  matches,
  updateMatch,
  createMatches,
  onAdvanceToKnockout,
  setByeTeamId,
  resetTournament,
}: PoolPlayProps) {
  const { isAdmin, requireAdmin } = useAdmin()
  const [gamesPerTeam, setGamesPerTeam] = useState(3)
  const [isGenerating, setIsGenerating] = useState(false)
  const [editingMatch, setEditingMatch] = useState<number | null>(null)
  const [team1Score, setTeam1Score] = useState("")
  const [team2Score, setTeam2Score] = useState("")

  // Calculate team standings
  // (pure logic lives in lib/pool-play)

  const generateMatches = async () => {
    if (!requireAdmin("generate pool play matches")) return
    if (teams.length < 4) return

    setIsGenerating(true)
    try {
      const result = generatePoolPlaySchedule(teams, matches, {
        gamesPerTeam,
      })

      if (!result.ok) {
        alert(`Error: ${result.error}`)
        return
      }

      if (result.matches.length > 0) {
        await createMatches(result.matches)
      } else {
        alert("All teams already have enough games — nothing new to generate.")
      }
    } catch (error) {
      console.error("Error generating matches:", error)
      alert("Failed to generate matches. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const generateKnockoutBracket = async () => {
    if (!requireAdmin("generate the knockout bracket")) return

    const standings = calculateStandings(teams, matches)
    const completedMatches = matches.filter((match) => match.completed)
    
    if (completedMatches.length === 0) {
      alert("Please complete some pool play matches first!")
      return
    }

    try {
      // NEW SYSTEM: Include ALL teams in knockout phase
      const allTeams = standings // All teams advance, no eliminations
      
      // VALIDATION: Check for duplicate teams
      const teamIds = allTeams.map(t => t.id)
      const uniqueTeamIds = [...new Set(teamIds)]
      if (teamIds.length !== uniqueTeamIds.length) {
        console.error(`❌ BUG DETECTED: Duplicate teams in standings!`, allTeams.map(t => `${t.name}(${t.id})`))
        alert("Error: Duplicate teams detected in standings. Please contact admin.")
        return
      }
      
      // Calculate bracket size as next power of 2 >= total teams
      const bracketSize = Math.pow(2, Math.ceil(Math.log2(allTeams.length)))
      const byesNeeded = bracketSize - allTeams.length
      
      console.log(`👥 ${allTeams.length} teams advance (NO eliminations)`)
      
      // DETAILED SEEDING DEBUG
      allTeams.forEach((team, index) => {
        console.log(`  #${index + 1}: ${team.name} (${team.wins}W-${team.losses}L, +${team.pointsFor - team.pointsAgainst})`)
      })
      
      // Distribute byes to top seeds
      const byeTeams = allTeams.slice(0, byesNeeded)
      const playingTeams = allTeams.slice(byesNeeded)
      
      // VALIDATION: Ensure no team appears in both bye and playing lists
      const byeTeamIds = new Set(byeTeams.map(t => t.id))
      const playingTeamIds = new Set(playingTeams.map(t => t.id))
      const overlap = [...byeTeamIds].filter(id => playingTeamIds.has(id))
      if (overlap.length > 0) {
        console.error(`❌ BUG DETECTED: Teams appear in both bye and playing lists!`, overlap)
        alert("Error: Team assignment conflict detected. Please contact admin.")
        return
      }
      
      console.log(`👋 Teams with BYES (${byeTeams.length}):`)
      byeTeams.forEach((team, index) => {
      })
      
      console.log(`🥊 Teams PLAYING first round (${playingTeams.length}):`)
      playingTeams.forEach((team, index) => {
        const actualSeed = allTeams.findIndex(t => t.id === team.id) + 1
      })
      
      // Set bye teams (for now, just track the #1 seed as primary bye)
      if (byeTeams.length > 0) {
        await setByeTeamId(byeTeams[0].id) // Primary bye team for UI
        if (byeTeams.length > 1) {
          console.log(`✅ Additional byes: ${byeTeams.slice(1).map(t => `#${allTeams.findIndex(team => team.id === t.id) + 1} ${t.name}`).join(', ')}`)
        }
      } else {
        await setByeTeamId(null)
      }

      // Create first round matches with proper seeding
      const knockoutMatches: Array<Omit<Match, "id" | "tournamentId" | "tournament"> & { tournamentId?: number }> = []
      const numMatches = Math.floor(playingTeams.length / 2)

      
      // Create matches with proper tournament seeding (highest vs lowest remaining)
      for (let i = 0; i < numMatches; i++) {
        const team1 = playingTeams[i]  // Higher seed among playing teams
        const team2 = playingTeams[playingTeams.length - 1 - i]  // Lower seed
        
        // VALIDATION: Ensure neither team has a bye
        if (byeTeamIds.has(team1.id)) {
          console.error(`❌ BUG DETECTED: Bye team ${team1.name} included in first round match!`)
          alert(`Error: Bye team ${team1.name} incorrectly scheduled for first round. Please contact admin.`)
          return
        }
        if (byeTeamIds.has(team2.id)) {
          console.error(`❌ BUG DETECTED: Bye team ${team2.name} included in first round match!`)
          alert(`Error: Bye team ${team2.name} incorrectly scheduled for first round. Please contact admin.`)
          return
        }
        
        // Validate teams exist and are different
        if (!team1 || !team2) {
          console.error(`❌ BUG DETECTED: Missing teams for match ${i + 1}:`, { team1, team2 })
          alert("Error: Missing team data for match creation. Please contact admin.")
          return
        }
        if (team1.id === team2.id) {
          console.error(`❌ BUG DETECTED: Team ${team1.name} scheduled to play itself!`)
          alert(`Error: Team ${team1.name} scheduled to play itself. Please contact admin.`)
          return
        }
        
        // Calculate actual seed numbers including bye teams
        const team1Seed = allTeams.findIndex(t => t.id === team1.id) + 1
        const team2Seed = allTeams.findIndex(t => t.id === team2.id) + 1

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

      // FINAL VALIDATION: Ensure all teams are accounted for
      const teamsInMatches = knockoutMatches.length * 2 // 2 teams per match
      const totalTeamsPlaced = byeTeams.length + teamsInMatches
      if (totalTeamsPlaced !== allTeams.length) {
        console.error(`❌ BUG DETECTED: Team count mismatch!`)
        console.error(`  Total teams: ${allTeams.length}`)
        console.error(`  Bye teams: ${byeTeams.length}`)
        console.error(`  Teams in matches: ${teamsInMatches}`)
        console.error(`  Total placed: ${totalTeamsPlaced}`)
        alert(`Error: Team count mismatch detected (${totalTeamsPlaced}/${allTeams.length} teams placed). Please contact admin.`)
        return
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

  const handleScoreUpdate = async (matchId: number, completeGame: boolean = false) => {
    if (!requireAdmin("edit match scores")) return

    const t1Score = Number.parseInt(team1Score) || 0
    const t2Score = Number.parseInt(team2Score) || 0

    if (t1Score < 0 || t2Score < 0) {
      alert("Scores cannot be negative!")
      return
    }

    // If completing the game, ensure scores aren't tied
    if (completeGame && t1Score === t2Score) {
      alert("Games cannot end in a tie! Please adjust the scores.")
      return
    }

    try {
      await updateMatch(matchId, {
        team1Score: t1Score,
        team2Score: t2Score,
        completed: completeGame,
      })

      setEditingMatch(null)
      setTeam1Score("")
      setTeam2Score("")
    } catch (error) {
      console.error("Error updating match:", error)
      alert("Failed to update match. Please try again.")
    }
  }

  const startEditing = (match: Match) => {
    if (!requireAdmin("edit match scores")) return
    setEditingMatch(match.id)
    setTeam1Score(match.team1Score.toString())
    setTeam2Score(match.team2Score.toString())
  }

  const cancelEditing = () => {
    setEditingMatch(null)
    setTeam1Score("")
    setTeam2Score("")
  }

  const sanitizeScoreInput = (raw: string) => raw.replace(/[^\d]/g, "").slice(0, 3)

  const setQuickScore = async (matchId: number, team1Score: number, team2Score: number) => {
    if (!requireAdmin("edit match scores")) return
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
    if (!requireAdmin("generate random scores")) return
    const incompleteMatches = matches.filter((match) => !match.completed)

    if (incompleteMatches.length === 0) {
      alert("No incomplete matches to score!")
      return
    }

    if (!confirm(`Generate random scores for ${incompleteMatches.length} matches?`)) return

    try {

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


        // Small delay to avoid overwhelming the database
        if (i < incompleteMatches.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      }

    } catch (error) {
      console.error("❌ Error generating random scores:", error)
      alert(`Failed to generate random scores: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const resetAllScores = async () => {
    if (!requireAdmin("reset match scores")) return
    if (matches.length === 0) {
      alert("No matches to reset!")
      return
    }

    if (!confirm(`Reset all ${matches.length} match scores? This cannot be undone.`)) return

    try {

      for (let i = 0; i < matches.length; i++) {
        const match = matches[i]
        await updateMatch(match.id, {
          team1Score: 0,
          team2Score: 0,
          completed: false,
        })


        // Small delay to avoid overwhelming the database
        if (i < matches.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 50))
        }
      }

    } catch (error) {
      console.error("❌ Error resetting scores:", error)
      alert(`Failed to reset scores: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const standings = calculateStandings(teams, matches)
  const completedMatches = matches.filter((match) => match.completed).length
  const totalMatches = matches.length
  const progressPercentage = totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0

  return (
    <div className="space-y-6">
      {/* View Mode Notice */}
      {!isAdmin && matches.length > 0 && (
        <Alert className="border-blue-300 bg-blue-50">
          <AlertDescription className="text-blue-800">
            👀 Viewing tournament in spectator mode. Match scores are updated live by tournament admins.
          </AlertDescription>
        </Alert>
      )}

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
              <label className="text-sm font-medium text-gray-900">Minimum games per team:</label>
              <Input
                type="number"
                min="1"
                max={teams.length - 1}
                value={gamesPerTeam}
                onChange={(e) => setGamesPerTeam(Number.parseInt(e.target.value) || 1)}
                className="w-20 h-10"
              />
              <span className="text-sm text-gray-600">(all teams get at least this many games)</span>
            </div>
            <div className="text-sm text-blue-800 bg-blue-50 p-3 rounded-lg border border-blue-200">
              <strong>📊 Smart Scheduling:</strong> With {teams.length} teams, some may get extra games to ensure everyone gets at least {gamesPerTeam} games. Back-to-back games are minimized.
            </div>
            {isAdmin && (
              <Button
                onClick={generateMatches}
                disabled={isGenerating || teams.length < 4}
                className="flag-gradient h-12 font-semibold transition-all duration-200"
              >
                {isGenerating ? "Generating..." : `Generate Pool Play (${teams.length} teams)`}
              </Button>
            )}
            {!isAdmin && (
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-800 font-medium">Pool play matches will be generated by tournament admin</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Admin Testing Tools */}
      {isAdmin && (
        <Card className="bg-slate-50 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">Admin Testing Tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Button
                onClick={generateRandomScores}
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-100 h-11 font-medium bg-transparent"
              >
                <Shuffle className="w-4 h-4 mr-2" />
                Random Scores
              </Button>
              <Button
                onClick={resetAllScores}
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-100 h-11 font-medium bg-transparent"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Scores
              </Button>
              <Button
                onClick={generateKnockoutBracket}
                variant="outline"
                disabled={completedMatches === 0}
                className="border-slate-300 text-slate-700 hover:bg-slate-100 h-11 font-medium bg-transparent"
              >
                <Zap className="w-4 h-4 mr-2" />
                Quick Bracket
              </Button>
              {resetTournament && (
                <Button
                  onClick={async () => {
                    if (!requireAdmin("reset the tournament")) return
                    if (!confirm("Reset the entire tournament? This deletes all teams and matches.")) return
                    await resetTournament()
                  }}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50 h-11 font-medium bg-transparent"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Reset Tournament
                </Button>
              )}
            </div>
            <p className="text-sm text-slate-800 text-center">Testing tools for quick tournament simulation</p>
          </CardContent>
        </Card>
      )}

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
              {progressPercentage >= 50 && isAdmin && (
                <Button
                  onClick={generateKnockoutBracket}
                  className="flag-gradient h-12 font-semibold w-full transition-all duration-200"
                >
                  <Trophy className="w-5 h-5 mr-2" />
                  Advance to Knockout Bracket
                </Button>
              )}
              {progressPercentage >= 50 && !isAdmin && (
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-green-800 font-medium">🏆 Ready for knockout bracket! Contact tournament admin to advance.</p>
                </div>
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
              <Trophy className="w-5 h-5 text-yellow-600" />
              Current Standings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">🏆 New Tournament System</h4>
              <p className="text-sm text-blue-800">
                <strong>ALL {teams.length} teams advance to knockout!</strong> No eliminations after pool play.
              </p>
              <p className="text-sm text-blue-700 mt-1">
                {(() => {
                  const bracketSize = Math.pow(2, Math.ceil(Math.log2(teams.length)))
                  const byesNeeded = bracketSize - teams.length
                  if (byesNeeded > 0) {
                    return `📊 ${bracketSize}-team bracket: Top ${byesNeeded} seeds get first-round byes`
                  } else {
                    return `📊 Perfect ${bracketSize}-team bracket: No byes needed`
                  }
                })()}
              </p>
            </div>
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
                {standings.map((team, index) => {
                  const bracketSize = Math.pow(2, Math.ceil(Math.log2(teams.length)))
                  const byesNeeded = bracketSize - teams.length
                  const hasBye = index < byesNeeded
                  
                  return (
                    <TableRow key={team.id} className={hasBye ? "bg-blue-50" : "bg-green-50"}>
                      <TableCell className="font-medium">
                        {index + 1}
                        {hasBye ? (
                          <Badge className="ml-2 bg-blue-100 text-blue-800">BYE</Badge>
                        ) : (
                          <Badge className="ml-2 bg-green-100 text-green-800">PLAY</Badge>
                        )}
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
                  )
                })}
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
              {(() => {
                // Sort matches: incomplete first (by creation order), then completed at bottom
                const incompleteMatches = matches.filter(match => !match.completed).sort((a, b) => a.id - b.id)
                const completedMatches = matches.filter(match => match.completed).sort((a, b) => a.id - b.id)
                const sortedMatches = [...incompleteMatches, ...completedMatches]
                
                return sortedMatches.map((match, index) => {
                  // Calculate permanent match number based on creation order (consistent numbering)
                  const allMatchesByCreation = matches.sort((a, b) => a.id - b.id)
                  const matchNumber = allMatchesByCreation.findIndex(m => m.id === match.id) + 1
                  
                  return (
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
                    {/* Match Number Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge 
                          className={`font-bold ${
                            match.completed 
                              ? "bg-green-100 text-green-800 border-green-200" 
                              : "bg-blue-100 text-blue-800 border-blue-200"
                          }`}
                        >
                          Match {matchNumber}
                        </Badge>
                        {match.completed && (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            <Target className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                      {/* Show live indicator for matches with partial scores */}
                      {!match.completed && (match.team1Score > 0 || match.team2Score > 0) && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-xs font-bold text-red-600">LIVE</span>
                        </div>
                      )}
                    </div>
                  {editingMatch === match.id ? (
                    <div className="space-y-4">
                      {/* Team 1 Score Entry - Mobile Optimized */}
                      <div className="border-2 border-red-200 rounded-lg p-3 bg-gradient-to-r from-red-50 to-white">
                        <div className="space-y-3">
                          <div className="text-center">
                            <div className="font-semibold text-base">{match.team1.name}</div>
                            <div className="text-sm text-gray-600 mt-1">{match.team1.players?.join(" & ")}</div>
                          </div>

                          {/* Score Controls */}
                          <div className="flex items-center justify-center gap-3">
                            <Button
                              onClick={() => {
                                const newScore = Math.max(0, (Number.parseInt(team1Score) || 0) - 1)
                                setTeam1Score(newScore.toString())
                              }}
                              variant="outline"
                              className="w-12 h-12 rounded-full text-xl font-bold border-2 border-red-300 text-red-700 hover:bg-red-50"
                            >
                              −
                            </Button>

                            <div className="flex flex-col items-center gap-2">
                              <Input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                enterKeyHint="done"
                                autoComplete="off"
                                value={team1Score}
                                onChange={(e) => setTeam1Score(sanitizeScoreInput(e.target.value))}
                                onFocus={(e) => e.target.select()}
                                placeholder="0"
                                className="w-24 min-h-[3.5rem] text-center text-3xl font-bold border-2 border-red-300 rounded-lg touch-target"
                                aria-label={`${match.team1.name} score`}
                              />
                              <Button
                                onClick={() => {
                                  setTeam1Score("21")
                                  setTeam2Score("0")
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 text-sm rounded-full min-h-11"
                                size="sm"
                              >
                                🏆 Win
                              </Button>
                            </div>

                            <Button
                              onClick={() => {
                                const newScore = (Number.parseInt(team1Score) || 0) + 1
                                setTeam1Score(newScore.toString())
                              }}
                              variant="outline"
                              className="w-12 h-12 rounded-full text-xl font-bold border-2 border-red-300 text-red-700 hover:bg-red-50"
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* VS Divider */}
                      <div className="text-center py-2">
                        <span className="text-lg font-bold text-blue-800 bg-white px-4 py-2 rounded-full border-2 border-blue-300 shadow-sm">
                          VS
                        </span>
                      </div>

                      {/* Team 2 Score Entry - Mobile Optimized */}
                      <div className="border-2 border-blue-200 rounded-lg p-3 bg-gradient-to-r from-blue-50 to-white">
                        <div className="space-y-3">
                          <div className="text-center">
                            <div className="font-semibold text-base">{match.team2.name}</div>
                            <div className="text-sm text-gray-600 mt-1">{match.team2.players?.join(" & ")}</div>
                          </div>

                          {/* Score Controls */}
                          <div className="flex items-center justify-center gap-3">
                            <Button
                              onClick={() => {
                                const newScore = Math.max(0, (Number.parseInt(team2Score) || 0) - 1)
                                setTeam2Score(newScore.toString())
                              }}
                              variant="outline"
                              className="w-12 h-12 rounded-full text-xl font-bold border-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                            >
                              −
                            </Button>

                            <div className="flex flex-col items-center gap-2">
                              <Input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                enterKeyHint="done"
                                autoComplete="off"
                                value={team2Score}
                                onChange={(e) => setTeam2Score(sanitizeScoreInput(e.target.value))}
                                onFocus={(e) => e.target.select()}
                                placeholder="0"
                                className="w-24 min-h-[3.5rem] text-center text-3xl font-bold border-2 border-blue-300 rounded-lg touch-target"
                                aria-label={`${match.team2.name} score`}
                              />
                              <Button
                                onClick={() => {
                                  setTeam2Score("21")
                                  setTeam1Score("0")
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 text-sm rounded-full min-h-11"
                                size="sm"
                              >
                                🏆 Win
                              </Button>
                            </div>

                            <Button
                              onClick={() => {
                                const newScore = (Number.parseInt(team2Score) || 0) + 1
                                setTeam2Score(newScore.toString())
                              }}
                              variant="outline"
                              className="w-12 h-12 rounded-full text-xl font-bold border-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Quick Score Presets - Mobile Optimized */}
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={() => {
                            setTeam1Score("21")
                            setTeam2Score("19")
                          }}
                          variant="outline"
                          className="h-12 text-sm border-green-300 text-green-700 hover:bg-green-50 font-medium"
                        >
                          Close Game 21-19
                        </Button>
                        <Button
                          onClick={() => {
                            setTeam2Score("21")
                            setTeam1Score("19")
                          }}
                          variant="outline"
                          className="h-12 text-sm border-green-300 text-green-700 hover:bg-green-50 font-medium"
                        >
                          Close Game 19-21
                        </Button>
                      </div>

                      {/* Action Buttons - Mobile Optimized */}
                      <div className="flex flex-col gap-3 pt-2">
                        <Button
                          onClick={() => handleScoreUpdate(match.id, false)}
                          disabled={team1Score === "" || team2Score === ""}
                          className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700 font-bold rounded-xl"
                        >
                          💾 Save Score
                        </Button>
                        <Button
                          onClick={() => handleScoreUpdate(match.id, true)}
                          disabled={team1Score === "" || team2Score === "" || team1Score === team2Score}
                          className="w-full h-14 text-lg bg-green-600 hover:bg-green-700 font-bold rounded-xl"
                        >
                          🏁 Complete Game
                        </Button>
                        <Button
                          variant="outline"
                          onClick={cancelEditing}
                          className="w-full h-12 text-base border-2 border-gray-300 rounded-xl"
                        >
                          ❌ Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-900">{match.team1.name}</span>
                          <span className="score-display">{match.team1Score}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900">{match.team2.name}</span>
                          <span className="score-display">{match.team2Score}</span>
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="ml-4 flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditing(match)}
                            className="border-gray-300 text-gray-700 hover:bg-gray-50 h-12 px-4 outdoor-text"
                          >
                            {match.completed ? "Edit Score" : "Enter Score"}
                          </Button>
                          {!match.completed && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setQuickScore(match.id, 21, 0)}
                                className="border-green-300 text-green-700 hover:bg-green-50 h-10 px-3 text-xs outdoor-text"
                              >
                                21-0
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setQuickScore(match.id, 0, 21)}
                                className="border-green-300 text-green-700 hover:bg-green-50 h-10 px-3 text-xs outdoor-text"
                              >
                                0-21
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setQuickScore(match.id, 21, 19)}
                                className="border-blue-300 text-blue-700 hover:bg-blue-50 h-10 px-3 text-xs outdoor-text"
                              >
                                21-19
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                  )
                })
              })()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
