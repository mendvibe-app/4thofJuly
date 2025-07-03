export interface Team {
  id: number
  name: string
  players: string[]
  paid: boolean
  wins: number
  losses: number
  pointsFor: number
  pointsAgainst: number
}

export interface Match {
  id: number
  team1: Team
  team2: Team
  team1Score: number
  team2Score: number
  completed: boolean
  phase: "pool-play" | "knockout"
  round?: number
}

export type TournamentPhase = "registration" | "pool-play" | "knockout"
