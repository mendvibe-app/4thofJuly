import type { Tournament } from "@/types/tournament"

function dateValue(date: string): number {
  const t = Date.parse(date.slice(0, 10))
  return Number.isNaN(t) ? 0 : t
}

/**
 * Pick the runtime primary tournament.
 * Prefer status=active (latest date if several), else latest date overall.
 */
export function pickPrimaryTournament(
  tournaments: Tournament[],
): Tournament | null {
  if (tournaments.length === 0) return null

  const active = tournaments
    .filter((t) => t.status === "active")
    .sort((a, b) => dateValue(b.date) - dateValue(a.date))

  if (active.length > 0) return active[0]

  return [...tournaments].sort((a, b) => dateValue(b.date) - dateValue(a.date))[0]
}

export function sortTournamentsForAdmin(tournaments: Tournament[]): Tournament[] {
  const rank = (status: Tournament["status"]) => {
    if (status === "active") return 0
    if (status === "upcoming") return 1
    return 2
  }

  return [...tournaments].sort((a, b) => {
    const statusDiff = rank(a.status) - rank(b.status)
    if (statusDiff !== 0) return statusDiff
    return dateValue(b.date) - dateValue(a.date)
  })
}
