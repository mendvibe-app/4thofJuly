export interface Tournament {
  id: number
  name: string
  date: string
  status: 'upcoming' | 'active' | 'completed'
  currentPhase: 'registration' | 'pool-play' | 'knockout'
  byeTeamId?: number
  byeTeam?: Team
  createdAt: string
  updatedAt: string
}

export interface PendingRegistration {
  id: number
  tournamentId: number
  tournament?: Tournament
  teamName: string
  players: string[]
  contactInfo?: string
  status: 'pending' | 'approved' | 'rejected'
  adminNotes?: string
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
}

export interface Team {
  id: number
  tournamentId: number
  tournament?: Tournament
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
  tournamentId: number
  tournament?: Tournament
  team1: Team
  team2: Team
  team1Score: number
  team2Score: number
  completed: boolean
  phase: "pool-play" | "knockout"
  round?: number
}

export type TournamentPhase = "registration" | "pool-play" | "knockout"
export type TournamentStatus = "upcoming" | "active" | "completed"
export type RegistrationStatus = "pending" | "approved" | "rejected"
