import type { Match, TournamentPhase } from "@/types/tournament"

function sortMatchQueue(a: Match, b: Match): number {
  if (a.phase !== b.phase) {
    return a.phase === "pool-play" ? -1 : 1
  }
  if ((a.round || 0) !== (b.round || 0)) {
    return (a.round || 0) - (b.round || 0)
  }
  return a.id - b.id
}

/** Incomplete match that looks in-progress (has scores), else first incomplete. */
export function getCurrentLiveMatch(
  matches: Match[],
  phase: TournamentPhase,
): Match | null {
  if (phase === "registration") return null

  const incomplete = matches.filter((match) => !match.completed)
  if (incomplete.length === 0) return null

  const withScores = incomplete.filter(
    (match) => match.team1Score > 0 || match.team2Score > 0,
  )

  const pool = (withScores.length > 0 ? withScores : incomplete).slice()
  pool.sort((a, b) => a.id - b.id)
  return pool[0] ?? null
}

/** Next incomplete match after the current live one. */
export function getNextMatch(
  matches: Match[],
  phase: TournamentPhase,
  currentLive: Match | null = getCurrentLiveMatch(matches, phase),
): Match | null {
  if (phase === "registration") return null

  const incomplete = matches
    .filter((match) => !match.completed)
    .filter((match) => (currentLive ? match.id !== currentLive.id : true))
    .slice()
    .sort(sortMatchQueue)

  return incomplete[0] ?? null
}

export function getMatchNumber(matches: Match[], match: Match): number {
  const ordered = matches.slice().sort((a, b) => a.id - b.id)
  const index = ordered.findIndex((m) => m.id === match.id)
  return index >= 0 ? index + 1 : 0
}

export function formatTeamName(teamName: string, max = 15): string {
  return teamName.length > max ? `${teamName.substring(0, max - 3)}...` : teamName
}

export function buildAnnouncement(
  currentMatch: Match | null,
  nextMatch: Match | null,
): string {
  const parts: string[] = []

  if (currentMatch) {
    parts.push(
      `Live game: ${currentMatch.team1.name} ${currentMatch.team1Score}, ${currentMatch.team2.name} ${currentMatch.team2Score}`,
    )
  }

  if (nextMatch) {
    parts.push(
      `Next up: ${nextMatch.team1.name} versus ${nextMatch.team2.name}`,
    )
  }

  return parts.join(". ")
}
