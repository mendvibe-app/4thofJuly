import type { Match, Team } from "@/types/tournament"

export type Matchup = { team1: Team; team2: Team }

export type PoolPlayMatchDraft = Omit<Match, "id" | "tournamentId" | "tournament"> & {
  tournamentId?: number
}

export type ScheduleResult =
  | { ok: true; matches: PoolPlayMatchDraft[]; targetGames: number }
  | { ok: false; error: string; targetGames: number }

export type ScheduleOptions = {
  /** Minimum games each team should receive (capped at teams.length - 1). */
  gamesPerTeam?: number
  /** RNG in [0, 1). Inject for deterministic tests. */
  random?: () => number
}

function pairKey(a: number, b: number): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`
}

function hasPlayed(
  team1Id: number,
  team2Id: number,
  existing: Match[],
  planned: Matchup[],
): boolean {
  const key = pairKey(team1Id, team2Id)
  const inExisting = existing.some(
    (m) => pairKey(m.team1.id, m.team2.id) === key,
  )
  if (inExisting) return true
  return planned.some((m) => pairKey(m.team1.id, m.team2.id) === key)
}

function shuffleInPlace<T>(items: T[], random: () => number): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return items
}

function countGames(
  teams: Team[],
  existing: Match[],
  planned: Matchup[],
): Map<number, number> {
  const counts = new Map<number, number>()
  teams.forEach((t) => counts.set(t.id, 0))

  const bump = (id: number) => counts.set(id, (counts.get(id) || 0) + 1)

  existing.forEach((m) => {
    bump(m.team1.id)
    bump(m.team2.id)
  })
  planned.forEach((m) => {
    bump(m.team1.id)
    bump(m.team2.id)
  })

  return counts
}

function validateInvariants(
  teams: Team[],
  existing: Match[],
  scheduled: PoolPlayMatchDraft[],
  targetGames: number,
): string | null {
  // No self-matches
  for (const m of scheduled) {
    if (m.team1.id === m.team2.id) {
      return `Self-match generated for ${m.team1.name}`
    }
  }

  // No duplicate matchups across existing + new
  const seen = new Set<string>()
  for (const m of existing) {
    const key = pairKey(m.team1.id, m.team2.id)
    if (seen.has(key)) return `Duplicate existing matchup detected`
    seen.add(key)
  }
  for (const m of scheduled) {
    const key = pairKey(m.team1.id, m.team2.id)
    if (seen.has(key)) {
      return `Duplicate matchup: ${m.team1.name} vs ${m.team2.name}`
    }
    seen.add(key)
  }

  // Each team reaches at least targetGames
  const below = teams.filter((team) => {
    const total =
      existing.filter((m) => m.team1.id === team.id || m.team2.id === team.id).length +
      scheduled.filter((m) => m.team1.id === team.id || m.team2.id === team.id).length
    return total < targetGames
  })

  if (below.length > 0) {
    return `Could not give all teams at least ${targetGames} games (${below
      .map((t) => t.name)
      .join(", ")} short)`
  }

  return null
}

/**
 * Generate additional pool-play matches so every team reaches at least
 * `gamesPerTeam` games (capped at opponents available), without duplicate
 * or self matchups. Order is optimized to reduce back-to-back play.
 */
export function generatePoolPlaySchedule(
  teams: Team[],
  existingMatches: Match[],
  options: ScheduleOptions = {},
): ScheduleResult {
  const random = options.random ?? Math.random
  const requestedGames = options.gamesPerTeam ?? 3

  if (teams.length < 4) {
    return {
      ok: false,
      error: "Need at least 4 teams to generate pool play",
      targetGames: requestedGames,
    }
  }

  const targetGames = Math.min(requestedGames, teams.length - 1)
  const planned: Matchup[] = []
  const tempCounts = countGames(teams, existingMatches, planned)

  // Phase 1: pair teams that both still need games
  const shuffledTeams = shuffleInPlace([...teams], random)

  for (let attempts = 0; attempts < 500; attempts++) {
    const needing = shuffledTeams.filter(
      (team) => (tempCounts.get(team.id) || 0) < targetGames,
    )
    if (needing.length < 2) break

    let matchCreated = false
    for (let i = 0; i < needing.length - 1 && !matchCreated; i++) {
      const team1 = needing[i]
      for (let j = i + 1; j < needing.length; j++) {
        const team2 = needing[j]
        const team1Games = tempCounts.get(team1.id) || 0
        const team2Games = tempCounts.get(team2.id) || 0
        if (team1Games >= targetGames || team2Games >= targetGames) continue
        if (hasPlayed(team1.id, team2.id, existingMatches, planned)) continue

        planned.push({ team1, team2 })
        tempCounts.set(team1.id, team1Games + 1)
        tempCounts.set(team2.id, team2Games + 1)
        matchCreated = true
        break
      }
    }

    if (!matchCreated) break
  }

  // Phase 2: fill remaining deficits, allowing opponents already at target
  let safety = 0
  while (safety < 50) {
    safety++
    const needing = shuffleInPlace(
      teams.filter((team) => (tempCounts.get(team.id) || 0) < targetGames),
      random,
    )
    if (needing.length === 0) break

    let added = false
    for (const team of needing) {
      const current = tempCounts.get(team.id) || 0
      const gamesNeeded = targetGames - current
      if (gamesNeeded <= 0) continue

      const opponents = teams
        .filter((opponent) => {
          if (opponent.id === team.id) return false
          return !hasPlayed(team.id, opponent.id, existingMatches, planned)
        })
        .sort(
          (a, b) => (tempCounts.get(a.id) || 0) - (tempCounts.get(b.id) || 0),
        )

      const toAdd = Math.min(gamesNeeded, opponents.length)
      for (let i = 0; i < toAdd; i++) {
        const opponent = opponents[i]
        // Re-check: opponent list was built once; skip if pair snuck in
        if (hasPlayed(team.id, opponent.id, existingMatches, planned)) continue
        planned.push({ team1: team, team2: opponent })
        tempCounts.set(team.id, (tempCounts.get(team.id) || 0) + 1)
        tempCounts.set(opponent.id, (tempCounts.get(opponent.id) || 0) + 1)
        added = true
      }
    }

    if (!added) break
  }

  // Schedule order: reduce back-to-back games
  const remaining = [...planned]
  const scheduled: PoolPlayMatchDraft[] = []
  const lastPlayed = new Map<number, number>()
  let round = 1

  while (remaining.length > 0) {
    let bestIndex = 0
    let bestScore = Number.NEGATIVE_INFINITY

    for (let i = 0; i < remaining.length; i++) {
      const match = remaining[i]
      const team1Last = lastPlayed.get(match.team1.id) || 0
      const team2Last = lastPlayed.get(match.team2.id) || 0
      const team1Rest = round - team1Last
      const team2Rest = round - team2Last

      let score = team1Rest + team2Rest
      if (team1Last === round - 1) score -= 10
      if (team2Last === round - 1) score -= 10
      if (team1Rest >= 2) score += 5
      if (team2Rest >= 2) score += 5
      if (team1Rest >= 3) score += 10
      if (team2Rest >= 3) score += 10

      if (score > bestScore) {
        bestScore = score
        bestIndex = i
      }
    }

    const best = remaining.splice(bestIndex, 1)[0]
    scheduled.push({
      team1: best.team1,
      team2: best.team2,
      team1Score: 0,
      team2Score: 0,
      completed: false,
      phase: "pool-play",
      round: undefined,
    })
    lastPlayed.set(best.team1.id, round)
    lastPlayed.set(best.team2.id, round)
    round++
  }

  const invariantError = validateInvariants(
    teams,
    existingMatches,
    scheduled,
    targetGames,
  )
  if (invariantError) {
    return { ok: false, error: invariantError, targetGames }
  }

  return { ok: true, matches: scheduled, targetGames }
}

export function gamesPlayedByTeam(
  teams: Team[],
  matches: Array<{ team1: { id: number }; team2: { id: number } }>,
): Map<number, number> {
  const counts = new Map<number, number>()
  teams.forEach((t) => counts.set(t.id, 0))
  matches.forEach((m) => {
    counts.set(m.team1.id, (counts.get(m.team1.id) || 0) + 1)
    counts.set(m.team2.id, (counts.get(m.team2.id) || 0) + 1)
  })
  return counts
}
