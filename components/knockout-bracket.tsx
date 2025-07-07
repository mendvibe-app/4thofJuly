"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trophy, Crown } from "lucide-react"
import type { Match, Team } from "@/types/tournament"
import { useAdmin } from "@/hooks/use-admin"

interface KnockoutBracketProps {
  matches: Match[]
  poolPlayMatches: Match[]
  updateMatch: (matchId: number, updates: Partial<Match>) => Promise<void>
  createMatches: (matches: Omit<Match, "id">[]) => Promise<void>
  byeTeam: Team | null
  allTeams: Team[]  // Add all teams for better bye display
}

export default function KnockoutBracket({ matches, poolPlayMatches, updateMatch, createMatches, byeTeam, allTeams }: KnockoutBracketProps) {
  const { isAdmin } = useAdmin()
  const [editingMatch, setEditingMatch] = useState<Match | null>(null)
  const [team1Score, setTeam1Score] = useState("")
  const [team2Score, setTeam2Score] = useState("")
  const [champion, setChampion] = useState<Team | null>(null)

  // Calculate all bye teams based on bracket size and participating teams
  const calculateByeTeams = (): Team[] => {
    if (!allTeams || allTeams.length === 0 || !poolPlayMatches) return []
    
    try {
      // Calculate bracket size and byes needed
      const bracketSize = allTeams.length > 1 ? Math.pow(2, Math.ceil(Math.log2(allTeams.length))) : 2
      const byesNeeded = bracketSize - allTeams.length
      
      if (byesNeeded <= 0) return []
      
      // Use the same pool play calculation as getSeedNumber for consistency
      const teamStats = allTeams.map((t) => {
        const teamPoolPlayMatches = poolPlayMatches.filter((match) => 
          match.phase === "pool-play" && 
          match.completed &&
          (match.team1.id === t.id || match.team2.id === t.id)
        )
        
        let wins = 0
        let pointsFor = 0
        let pointsAgainst = 0
        
        teamPoolPlayMatches.forEach((match) => {
          if (match.team1.id === t.id) {
            pointsFor += match.team1Score
            pointsAgainst += match.team2Score
            if (match.team1Score > match.team2Score) wins++
          } else {
            pointsFor += match.team2Score
            pointsAgainst += match.team1Score
            if (match.team2Score > match.team1Score) wins++
          }
        })
        
        return {
          team: t,
          wins,
          pointsFor,
          pointsAgainst,
          pointDifferential: pointsFor - pointsAgainst
        }
      })
      
      // Sort teams by pool play performance (wins, then point differential)
      teamStats.sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins
        return b.pointDifferential - a.pointDifferential
      })
      
      // Return top seeds as bye teams
      return teamStats.slice(0, byesNeeded).map(ts => ts.team)
    } catch (error) {
      console.error("Error calculating bye teams:", error)
      return []
    }
  }

  const byeTeams = calculateByeTeams()
  const bracketSize = allTeams && allTeams.length > 0 ? Math.pow(2, Math.ceil(Math.log2(allTeams.length))) : 2

  // Get seed number for a team based on their pool play stats (not current knockout stats)
  const getSeedNumber = (team: Team): number => {
    if (!allTeams || allTeams.length === 0 || !poolPlayMatches) return 1
    
    try {
      // Use the allTeams array which should already be sorted by pool play standings
      // Calculate pool play stats for all teams to get consistent seeding
      const teamStats = allTeams.map((t) => {
        const teamPoolPlayMatches = poolPlayMatches.filter((match) => 
          match.phase === "pool-play" && 
          match.completed &&
          (match.team1.id === t.id || match.team2.id === t.id)
        )
        
        let wins = 0
        let pointsFor = 0
        let pointsAgainst = 0
        
        teamPoolPlayMatches.forEach((match) => {
          if (match.team1.id === t.id) {
            pointsFor += match.team1Score
            pointsAgainst += match.team2Score
            if (match.team1Score > match.team2Score) wins++
          } else {
            pointsFor += match.team2Score
            pointsAgainst += match.team1Score
            if (match.team2Score > match.team1Score) wins++
          }
        })
        
        return {
          team: t,
          wins,
          pointsFor,
          pointsAgainst,
          pointDifferential: pointsFor - pointsAgainst
        }
      })
      
      // Sort all teams by pool play performance (wins, then point differential)
      teamStats.sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins
        return b.pointDifferential - a.pointDifferential
      })
      
      // Find the team's position in the sorted list
      const seedPosition = teamStats.findIndex((ts) => ts.team.id === team.id)
      return seedPosition >= 0 ? seedPosition + 1 : 1
    } catch (error) {
      console.error("Error calculating seed number:", error)
      return 1
    }
  }

  // Organize matches by round for bracket display
  const rounds = matches.reduce(
    (acc, match) => {
      const round = match.round || 1
      if (!acc[round]) acc[round] = []
      acc[round].push(match)
      return acc
    },
    {} as Record<number, Match[]>,
  )
  
  // Sort matches within each round to maintain stable bracket structure
  Object.keys(rounds).forEach(roundKey => {
    const roundNum = Number(roundKey)
    rounds[roundNum].sort((a, b) => {
      // Sort by match ID to maintain creation order (preserves bracket structure)
      return a.id - b.id
    })
  })
  const totalRounds = Math.max(...Object.keys(rounds).map(Number), 1)
  const roundNumbers = Object.keys(rounds)
    .map(Number)
    .sort((a, b) => a - b)

  // Get winner of a match
  const getMatchWinner = (match: Match): Team | null => {
    if (!match.completed) return null
    return match.team1Score > match.team2Score ? match.team1 : match.team2
  }

  // Get round name
  const getRoundName = (round: number) => {
    // Use bracket size to determine round names
    const expectedRounds = Math.ceil(Math.log2(bracketSize))
    if (round === expectedRounds) return "Championship"
    if (round === expectedRounds - 1) return "Semifinals"
    if (round === expectedRounds - 2) return "Quarterfinals"
    if (round === 1) return "First Round"
    return `Round ${round}`
  }

  // Get target score for a round
  const getTargetScore = (round: number) => {
    // Use bracket size to determine target scores
    const expectedRounds = Math.ceil(Math.log2(bracketSize))
    if (round >= expectedRounds - 1) {
      return 21 // Semifinals and Finals
    }
    return 15 // All earlier rounds
  }

  // Advancement logic
  useEffect(() => {
    const advanceWinners = async () => {
      if (!matches || matches.length === 0) return
      
      // Get knockout matches only
      const knockoutMatches = matches.filter((match) => match.phase === "knockout")
      if (knockoutMatches.length === 0) return
      
      // Get all rounds
      const rounds = Array.from(new Set(knockoutMatches.map((match) => match.round).filter((round): round is number => round !== undefined)))
      if (rounds.length === 0) return
      
      // Check each round for completion
      for (const currentRound of rounds) {
        const currentRoundMatches = knockoutMatches.filter((match) => match.round === currentRound)
        if (currentRoundMatches.length === 0) continue
        
        const completedCurrentRound = currentRoundMatches.every((m) => m.completed)
        if (completedCurrentRound && currentRoundMatches.length > 1) {
          // Check if next round already exists (more thorough check)
          const nextRoundMatches = matches.filter((m) => m.phase === "knockout" && m.round === currentRound + 1)
          const expectedNextRoundMatches = Math.floor((currentRoundMatches.length + byeTeams.length) / 2)
          
          console.log(`🔍 Round ${currentRound} completed: ${currentRoundMatches.length} matches`)
          console.log(`  📊 Next round matches exist: ${nextRoundMatches.length}, expected: ${expectedNextRoundMatches}`)
          
          if (nextRoundMatches.length === 0) {
            // Get winners from current round
            const winners: Team[] = []
            currentRoundMatches.forEach((match) => {
              const winner = match.team1Score > match.team2Score ? match.team1 : match.team2
              winners.push(winner)
            })
            
            // For the first round, add all bye teams
            if (currentRound === 1 && byeTeams.length > 0) {
              // Add all bye teams at the beginning to preserve seeding
              winners.unshift(...byeTeams)
            }
            
            if (winners.length < 2) return
            
            // Sort by seed number to maintain proper bracket seeding
            winners.sort((a, b) => getSeedNumber(a) - getSeedNumber(b))
            
            // Create next round matches
            const nextRoundMatchesToCreate: Omit<Match, "id">[] = []
            for (let i = 0; i < winners.length / 2; i++) {
              const team1 = winners[i]
              const team2 = winners[winners.length - 1 - i]
              
              // Validate teams before creating match
              if (!team1 || !team2) {
                console.error(`❌ Invalid teams for match ${i}:`, { team1, team2 })
                continue
              }
              
              // VALIDATION: Ensure teams are different
              if (team1.id === team2.id) {
                console.error(`❌ BUG DETECTED: Team ${team1.name} scheduled to play itself in round ${currentRound + 1}!`)
                continue
              }
              
              // ENHANCED DUPLICATE CHECK: Check if this specific matchup already exists
              const duplicateMatch = matches.find(m => 
                m.phase === "knockout" && 
                m.round === currentRound + 1 &&
                ((m.team1.id === team1.id && m.team2.id === team2.id) ||
                 (m.team1.id === team2.id && m.team2.id === team1.id))
              )
              
              if (duplicateMatch) {
                console.warn(`⚠️ DUPLICATE PREVENTED: Match ${team1.name} vs ${team2.name} already exists in round ${currentRound + 1}`)
                continue
              }
              
              console.log(`  🆕 Creating: #${getSeedNumber(team1)} ${team1.name} vs #${getSeedNumber(team2)} ${team2.name}`)
              
              nextRoundMatchesToCreate.push({
                team1,
                team2,
                team1Score: 0,
                team2Score: 0,
                completed: false,
                phase: "knockout",
                round: currentRound + 1,
              })
            }
            
            if (nextRoundMatchesToCreate.length > 0) {
              console.log(`🏆 Creating ${nextRoundMatchesToCreate.length} new matches for round ${currentRound + 1}`)
              await createMatches(nextRoundMatchesToCreate)
            } else {
              console.log(`ℹ️ No new matches to create - all matches already exist`)
            }
          }
        } else if (completedCurrentRound && currentRoundMatches.length === 1) {
          // Check if this is truly the final match or just a single match in an early round
          const nextRoundMatches = matches.filter((m) => m.phase === "knockout" && m.round === currentRound + 1)
          const isLastPossibleRound = currentRound === Math.ceil(Math.log2(bracketSize))
          
          console.log(`🔍 Single match completed in round ${currentRound}:`)
          console.log(`  📊 Bracket size: ${bracketSize}, expected final round: ${Math.ceil(Math.log2(bracketSize))}`)
          console.log(`  🏆 Is last possible round: ${isLastPossibleRound}`)
          console.log(`  📋 Next round matches exist: ${nextRoundMatches.length}`)
          
          if (isLastPossibleRound && nextRoundMatches.length === 0) {
            // Tournament complete - set champion
            const finalMatch = currentRoundMatches[0]
            const winner = finalMatch.team1Score > finalMatch.team2Score ? finalMatch.team1 : finalMatch.team2
            console.log(`🏆 Tournament complete! Champion: ${winner.name}`)
            setChampion(winner)
          } else if (nextRoundMatches.length === 0) {
            // This is just a single match in an early round - advance normally
            console.log(`🚀 Advancing from single match in round ${currentRound}`)
            
            // Get winner from the single match
            const winner = currentRoundMatches[0].team1Score > currentRoundMatches[0].team2Score ? 
              currentRoundMatches[0].team1 : currentRoundMatches[0].team2
            console.log(`  🥇 Winner: ${winner.name}`)
            
            const winners = [winner]
            
            // For the first round, add all bye teams
            if (currentRound === 1 && byeTeams.length > 0) {
              console.log(`  👋 Adding ${byeTeams.length} bye teams to advancement`)
              byeTeams.forEach(team => {
                console.log(`    #${getSeedNumber(team)} ${team.name} - BYE`)
              })
              winners.unshift(...byeTeams)
            }
            
            console.log(`  👥 Total advancing teams: ${winners.length}`)
            console.log(`  📊 Next round matches exist: ${nextRoundMatches.length}`)
            
            if (winners.length >= 2) {
              // Sort by seed number to maintain proper bracket seeding
              winners.sort((a, b) => getSeedNumber(a) - getSeedNumber(b))
              
              console.log(`  🎯 Creating next round matches:`)
              
              // Create next round matches
              const nextRoundMatchesToCreate: Omit<Match, "id">[] = []
              for (let i = 0; i < winners.length / 2; i++) {
                const team1 = winners[i]
                const team2 = winners[winners.length - 1 - i]
                
                // Validate teams before creating match
                if (!team1 || !team2) {
                  console.error(`❌ Invalid teams for match ${i}:`, { team1, team2 })
                  continue
                }
                
                // VALIDATION: Ensure teams are different
                if (team1.id === team2.id) {
                  console.error(`❌ BUG DETECTED: Team ${team1.name} scheduled to play itself in round ${currentRound + 1}!`)
                  continue
                }
                
                // ENHANCED DUPLICATE CHECK: Check if this specific matchup already exists
                const duplicateMatch = matches.find(m => 
                  m.phase === "knockout" && 
                  m.round === currentRound + 1 &&
                  ((m.team1.id === team1.id && m.team2.id === team2.id) ||
                   (m.team1.id === team2.id && m.team2.id === team1.id))
                )
                
                if (duplicateMatch) {
                  console.warn(`⚠️ DUPLICATE PREVENTED: Match ${team1.name} vs ${team2.name} already exists in round ${currentRound + 1}`)
                  continue
                }
                
                const team1Seed = getSeedNumber(team1)
                const team2Seed = getSeedNumber(team2)
                console.log(`    🥊 Match ${i + 1}: #${team1Seed} ${team1.name} vs #${team2Seed} ${team2.name}`)
                
                nextRoundMatchesToCreate.push({
                  team1,
                  team2,
                  team1Score: 0,
                  team2Score: 0,
                  completed: false,
                  phase: "knockout",
                  round: currentRound + 1,
                })
              }
              
              if (nextRoundMatchesToCreate.length > 0) {
                console.log(`🏆 Creating ${nextRoundMatchesToCreate.length} new matches for round ${currentRound + 1}`)
                await createMatches(nextRoundMatchesToCreate)
              } else {
                console.log(`ℹ️ No new matches to create - all matches already exist`)
              }
            }
          }
        }
      }
    }
    
    advanceWinners()
  }, [matches, byeTeams])

  // Score update handler (Supabase version)
  const updateMatchScore = async (completeGame: boolean = false) => {
    if (!editingMatch || team1Score === "" || team2Score === "") return
    const score1 = Number.parseInt(team1Score)
    const score2 = Number.parseInt(team2Score)
    if (isNaN(score1) || isNaN(score2) || score1 < 0 || score2 < 0) return
    
    // If completing the game, ensure scores aren't tied
    if (completeGame && score1 === score2) {
      alert("Knockout games cannot end in a tie! Please adjust the scores.")
      return
    }
    
    await updateMatch(editingMatch.id, {
      team1Score: score1,
      team2Score: score2,
      completed: completeGame,
    })
    setEditingMatch(null)
    setTeam1Score("")
    setTeam2Score("")
  }

  const editMatch = (match: Match) => {
    setEditingMatch(match)
    setTeam1Score(match.completed ? match.team1Score.toString() : "")
    setTeam2Score(match.completed ? match.team2Score.toString() : "")
  }

  const ByeCard = ({ team }: { team: Team }) => {
    const seedNumber = getSeedNumber(team)

    return (
      <div className="border-4 border-blue-400 rounded-lg p-4 min-w-[300px] bg-gradient-to-br from-blue-50 via-white to-blue-100 shadow-lg">
        <div className="text-center space-y-3">
          <div className="text-2xl">🎯</div>
          <div>
            <div className="text-sm font-bold text-blue-800 mb-1">BYE ROUND</div>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Badge variant="outline" className="text-xs px-2 py-1 bg-blue-100 border-blue-400 text-blue-800">
                  #{seedNumber}
                </Badge>
                <div className="font-semibold text-base text-blue-900">{team.name}</div>
              </div>
              <div className="text-xs text-blue-700">{team.players?.join(" & ")}</div>
            </div>
          </div>
          <div className="text-sm font-semibold text-blue-800 bg-blue-200 px-3 py-1 rounded-full">
            ✅ Auto-Advance
          </div>
          <div className="text-xs text-blue-700">Advances to next round automatically</div>
        </div>
      </div>
    )
  }

  const BracketMatch = ({
    match,
    roundIndex,
    matchIndex,
  }: { match: Match; roundIndex: number; matchIndex: number }) => {
    const isEditing = editingMatch?.id === match.id
    const winner = getMatchWinner(match)
    const team1Seed = getSeedNumber(match.team1)
    const team2Seed = getSeedNumber(match.team2)
    const targetScore = getTargetScore(match.round || 1)

    return (
      <div className="relative">
        {/* Bracket Lines - Left side connections */}
        {roundIndex > 0 && <div className="absolute -left-8 top-1/2 w-8 h-px bg-blue-600 hidden sm:block"></div>}
        {roundIndex > 0 && matchIndex % 2 === 0 && (
          <div className="absolute -left-8 top-1/2 w-4 h-16 border-l-2 border-t-2 border-blue-600 hidden sm:block"></div>
        )}
        {roundIndex > 0 && matchIndex % 2 === 1 && (
          <div className="absolute -left-8 top-1/2 w-4 h-16 border-l-2 border-b-2 border-blue-600 -translate-y-16 hidden sm:block"></div>
        )}

        {/* Bracket Lines - Right side connections */}
        {roundIndex < totalRounds - 1 && (
          <div className="absolute -right-8 top-1/2 w-8 h-px bg-blue-600 hidden sm:block"></div>
        )}

        <div
          className={`border-2 rounded-lg p-3 min-w-[300px] bg-gradient-to-br from-white via-red-50 to-blue-50 shadow-md ${
            match.completed ? "border-green-300" : "border-blue-300"
          }`}
        >
          {isEditing ? (
            <div className="space-y-4">
              {/* Team 1 Score Entry - Mobile Optimized */}
              <div className="border-2 border-red-200 rounded-lg p-3 bg-gradient-to-r from-red-50 to-white">
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="font-semibold text-base">
                      <span className="inline-flex items-center gap-2">
                        <Badge variant="outline" className="text-sm px-2 py-1 bg-red-100 border-red-300">
                          #{team1Seed}
                        </Badge>
                        <span>{match.team1.name}</span>
                      </span>
                    </div>
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
                        type="number"
                        value={team1Score}
                        onChange={(e) => setTeam1Score(e.target.value)}
                        placeholder="0"
                        className="w-20 h-16 text-center text-3xl font-bold border-2 border-red-300 rounded-lg"
                        min="0"
                      />
                      <Button
                        onClick={() => {
                          setTeam1Score(targetScore.toString())
                          setTeam2Score("0")
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 text-sm rounded-full"
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
                    <div className="font-semibold text-base">
                      <span className="inline-flex items-center gap-2">
                        <Badge variant="outline" className="text-sm px-2 py-1 bg-blue-100 border-blue-300">
                          #{team2Seed}
                        </Badge>
                        <span>{match.team2.name}</span>
                      </span>
                    </div>
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
                        type="number"
                        value={team2Score}
                        onChange={(e) => setTeam2Score(e.target.value)}
                        placeholder="0"
                        className="w-20 h-16 text-center text-3xl font-bold border-2 border-blue-300 rounded-lg"
                        min="0"
                      />
                      <Button
                        onClick={() => {
                          setTeam2Score(targetScore.toString())
                          setTeam1Score("0")
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 text-sm rounded-full"
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
                    setTeam1Score(targetScore.toString())
                    setTeam2Score((targetScore - 2).toString())
                  }}
                  variant="outline"
                  className="h-12 text-sm border-green-300 text-green-700 hover:bg-green-50 font-medium"
                >
                  Close Game {targetScore}-{targetScore - 2}
                </Button>
                <Button
                  onClick={() => {
                    setTeam2Score(targetScore.toString())
                    setTeam1Score((targetScore - 2).toString())
                  }}
                  variant="outline"
                  className="h-12 text-sm border-green-300 text-green-700 hover:bg-green-50 font-medium"
                >
                  Close Game {targetScore - 2}-{targetScore}
                </Button>
              </div>

              {/* Action Buttons - Mobile Optimized */}
              <div className="flex flex-col gap-3 pt-2">
                <Button
                  onClick={() => updateMatchScore(false)}
                  disabled={team1Score === "" || team2Score === ""}
                  className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700 font-bold rounded-xl"
                >
                  💾 Save Score
                </Button>
                <Button
                  onClick={() => updateMatchScore(true)}
                  disabled={team1Score === "" || team2Score === "" || team1Score === team2Score}
                  className="w-full h-14 text-lg bg-green-600 hover:bg-green-700 font-bold rounded-xl"
                >
                  🏁 Complete Game
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingMatch(null)}
                  className="w-full h-12 text-base border-2 border-gray-300 rounded-xl"
                >
                  ❌ Cancel
                </Button>
              </div>

              {/* Score Validation Message */}
              {team1Score !== "" && team2Score !== "" && team1Score === team2Score && (
                <div className="text-center p-3 bg-red-100 border border-red-300 rounded-lg">
                  <p className="text-sm font-medium text-red-800">⚠️ Knockout games cannot end in a tie</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {/* Team 1 */}
              <div
                className={`border rounded p-2 ${
                  winner?.id === match.team1.id
                    ? "border-green-400 bg-green-50"
                    : match.completed
                      ? "border-gray-300 bg-gray-50"
                      : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">
                      <span className="inline-flex items-center gap-1">
                        <Badge variant="outline" className="text-xs px-1 py-0 h-5 bg-red-100 border-red-300">
                          #{team1Seed}
                        </Badge>
                        <span>{match.team1.name}</span>
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 truncate">{match.team1.players?.join(" & ")}</div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {match.completed && <span className="text-lg font-bold">{match.team1Score}</span>}
                    {winner?.id === match.team1.id && <span className="text-lg">🏆</span>}
                  </div>
                </div>
              </div>

              {/* VS or Score */}
              <div className="text-center">
                <span className="text-sm font-bold text-blue-800 bg-white px-2 py-1 rounded border border-blue-300">
                  {match.completed ? `${match.team1Score}-${match.team2Score}` : "VS"}
                </span>
              </div>

              {/* Team 2 */}
              <div
                className={`border rounded p-2 ${
                  winner?.id === match.team2.id
                    ? "border-green-400 bg-green-50"
                    : match.completed
                      ? "border-gray-300 bg-gray-50"
                      : "border-blue-200 bg-blue-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">
                      <span className="inline-flex items-center gap-1">
                        <Badge variant="outline" className="text-xs px-1 py-0 h-5 bg-blue-100 border-blue-300">
                          #{team2Seed}
                        </Badge>
                        <span>{match.team2.name}</span>
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 truncate">{match.team2.players?.join(" & ")}</div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {match.completed && <span className="text-lg font-bold">{match.team2Score}</span>}
                    {winner?.id === match.team2.id && <span className="text-lg">🏆</span>}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {isAdmin && (
                <Button
                  onClick={() => editMatch(match)}
                  className={`w-full min-h-[36px] text-xs font-semibold ${
                    match.completed
                      ? "border-blue-300 text-blue-700 hover:bg-blue-50 bg-transparent"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  }`}
                  variant={match.completed ? "outline" : "default"}
                >
                  {match.completed ? "✏️ Edit" : "⚽ Enter Score"}
                </Button>
              )}

              {/* Status Badge */}
              <div className="text-center">
                <Badge variant={match.completed ? "default" : "secondary"} className="text-xs px-2 py-1">
                  {match.completed ? "✅ Complete" : "⏳ Pending"}
                </Badge>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* View Mode Notice */}
      {!isAdmin && matches.length > 0 && (
        <Alert className="border-blue-300 bg-blue-50">
          <AlertDescription className="text-blue-800">
            👀 Viewing bracket in spectator mode. Results update live as tournament admins enter scores.
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent">
          <Trophy className="w-6 h-6 text-red-600" />
          🇺🇸 Tournament Bracket 🏆
        </h2>
        <p className="text-blue-800 font-semibold">⚡ Single elimination championship</p>
        
        {/* New Tournament System Info */}
        {allTeams.length > 0 && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-semibold text-blue-900">
              🏆 ALL {allTeams.length} teams advance to knockout!
            </p>
            <p className="text-xs text-blue-700 mt-1">
              {byeTeams.length > 0 ? `Top ${byeTeams.length} seed${byeTeams.length === 1 ? '' : 's'} get${byeTeams.length === 1 ? 's' : ''} first-round bye${byeTeams.length === 1 ? '' : 's'}` : 'No byes needed - perfect bracket size!'}
            </p>
          </div>
        )}
      </div>

      {/* Champion Display */}
      {champion && (
        <Card className="border-4 border-yellow-600 bg-gradient-to-r from-yellow-50 via-white to-yellow-50 shadow-2xl">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center items-center gap-2">
                <Crown className="w-16 h-16 text-yellow-600" />
                <span className="text-4xl">🇺🇸</span>
                <Crown className="w-16 h-16 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-red-800">🏆 TOURNAMENT CHAMPION 🏆</h3>
                <p className="text-3xl font-bold bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent mt-2">
                  #{getSeedNumber(champion)} {champion.name}
                </p>
                <p className="text-blue-700 font-semibold">{champion.players?.join(" & ")}</p>
                <p className="text-lg text-green-700 font-bold mt-2">🇺🇸 All-American Champions! 🇺🇸</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* NCAA-Style Bracket */}
      <Card className="border-2 border-red-300 bg-gradient-to-br from-red-50 via-white to-blue-50 shadow-lg overflow-x-auto">
        <CardHeader className="bg-gradient-to-r from-red-100 via-white to-blue-100">
          <CardTitle className="text-center text-blue-900 font-bold text-xl">🏆 Championship Bracket</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex gap-8 min-w-max">
            {/* Bye Round Column (if there are bye teams) */}
            {byeTeams.length > 0 && (
              <div className="flex flex-col items-center space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-blue-900 bg-gradient-to-r from-blue-100 to-blue-200 px-4 py-2 rounded-lg border-2 border-blue-400">
                    Bye Round
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    {byeTeams.length} {byeTeams.length === 1 ? 'team' : 'teams'} auto-advance
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Skip to Round 1 of {roundNumbers.length} rounds
                  </p>
                </div>
                <div className="flex flex-col space-y-6">
                  {byeTeams.map((team, index) => (
                    <ByeCard key={team.id} team={team} />
                  ))}
                </div>
              </div>
            )}

            {/* Regular Rounds */}
            {roundNumbers.map((roundNum, roundIndex) => (
              <div key={roundNum} className="flex flex-col items-center space-y-4">
                {/* Round Header */}
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-blue-900 bg-gradient-to-r from-red-100 to-blue-100 px-4 py-2 rounded-lg border-2 border-blue-300">
                    {getRoundName(roundNum)}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {rounds[roundNum].length} {rounds[roundNum].length === 1 ? "match" : "matches"}
                  </p>
                </div>

                {/* Matches in this round */}
                <div className="flex flex-col space-y-8">
                  {rounds[roundNum].map((match, matchIndex) => (
                    <BracketMatch
                      key={match.id}
                      match={match}
                      roundIndex={roundIndex}
                      matchIndex={matchIndex}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Bracket Legend */}
          <div className="mt-6 sm:hidden">
            <Card className="border border-blue-200 bg-blue-50">
              <CardContent className="p-3">
                <h4 className="font-semibold text-blue-900 mb-2">📱 Bracket Flow</h4>
                <p className="text-sm text-blue-800">
                  Winners advance from left to right. Seeds show pool play rankings. Complete matches to see the bracket progress toward the championship!
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
