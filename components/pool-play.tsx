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
  const { isAdmin } = useAdmin()
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
      const targetGames = Math.min(gamesPerTeam, teams.length - 1)
      
      // Track games per team to ensure exactly targetGames for each team
      const gameCount = new Map<number, number>()
      teams.forEach(team => gameCount.set(team.id, 0))
      
      // Count existing matches for each team
      matches.forEach(match => {
        const team1Games = gameCount.get(match.team1.id) || 0
        const team2Games = gameCount.get(match.team2.id) || 0
        gameCount.set(match.team1.id, team1Games + 1)
        gameCount.set(match.team2.id, team2Games + 1)
      })
      
      console.log(`🏓 Generating pool play schedule: ${targetGames} games per team`)
      console.log(`📊 Current games per team:`, Object.fromEntries(
        teams.map(t => [t.name, gameCount.get(t.id) || 0])
      ))
      
      // Step 1: Generate all needed matches (without considering schedule order yet)
      const allNeededMatches: {team1: Team, team2: Team}[] = []
      const tempGameCount = new Map(gameCount)
      
      // Create a shuffled list of teams for variety
      const shuffledTeams = [...teams].sort(() => Math.random() - 0.5)
      
      // Phase 1: Create matches between teams that both need games
      for (let attempts = 0; attempts < 500; attempts++) {
        const teamsNeedingGames = shuffledTeams.filter(team => 
          (tempGameCount.get(team.id) || 0) < targetGames
        )
        
        if (teamsNeedingGames.length === 0) break
        
        let matchCreated = false
        for (let i = 0; i < teamsNeedingGames.length - 1; i++) {
          const team1 = teamsNeedingGames[i]
          for (let j = i + 1; j < teamsNeedingGames.length; j++) {
            const team2 = teamsNeedingGames[j]
            
            // Check if these teams have already played
            const alreadyPlayed = matches.some(match => 
              (match.team1.id === team1.id && match.team2.id === team2.id) ||
              (match.team1.id === team2.id && match.team2.id === team1.id)
            ) || allNeededMatches.some(match => 
              (match.team1.id === team1.id && match.team2.id === team2.id) ||
              (match.team1.id === team2.id && match.team2.id === team1.id)
            )
            
            if (!alreadyPlayed) {
              allNeededMatches.push({team1, team2})
              tempGameCount.set(team1.id, (tempGameCount.get(team1.id) || 0) + 1)
              tempGameCount.set(team2.id, (tempGameCount.get(team2.id) || 0) + 1)
              matchCreated = true
              break
            }
          }
          if (matchCreated) break
        }
        if (!matchCreated) break
      }
      
      // Phase 2: Fill remaining games for teams that still need more
      const teamsStillNeedingGames = teams.filter(team => 
        (tempGameCount.get(team.id) || 0) < targetGames
      )
      
      for (const team of teamsStillNeedingGames) {
        const currentGames = tempGameCount.get(team.id) || 0
        const gamesNeeded = targetGames - currentGames
        
        const potentialOpponents = teams.filter(opponent => {
          if (opponent.id === team.id) return false
          const alreadyPlayed = matches.some(match => 
            (match.team1.id === team.id && match.team2.id === opponent.id) ||
            (match.team1.id === opponent.id && match.team2.id === team.id)
          ) || allNeededMatches.some(match => 
            (match.team1.id === team.id && match.team2.id === opponent.id) ||
            (match.team1.id === opponent.id && match.team2.id === team.id)
          )
          return !alreadyPlayed
        }).sort(() => Math.random() - 0.5)
        
        for (let i = 0; i < Math.min(gamesNeeded, potentialOpponents.length); i++) {
          const opponent = potentialOpponents[i]
          allNeededMatches.push({team1: team, team2: opponent})
          tempGameCount.set(team.id, (tempGameCount.get(team.id) || 0) + 1)
          tempGameCount.set(opponent.id, (tempGameCount.get(opponent.id) || 0) + 1)
        }
      }
      
      console.log(`📋 Generated ${allNeededMatches.length} total matches. Now creating optimal schedule...`)
      
      // Step 2: Create optimal schedule - spread teams out to avoid back-to-back games
      const scheduledMatches: Omit<Match, "id">[] = []
      const remainingMatches = [...allNeededMatches]
      const teamLastPlayedRound = new Map<number, number>() // Track when each team last played
      
      let round = 1
      while (remainingMatches.length > 0) {
        console.log(`📅 Scheduling round ${round}...`)
        
        // Find the best match for this round (teams that haven't played recently)
        let bestMatch: {team1: Team, team2: Team} | null = null
        let bestScore = -1
        let bestIndex = -1
        
        for (let i = 0; i < remainingMatches.length; i++) {
          const match = remainingMatches[i]
          const team1LastRound = teamLastPlayedRound.get(match.team1.id) || 0
          const team2LastRound = teamLastPlayedRound.get(match.team2.id) || 0
          
          // Score = how many rounds since each team last played (higher is better)
          const team1Rest = round - team1LastRound
          const team2Rest = round - team2LastRound
          const matchScore = team1Rest + team2Rest
          
          if (matchScore > bestScore) {
            bestScore = matchScore
            bestMatch = match
            bestIndex = i
          }
        }
        
        if (bestMatch) {
          // Schedule this match
          scheduledMatches.push({
            team1: bestMatch.team1,
            team2: bestMatch.team2,
            team1Score: 0,
            team2Score: 0,
            completed: false,
            phase: "pool-play",
            round: undefined,
          })
          
          // Update when these teams last played
          teamLastPlayedRound.set(bestMatch.team1.id, round)
          teamLastPlayedRound.set(bestMatch.team2.id, round)
          
          // Remove this match from remaining matches
          remainingMatches.splice(bestIndex, 1)
          
          console.log(`   Game ${round}: ${bestMatch.team1.name} vs ${bestMatch.team2.name} (rest: ${round - (teamLastPlayedRound.get(bestMatch.team1.id) || 0) + 1}/${round - (teamLastPlayedRound.get(bestMatch.team2.id) || 0) + 1})`)
          
          round++
        } else {
          // Shouldn't happen, but safety break
          console.error("❌ Could not find a valid match to schedule")
          break
        }
      }
      
      console.log(`🏁 Schedule created! ${scheduledMatches.length} games scheduled.`)
      console.log(`📊 Final games per team:`, Object.fromEntries(
        teams.map(t => {
          const count = scheduledMatches.filter(m => m.team1.id === t.id || m.team2.id === t.id).length + 
                       matches.filter(m => m.team1.id === t.id || m.team2.id === t.id).length
          return [t.name, count]
        })
      ))
      
      // Show schedule preview
      console.log(`📅 Game Schedule Preview:`)
      scheduledMatches.slice(0, 10).forEach((match, i) => {
        console.log(`   Game ${i + 1}: ${match.team1.name} vs ${match.team2.name}`)
      })
      if (scheduledMatches.length > 10) {
        console.log(`   ... and ${scheduledMatches.length - 10} more games`)
      }
      
      if (scheduledMatches.length > 0) {
        await createMatches(scheduledMatches)
      } else {
        console.log(`ℹ️ No new matches needed - all teams already have sufficient games`)
      }
    } catch (error) {
      console.error("Error generating matches:", error)
      alert("Failed to generate matches. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const generateKnockoutBracket = async () => {
    if (!isAdmin) {
      alert("Admin access required to generate knockout bracket!")
      return
    }

    const standings = calculateStandings()
    const completedMatches = matches.filter((match) => match.completed)
    
    if (completedMatches.length === 0) {
      alert("Please complete some pool play matches first!")
      return
    }

    try {
      // NEW SYSTEM: Include ALL teams in knockout phase
      const allTeams = standings // All teams advance, no eliminations
      
      // Calculate bracket size as next power of 2 >= total teams
      const bracketSize = Math.pow(2, Math.ceil(Math.log2(allTeams.length)))
      const byesNeeded = bracketSize - allTeams.length
      
      console.log(`🏆 Generating ${bracketSize}-team knockout bracket`)
      console.log(`👥 ${allTeams.length} teams advance (NO eliminations)`)
      console.log(`👋 ${byesNeeded} byes awarded to top ${byesNeeded} seeds`)
      
      // DETAILED SEEDING DEBUG
      console.log(`📊 Team Seeding:`)
      allTeams.forEach((team, index) => {
        console.log(`  #${index + 1}: ${team.name} (${team.wins}W-${team.losses}L, +${team.pointsFor - team.pointsAgainst})`)
      })
      
      // Distribute byes to top seeds
      const byeTeams = allTeams.slice(0, byesNeeded)
      const playingTeams = allTeams.slice(byesNeeded)
      
      console.log(`👋 Teams with BYES (${byeTeams.length}):`)
      byeTeams.forEach((team, index) => {
        console.log(`  #${index + 1}: ${team.name} - BYE`)
      })
      
      console.log(`🥊 Teams PLAYING first round (${playingTeams.length}):`)
      playingTeams.forEach((team, index) => {
        const actualSeed = allTeams.findIndex(t => t.id === team.id) + 1
        console.log(`  #${actualSeed}: ${team.name}`)
      })
      
      // Set bye teams (for now, just track the #1 seed as primary bye)
      if (byeTeams.length > 0) {
        await setByeTeamId(byeTeams[0].id) // Primary bye team for UI
        console.log(`✅ Primary bye: #1 ${byeTeams[0].name}`)
        if (byeTeams.length > 1) {
          console.log(`✅ Additional byes: ${byeTeams.slice(1).map(t => `#${allTeams.findIndex(team => team.id === t.id) + 1} ${t.name}`).join(', ')}`)
        }
      } else {
        await setByeTeamId(null)
        console.log(`ℹ️ No byes needed - perfect bracket size`)
      }

      // Create first round matches with proper seeding
      const knockoutMatches: Omit<Match, "id">[] = []
      const numMatches = Math.floor(playingTeams.length / 2)

      console.log(`🎯 Creating ${numMatches} first round matches from ${playingTeams.length} playing teams:`)
      
      // Create matches with proper tournament seeding (highest vs lowest remaining)
      for (let i = 0; i < numMatches; i++) {
        const team1 = playingTeams[i]  // Higher seed among playing teams
        const team2 = playingTeams[playingTeams.length - 1 - i]  // Lower seed
        
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
        
        console.log(`🥊 Match ${i + 1}: #${team1Seed} ${team1.name} vs #${team2Seed} ${team2.name}`)
      }

      if (knockoutMatches.length > 0) {
        await createMatches(knockoutMatches)
      }

      console.log(`🎉 Knockout bracket generated successfully!`)
      console.log(`📊 Bracket: ${bracketSize} teams, ${byesNeeded} byes, ${knockoutMatches.length} first round matches`)
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
        <Card className="bg-amber-50 border-amber-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">Admin Testing Tools</CardTitle>
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
              <Trophy className="w-5 h-5 text-amber-600" />
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
                    <TableRow key={team.id} className={hasBye ? "bg-yellow-50" : "bg-green-50"}>
                      <TableCell className="font-medium">
                        {index + 1}
                        {hasBye ? (
                          <Badge className="ml-2 bg-yellow-100 text-yellow-800">BYE</Badge>
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

                    {isAdmin && (
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
                    )}
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
