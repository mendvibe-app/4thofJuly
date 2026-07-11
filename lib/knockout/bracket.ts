import type { Match, Team } from "@/types/tournament"
import { calculateStandings } from "@/lib/pool-play"

export type KnockoutMatchDraft = Omit<Match, "id" | "tournamentId" | "tournament"> & {
  tournamentId?: number
}

export function nextPowerOfTwo(n: number): number {
  if (n <= 1) return 2
  return 2 ** Math.ceil(Math.log2(n))
}

export function getBracketSize(teamCount: number): number {
  return nextPowerOfTwo(teamCount)
}

export function getExpectedRounds(bracketSize: number): number {
  return Math.ceil(Math.log2(bracketSize))
}

/** Seed teams from pool-play standings (win %, then point diff, then points for). */
export function seedTeamsFromPool(teams: Team[], poolPlayMatches: Match[]): Team[] {
  const poolOnly = poolPlayMatches.filter((m) => m.phase === "pool-play")
  return calculateStandings(teams, poolOnly)
}

export function getSeedMap(seededTeams: Team[]): Map<number, number> {
  const map = new Map<number, number>()
  seededTeams.forEach((team, index) => {
    map.set(team.id, index + 1)
  })
  return map
}

export function getSeedNumber(team: Team, seedMap: Map<number, number>): number {
  return seedMap.get(team.id) ?? 1
}

export function getByeTeams(seededTeams: Team[]): Team[] {
  const bracketSize = getBracketSize(seededTeams.length)
  const byesNeeded = bracketSize - seededTeams.length
  if (byesNeeded <= 0) return []
  return seededTeams.slice(0, byesNeeded)
}

export function getRoundName(round: number, bracketSize: number): string {
  const expectedRounds = getExpectedRounds(bracketSize)
  if (round === expectedRounds) return "Championship"
  if (round === expectedRounds - 1) return "Semifinals"
  if (round === expectedRounds - 2) return "Quarterfinals"
  if (round === 1) return "First Round"
  return `Round ${round}`
}

export function getTargetScore(round: number, bracketSize: number): number {
  const expectedRounds = getExpectedRounds(bracketSize)
  if (round >= expectedRounds - 1) return 21
  return 15
}

export function getMatchWinner(match: Match): Team | null {
  if (!match.completed) return null
  if (match.team1Score === match.team2Score) return null
  return match.team1Score > match.team2Score ? match.team1 : match.team2
}

