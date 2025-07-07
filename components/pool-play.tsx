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
  const { isAdmin } = useAdmin()
  const [gamesPerTeam, setGamesPerTeam] = useState(3)
  const [isGenerating, setIsGenerating] = useState(false)
  const [editingMatch, setEditingMatch] = useState<number | null>(null)
  const [team1Score, setTeam1Score] = useState("")
  const [team2Score, setTeam2Score] = useState("")

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
      console.log(`🚀 Phase 1: Creating initial matches between teams needing games`)
      for (let attempts = 0; attempts < 500; attempts++) {
        const teamsNeedingGames = shuffledTeams.filter(team => 
          (tempGameCount.get(team.id) || 0) < targetGames
        )
        
        if (attempts === 0) {
          console.log(`📊 Phase 1 start: ${teamsNeedingGames.length} teams need games:`)
          teamsNeedingGames.forEach(team => {
            console.log(`  - ${team.name}: ${tempGameCount.get(team.id) || 0}/${targetGames}`)
          })
        }
        
        if (teamsNeedingGames.length === 0) {
          console.log(`✅ Phase 1 complete: All teams have enough games`)
          break
        }
        
        let matchCreated = false
        for (let i = 0; i < teamsNeedingGames.length - 1; i++) {
          const team1 = teamsNeedingGames[i]
          for (let j = i + 1; j < teamsNeedingGames.length; j++) {
            const team2 = teamsNeedingGames[j]
            
            // SAFEGUARD: Check if either team would exceed their limit
            const team1Games = tempGameCount.get(team1.id) || 0
            const team2Games = tempGameCount.get(team2.id) || 0
            if (team1Games >= targetGames || team2Games >= targetGames) {
              if (attempts < 5) console.log(`  ⏭️ Skipping ${team1.name} vs ${team2.name} - at limit (${team1Games}, ${team2Games})`)
              continue
            }
            
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
              if (attempts < 10) console.log(`  ➕ Phase 1: ${team1.name} vs ${team2.name} (${tempGameCount.get(team1.id)}, ${tempGameCount.get(team2.id)})`)
              matchCreated = true
              break
            } else {
              if (attempts < 5) console.log(`  ⏭️ Skipping ${team1.name} vs ${team2.name} - already played`)
            }
          }
          if (matchCreated) break
        }
        if (!matchCreated) {
          console.log(`🛑 Phase 1 ended: No more matches can be created (attempt ${attempts + 1})`)
          break
        }
      }
      
      console.log(`📋 Phase 1 complete: ${allNeededMatches.length} matches created`)
      console.log(`📊 Games after Phase 1:`, Object.fromEntries(
        teams.map(t => [t.name, tempGameCount.get(t.id) || 0])
      ))
      
      // Phase 2: Ensure ALL teams get AT LEAST the target number of games
      let additionalMatchesNeeded = true
      let safetyCounter = 0
      
      while (additionalMatchesNeeded && safetyCounter < 50) {
        safetyCounter++
        additionalMatchesNeeded = false
        
        // Find teams that still need more games to reach the minimum
        const teamsNeedingGames = teams.filter(team => 
          (tempGameCount.get(team.id) || 0) < targetGames
        ).sort(() => Math.random() - 0.5) // Randomize order for fairness
        
        if (teamsNeedingGames.length === 0) break
        
        console.log(`🔄 Phase 2 iteration ${safetyCounter}: ${teamsNeedingGames.length} teams still need games`)
        teamsNeedingGames.forEach(team => {
          const currentGames = tempGameCount.get(team.id) || 0
          console.log(`    ${team.name}: ${currentGames}/${targetGames} games`)
        })
        
        for (const team of teamsNeedingGames) {
          const currentGames = tempGameCount.get(team.id) || 0
          const gamesNeeded = targetGames - currentGames
          
          console.log(`🎯 Processing ${team.name}: needs ${gamesNeeded} more games`)
          
          if (gamesNeeded <= 0) {
            console.log(`  ✅ ${team.name} already has enough games, skipping`)
            continue
          }
          
          // Find ALL available opponents (not just those under the limit)
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
          }).sort((a, b) => {
            // Prioritize opponents with fewer games to balance distribution
            const aGames = tempGameCount.get(a.id) || 0
            const bGames = tempGameCount.get(b.id) || 0
            return aGames - bGames
          })
          
          console.log(`  🔍 Found ${potentialOpponents.length} potential opponents for ${team.name}:`)
          potentialOpponents.slice(0, 5).forEach(opp => { // Show first 5
            const oppGames = tempGameCount.get(opp.id) || 0
            console.log(`    - ${opp.name} (${oppGames} games)`)
          })
          if (potentialOpponents.length > 5) {
            console.log(`    ... and ${potentialOpponents.length - 5} more`)
          }
          
          if (potentialOpponents.length === 0) {
            console.warn(`⚠️ No available opponents for ${team.name} (${currentGames}/${targetGames} games)`)
            console.warn(`     All teams already played against: ${teams.filter(t => t.id !== team.id).map(t => t.name).join(', ')}`)
            continue
          }
          
          // Add games for this team until they reach the minimum
          const matchesToAdd = Math.min(gamesNeeded, potentialOpponents.length)
          console.log(`  ➕ Adding ${matchesToAdd} matches for ${team.name}`)
          
          for (let i = 0; i < matchesToAdd; i++) {
            const opponent = potentialOpponents[i]
            
            allNeededMatches.push({team1: team, team2: opponent})
            tempGameCount.set(team.id, (tempGameCount.get(team.id) || 0) + 1)
            tempGameCount.set(opponent.id, (tempGameCount.get(opponent.id) || 0) + 1)
            
            console.log(`    ✅ ${team.name} vs ${opponent.name} (${team.name}: ${tempGameCount.get(team.id)}, ${opponent.name}: ${tempGameCount.get(opponent.id)})`)
            additionalMatchesNeeded = true
          }
        }
      }
      
      if (safetyCounter >= 50) {
        console.warn(`⚠️ Safety limit reached in Phase 2 - some teams may have fewer than ${targetGames} games`)
      }
      
      console.log(`📋 Generated ${allNeededMatches.length} total matches. Now creating optimal schedule...`)
      
      // Step 2: Create optimal schedule - spread teams out to avoid back-to-back games
      const scheduledMatches: Omit<Match, "id">[] = []
      const remainingMatches = [...allNeededMatches]
      const teamLastPlayedRound = new Map<number, number>() // Track when each team last played
      
      let round = 1
      while (remainingMatches.length > 0) {
        console.log(`📅 Scheduling round ${round}...`)
        
        // Find the best match for this round with enhanced anti-back-to-back logic
        let bestMatch: {team1: Team, team2: Team} | null = null
        let bestScore = -1
        let bestIndex = -1
        
        for (let i = 0; i < remainingMatches.length; i++) {
          const match = remainingMatches[i]
          const team1LastRound = teamLastPlayedRound.get(match.team1.id) || 0
          const team2LastRound = teamLastPlayedRound.get(match.team2.id) || 0
          
          // Calculate rest periods (how many rounds since last played)
          const team1Rest = round - team1LastRound
          const team2Rest = round - team2LastRound
          
          // Base score: favor teams that haven't played recently
          let matchScore = team1Rest + team2Rest
          
          // ENHANCED SCORING: Heavily penalize back-to-back games
          if (team1LastRound === round - 1) matchScore -= 100 // Team1 played last round
          if (team2LastRound === round - 1) matchScore -= 100 // Team2 played last round
          
          // Bonus for teams that haven't played in 2+ rounds
          if (team1Rest >= 2) matchScore += 50
          if (team2Rest >= 2) matchScore += 50
          
          // Extra bonus for teams that haven't played in 3+ rounds
          if (team1Rest >= 3) matchScore += 100
          if (team2Rest >= 3) matchScore += 100
          
          if (matchScore > bestScore) {
            bestScore = matchScore
            bestMatch = match
            bestIndex = i
          }
        }
        
        if (bestMatch) {
          const team1LastRound = teamLastPlayedRound.get(bestMatch.team1.id) || 0
          const team2LastRound = teamLastPlayedRound.get(bestMatch.team2.id) || 0
          const team1Rest = round - team1LastRound
          const team2Rest = round - team2LastRound
          
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
          
          // Enhanced logging with rest period info
          const restInfo = `${bestMatch.team1.name}(+${team1Rest}) vs ${bestMatch.team2.name}(+${team2Rest})`
          console.log(`   Game ${round}: ${restInfo}`)
          
          // Warning for back-to-back games
          if (team1Rest === 1) console.warn(`   ⚠️ ${bestMatch.team1.name} playing back-to-back!`)
          if (team2Rest === 1) console.warn(`   ⚠️ ${bestMatch.team2.name} playing back-to-back!`)
          
          round++
        } else {
          // Shouldn't happen, but safety break
          console.error("❌ Could not find a valid match to schedule")
          break
        }
      }
      
      console.log(`🏁 Schedule created! ${scheduledMatches.length} games scheduled.`)
      
      // VALIDATION: Final check to ensure no team exceeds the target game count
      const finalGameCounts = Object.fromEntries(
        teams.map(t => {
          const count = scheduledMatches.filter(m => m.team1.id === t.id || m.team2.id === t.id).length + 
                       matches.filter(m => m.team1.id === t.id || m.team2.id === t.id).length
          return [t.name, count]
        })
      )
      
      console.log(`📊 Final games per team:`, finalGameCounts)
      
      // DETAILED VALIDATION: Check each team's game count
      console.log(`🔍 VALIDATION: Checking all teams have at least ${targetGames} games...`)
      const teamsBelowMinimum = []
      
      for (const team of teams) {
        const existingGames = matches.filter(m => m.team1.id === team.id || m.team2.id === team.id).length
        const newGames = scheduledMatches.filter(m => m.team1.id === team.id || m.team2.id === team.id).length
        const totalGames = existingGames + newGames
        
        console.log(`  ${team.name}: ${existingGames} existing + ${newGames} new = ${totalGames} total games`)
        
        if (totalGames < targetGames) {
          teamsBelowMinimum.push({ team, totalGames })
        }
      }
      
      if (teamsBelowMinimum.length > 0) {
        console.error(`❌ ALGORITHM FAILED: ${teamsBelowMinimum.length} teams below minimum:`)
        teamsBelowMinimum.forEach(({ team, totalGames }) => {
          console.error(`  - ${team.name}: ${totalGames}/${targetGames} games`)
        })
        
        // Show what matches were generated
        console.error(`📋 Generated matches (${scheduledMatches.length}):`)
        scheduledMatches.forEach((match, i) => {
          console.error(`  ${i + 1}: ${match.team1.name} vs ${match.team2.name}`)
        })
        
        alert(`Error: Algorithm failed to give all teams minimum ${targetGames} games. Check console for details.`)
        return
      }
      
      // Show distribution summary
      const gameDistribution = teams.reduce((acc, t) => {
        const count = finalGameCounts[t.name]
        acc[count] = (acc[count] || 0) + 1
        return acc
      }, {} as Record<number, number>)
      
      console.log(`✅ Validation passed: All teams have at least ${targetGames} games`)
      console.log(`📊 Game distribution:`, Object.entries(gameDistribution).map(([games, teams]) => 
        `${teams} team${teams === 1 ? '' : 's'} with ${games} game${games === '1' ? '' : 's'}`
      ).join(', '))
      
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
        
        console.log(`🥊 Match ${i + 1}: #${team1Seed} ${team1.name} vs #${team2Seed} ${team2.name}`)
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

      console.log(`🎉 Knockout bracket generated successfully!`)
      console.log(`📊 Bracket: ${bracketSize} teams, ${byesNeeded} byes, ${knockoutMatches.length} first round matches`)
      console.log(`✅ Validation passed: All ${allTeams.length} teams properly placed`)
      onAdvanceToKnockout()
    } catch (error) {
      console.error("Error generating knockout bracket:", error)
      alert("Failed to generate knockout bracket. Please try again.")
    }
  }

  const handleScoreUpdate = async (matchId: number, completeGame: boolean = false) => {
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
    setEditingMatch(match.id)
    setTeam1Score(match.team1Score.toString())
    setTeam2Score(match.team2Score.toString())
  }

  const cancelEditing = () => {
    setEditingMatch(null)
    setTeam1Score("")
    setTeam2Score("")
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
                  onClick={resetTournament}
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
                                type="number"
                                value={team1Score}
                                onChange={(e) => setTeam1Score(e.target.value)}
                                placeholder="0"
                                className="w-20 h-16 text-center text-3xl font-bold border-2 border-red-300 rounded-lg"
                                min="0"
                              />
                              <Button
                                onClick={() => {
                                  setTeam1Score("21")
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
                                type="number"
                                value={team2Score}
                                onChange={(e) => setTeam2Score(e.target.value)}
                                placeholder="0"
                                className="w-20 h-16 text-center text-3xl font-bold border-2 border-blue-300 rounded-lg"
                                min="0"
                              />
                              <Button
                                onClick={() => {
                                  setTeam2Score("21")
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
