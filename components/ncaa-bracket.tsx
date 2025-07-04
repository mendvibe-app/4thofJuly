"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trophy, Crown, Target } from "lucide-react"
import type { Team, Match } from "@/types/tournament"
import { useAdmin } from "@/hooks/use-admin"

interface NCAABracketProps {
  teams: Team[]
  matches: Match[]
  updateMatch: (matchId: number, updates: Partial<Match>) => Promise<void>
  createMatches: (matches: Omit<Match, "id">[]) => Promise<void>
  byeTeam: Team | null
}

export default function NCAABracket({ teams, matches, updateMatch, createMatches, byeTeam }: NCAABracketProps) {
  const { isAdmin } = useAdmin()
  const [editingMatch, setEditingMatch] = useState<number | null>(null)
  const [tempScores, setTempScores] = useState<{ team1: string; team2: string }>({ team1: "", team2: "" })

  // Sort teams by pool play standings (wins, then points differential)
  const sortedTeams = [...teams].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins
    const aDiff = a.pointsFor - a.pointsAgainst
    const bDiff = b.pointsFor - b.pointsAgainst
    return bDiff - aDiff
  })

  // Assign seeds
  const seededTeams = sortedTeams.map((team, index) => ({
    ...team,
    seed: index + 1,
    isBye: byeTeam && team.id === byeTeam.id
  }))

  // Group matches by round for bracket display
  const matchesByRound = matches.reduce((acc, match) => {
    const round = match.round || 1
    if (!acc[round]) acc[round] = []
    acc[round].push(match)
    return acc
  }, {} as Record<number, Match[]>)

  const generateFirstRound = async () => {
    const firstRoundMatches: Omit<Match, "id">[] = []
    
    // Create matches based on seeding: 1v8, 4v5, 2v7, 3v6 (if 8 teams)
    // Or 1v6, 4v5, 2v7, 3v8 with bye for top 2 seeds (if 6 teams)
    if (teams.length === 6) {
      // 6-team bracket: top 2 seeds get byes
      const playingTeams = seededTeams.slice(2) // Seeds 3-6
      for (let i = 0; i < playingTeams.length; i += 2) {
        if (playingTeams[i] && playingTeams[i + 1]) {
          firstRoundMatches.push({
            team1: playingTeams[i],
            team2: playingTeams[i + 1],
            team1Score: 0,
            team2Score: 0,
            completed: false,
            phase: "knockout",
            round: 1,
          })
        }
      }
    } else {
      // Standard 8-team bracket
      const bracketPairs = [
        [seededTeams[0], seededTeams[7]], // 1v8
        [seededTeams[3], seededTeams[4]], // 4v5
        [seededTeams[1], seededTeams[6]], // 2v7
        [seededTeams[2], seededTeams[5]], // 3v6
      ]

      bracketPairs.forEach(([team1, team2]) => {
        if (team1 && team2) {
          firstRoundMatches.push({
            team1,
            team2,
            team1Score: 0,
            team2Score: 0,
            completed: false,
            phase: "knockout",
            round: 1,
          })
        }
      })
    }

    if (firstRoundMatches.length > 0) {
      try {
        await createMatches(firstRoundMatches)
      } catch (error) {
        console.error("Error creating first round:", error)
      }
    }
  }

  const MatchCard = ({ match, roundName }: { match: Match; roundName: string }) => {
    const isEditing = editingMatch === match.id
    const winner = match.completed && match.team1Score !== match.team2Score 
      ? (match.team1Score > match.team2Score ? match.team1 : match.team2)
      : null

    return (
      <Card className="w-64 match-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-center">{roundName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Team 1 */}
          <div className={`flex items-center justify-between p-2 rounded ${
            winner && winner.id === match.team1.id ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50'
          }`}>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 rounded-full flex items-center justify-center text-xs">
                {seededTeams.find(t => t.id === match.team1.id)?.seed || '?'}
              </Badge>
              <span className="font-medium text-sm">{match.team1.name}</span>
            </div>
            {isEditing ? (
              <Input
                type="number"
                value={tempScores.team1}
                onChange={(e) => setTempScores(prev => ({ ...prev, team1: e.target.value }))}
                className="w-16 h-8 text-center"
                min="0"
              />
            ) : (
              <span className="font-bold text-lg">{match.team1Score}</span>
            )}
          </div>

          {/* VS */}
          <div className="text-center text-xs text-gray-500 font-medium">VS</div>

          {/* Team 2 */}
          <div className={`flex items-center justify-between p-2 rounded ${
            winner && winner.id === match.team2.id ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50'
          }`}>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 rounded-full flex items-center justify-center text-xs">
                {seededTeams.find(t => t.id === match.team2.id)?.seed || '?'}
              </Badge>
              <span className="font-medium text-sm">{match.team2.name}</span>
            </div>
            {isEditing ? (
              <Input
                type="number"
                value={tempScores.team2}
                onChange={(e) => setTempScores(prev => ({ ...prev, team2: e.target.value }))}
                className="w-16 h-8 text-center"
                min="0"
              />
            ) : (
              <span className="font-bold text-lg">{match.team2Score}</span>
            )}
          </div>

          {/* Actions */}
          {isAdmin && (
            <div className="flex gap-2 pt-2">
              {isEditing ? (
                <>
                  <Button size="sm" onClick={() => handleScoreUpdate(match.id)} className="flex-1">
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEditing} className="flex-1">
                    Cancel
                  </Button>
                </>
              ) : !match.completed ? (
                <Button size="sm" onClick={() => startEditing(match)} className="w-full">
                  Enter Score
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => startEditing(match)} className="w-full">
                  Edit Score
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const handleScoreUpdate = async (matchId: number) => {
    const team1Score = Number.parseInt(tempScores.team1) || 0
    const team2Score = Number.parseInt(tempScores.team2) || 0

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

  const getRoundName = (round: number) => {
    if (teams.length === 6) {
      if (round === 1) return "First Round"
      if (round === 2) return "Semifinals" 
      if (round === 3) return "Championship"
    } else {
      if (round === 1) return "Quarterfinals"
      if (round === 2) return "Semifinals" 
      if (round === 3) return "Championship"
    }
    return `Round ${round}`
  }

  return (
    <div className="space-y-8">
      {/* View Mode Notice */}
      {!isAdmin && matches.length > 0 && (
        <Alert className="border-blue-300 bg-blue-50">
          <AlertDescription className="text-blue-800">
            👀 Viewing tournament in spectator mode. Results update live as admins enter scores.
          </AlertDescription>
        </Alert>
      )}

      {/* Tournament Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Trophy className="w-8 h-8 text-yellow-600" />
          <h2 className="text-3xl font-bold">Knockout Tournament</h2>
          <Trophy className="w-8 h-8 text-yellow-600" />
        </div>
        
        {matches.length === 0 && isAdmin && (
          <Button onClick={generateFirstRound} size="lg" className="bg-red-600 hover:bg-red-700">
            Generate Tournament Bracket
          </Button>
        )}
        {matches.length === 0 && !isAdmin && (
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-blue-800 font-medium">Tournament bracket will be generated by admin</p>
          </div>
        )}
      </div>

      {/* Seeded Teams Preview */}
      {matches.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Tournament Seeding (Based on Pool Play)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {seededTeams.map((team) => (
                <div key={team.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Badge className="w-8 h-8 rounded-full flex items-center justify-center font-bold">
                    {team.seed}
                  </Badge>
                  <div>
                    <div className="font-medium">{team.name}</div>
                    <div className="text-xs text-gray-500">
                      {team.wins}W-{team.losses}L | +{team.pointsFor - team.pointsAgainst}
                    </div>
                  </div>
                  {team.isBye && (
                    <Badge variant="secondary" className="ml-auto">BYE</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bracket Display */}
      {matches.length > 0 && (
        <div className="space-y-8">
          {/* Bracket Rounds */}
          {[1, 2, 3].map((round) => {
            const roundMatches = matchesByRound[round] || []
            if (roundMatches.length === 0) return null

            return (
              <div key={round} className="space-y-4">
                <h3 className="text-xl font-bold text-center">{getRoundName(round)}</h3>
                <div className="flex flex-wrap justify-center gap-6">
                  {roundMatches.map((match) => (
                    <MatchCard 
                      key={match.id} 
                      match={match} 
                      roundName={getRoundName(round)}
                    />
                  ))}
                </div>
              </div>
            )
          })}

          {/* Championship Winner */}
          {(() => {
            const championshipMatch = matchesByRound[3]?.[0]
            if (championshipMatch?.completed) {
              const champion = championshipMatch.team1Score > championshipMatch.team2Score 
                ? championshipMatch.team1 
                : championshipMatch.team2
              const championSeed = seededTeams.find(t => t.id === champion.id)?.seed

              return (
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <Crown className="w-8 h-8 text-yellow-600" />
                    <h2 className="text-2xl font-bold">🏆 TOURNAMENT CHAMPION 🏆</h2>
                    <Crown className="w-8 h-8 text-yellow-600" />
                  </div>
                  <div className="inline-flex items-center gap-3 bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
                    <Badge className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold bg-yellow-600">
                      {championSeed}
                    </Badge>
                    <span className="text-2xl font-bold">{champion.name}</span>
                  </div>
                </div>
              )
            }
          })()}
        </div>
      )}
    </div>
  )
} 