export function pairKey(a: number, b: number): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`
}

/**
 * Classic seeding for first round among teams that play:
 * highest remaining seed vs lowest remaining seed.
 */
export function pairHighestVsLowest(teams: Team[]): Array<{ team1: Team; team2: Team }> {
  const pairs: Array<{ team1: Team; team2: Team }> = []
  const list = [...teams]
  const half = Math.floor(list.length / 2)
  for (let i = 0; i < half; i++) {
    const team1 = list[i]
    const team2 = list[list.length - 1 - i]
    if (!team1 || !team2 || team1.id === team2.id) continue
    pairs.push({ team1, team2 })
  }
  return pairs
}

export type FirstRoundResult =
  | {
      ok: true
      bracketSize: number
      byeTeams: Team[]
      playingTeams: Team[]
      matches: KnockoutMatchDraft[]
      primaryByeTeamId: number | null
    }
  | { ok: false; error: string }

/** Build first-round knockout matches from seeded standings order. */
export function buildFirstRound(seededTeams: Team[]): FirstRoundResult {
  if (seededTeams.length < 2) {
    return { ok: false, error: "Need at least 2 teams for a knockout bracket" }
  }

  const ids = seededTeams.map((t) => t.id)
  if (new Set(ids).size !== ids.length) {
    return { ok: false, error: "Duplicate teams in standings" }
  }

  const bracketSize = getBracketSize(seededTeams.length)
  const byeTeams = getByeTeams(seededTeams)
  const playingTeams = seededTeams.slice(byeTeams.length)

  if (playingTeams.length % 2 !== 0) {
    return {
      ok: false,
      error: `First-round field must be even after byes (got ${playingTeams.length} playing)`,
    }
  }

  const byeIds = new Set(byeTeams.map((t) => t.id))
  const pairs = pairHighestVsLowest(playingTeams)
  const matches: KnockoutMatchDraft[] = []

  for (const { team1, team2 } of pairs) {
    if (byeIds.has(team1.id) || byeIds.has(team2.id)) {
      return { ok: false, error: `Bye team incorrectly scheduled: ${team1.name} vs ${team2.name}` }
    }
    matches.push({
      team1,
      team2,
      team1Score: 0,
      team2Score: 0,
      completed: false,
      phase: "knockout",
      round: 1,
    })
  }

  const placed = byeTeams.length + matches.length * 2
  if (placed !== seededTeams.length) {
    return {
      ok: false,
      error: `Team count mismatch (${placed}/${seededTeams.length} placed)`,
    }
  }

  return {
    ok: true,
    bracketSize,
    byeTeams,
    playingTeams,
    matches,
    primaryByeTeamId: byeTeams[0]?.id ?? null,
  }
}

export type NextRoundPlan =
  | { kind: "noop" }
  | { kind: "champion"; champion: Team }
  | { kind: "matches"; round: number; matches: KnockoutMatchDraft[] }

/**
 * Pure planner for advancing a completed knockout round.
 * Callers still own persistence / admin locks.
 */
export function planNextRound(args: {
  currentRound: number
  currentRoundMatches: Match[]
  existingKnockoutMatches: Match[]
  byeTeams: Team[]
  seedMap: Map<number, number>
  bracketSize: number
}): NextRoundPlan {
  const {
    currentRound,
    currentRoundMatches,
    existingKnockoutMatches,
    byeTeams,
    seedMap,
    bracketSize,
  } = args

  if (currentRoundMatches.length === 0) return { kind: "noop" }
  if (!currentRoundMatches.every((m) => m.completed)) return { kind: "noop" }

  const nextRound = currentRound + 1
  const existingNext = existingKnockoutMatches.filter((m) => m.round === nextRound)
  if (existingNext.length > 0) return { kind: "noop" }

  const expectedFinalRound = getExpectedRounds(bracketSize)

  // Single completed match in the championship round → champion
  if (currentRoundMatches.length === 1 && currentRound === expectedFinalRound) {
    const champion = getMatchWinner(currentRoundMatches[0])
    if (!champion) return { kind: "noop" }
    return { kind: "champion", champion }
  }

  const winners: Team[] = []
  for (const match of currentRoundMatches) {
    const winner = getMatchWinner(match)
    if (!winner) return { kind: "noop" }
    winners.push(winner)
  }

  // First round byes join after round 1 completes
  if (currentRound === 1 && byeTeams.length > 0) {
    winners.unshift(...byeTeams)
  }

  if (winners.length < 2) return { kind: "noop" }
  if (winners.length % 2 !== 0) {
    // Shouldn't happen with a valid power-of-two bracket; refuse rather than invent matches
    return { kind: "noop" }
  }

  winners.sort(
    (a, b) => getSeedNumber(a, seedMap) - getSeedNumber(b, seedMap),
  )

  const existingKeys = new Set(
    existingKnockoutMatches
      .filter((m) => m.round === nextRound)
      .map((m) => pairKey(m.team1.id, m.team2.id)),
  )

  const pairs = pairHighestVsLowest(winners)
  const matches: KnockoutMatchDraft[] = []

  for (const { team1, team2 } of pairs) {
    if (team1.id === team2.id) continue
    const key = pairKey(team1.id, team2.id)
    if (existingKeys.has(key)) continue
    matches.push({
      team1,
      team2,
      team1Score: 0,
      team2Score: 0,
      completed: false,
      phase: "knockout",
      round: nextRound,
    })
  }

  if (matches.length === 0) return { kind: "noop" }
  return { kind: "matches", round: nextRound, matches }
}

export function organizeRounds(matches: Match[]): {
  rounds: Record<number, Match[]>
  roundNumbers: number[]
  totalRounds: number
} {
  const rounds = matches.reduce(
    (acc, match) => {
      const round = match.round || 1
      if (!acc[round]) acc[round] = []
      acc[round].push(match)
      return acc
    },
    {} as Record<number, Match[]>,
  )

  Object.keys(rounds).forEach((key) => {
    rounds[Number(key)].sort((a, b) => a.id - b.id)
  })

  const roundNumbers = Object.keys(rounds)
    .map(Number)
    .sort((a, b) => a - b)

  const totalRounds = Math.max(...roundNumbers, 1)
  return { rounds, roundNumbers, totalRounds }
}

export function findChampion(
  knockoutMatches: Match[],
  bracketSize: number,
): Team | null {
  const finalRound = getExpectedRounds(bracketSize)
  const finals = knockoutMatches.filter(
    (m) => m.phase === "knockout" && m.round === finalRound && m.completed,
  )
  if (finals.length !== 1) return null
  return getMatchWinner(finals[0])
}
