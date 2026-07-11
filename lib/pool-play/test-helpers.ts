import type { Team, Match } from "@/types/tournament"

let nextId = 1

export function makeTeam(name: string, overrides: Partial<Team> = {}): Team {
  const id = overrides.id ?? nextId++
  return {
    id,
    tournamentId: 1,
    name,
    players: [`${name}-P1`, `${name}-P2`],
    paid: true,
    wins: 0,
    losses: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    ...overrides,
  }
}

export function makeTeams(count: number): Team[] {
  nextId = 1
  return Array.from({ length: count }, (_, i) => makeTeam(`Team ${i + 1}`))
}

export function makeCompletedMatch(
  team1: Team,
  team2: Team,
  score1: number,
  score2: number,
): Match {
  return {
    id: nextId++,
    tournamentId: 1,
    team1,
    team2,
    team1Score: score1,
    team2Score: score2,
    completed: true,
    phase: "pool-play",
  }
}

/** Deterministic RNG from a seed (mulberry32). */
export function seededRandom(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}
