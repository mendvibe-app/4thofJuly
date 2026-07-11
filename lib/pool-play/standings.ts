import type { Match, Team } from "@/types/tournament"

export type StandingRow = Team & {
  pointDifferential: number
  winPercentage: number
  gamesPlayed: number
}

export function calculateStandings(teams: Team[], matches: Match[]): StandingRow[] {
  const standings = teams.map((team) => {
    const teamMatches = matches.filter(
      (match) => match.team1.id === team.id || match.team2.id === team.id,
    )
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
    const winPercentage =
      completedMatches.length > 0 ? wins / completedMatches.length : 0

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

  return standings.sort((a, b) => {
    if (b.winPercentage !== a.winPercentage) return b.winPercentage - a.winPercentage
    if (b.pointDifferential !== a.pointDifferential) {
      return b.pointDifferential - a.pointDifferential
    }
    return b.pointsFor - a.pointsFor
  })
}
