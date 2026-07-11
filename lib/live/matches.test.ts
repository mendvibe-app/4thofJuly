import { describe, expect, it } from "vitest"
import {
  buildAnnouncement,
  formatTeamName,
  getCurrentLiveMatch,
  getMatchNumber,
  getNextMatch,
  getTimeLeft,
  getTournamentStartAt,
} from "@/lib/live"
import { makeTeam } from "@/lib/pool-play/test-helpers"
import type { Match } from "@/types/tournament"

function match(
  id: number,
  overrides: Partial<Match> & Pick<Match, "team1" | "team2">,
): Match {
  return {
    id,
    tournamentId: 1,
    team1Score: 0,
    team2Score: 0,
    completed: false,
    phase: "pool-play",
    ...overrides,
  }
}

describe("live match selection", () => {
  const a = makeTeam("Aces", { id: 1 })
  const b = makeTeam("Bolts", { id: 2 })
  const c = makeTeam("Crushers", { id: 3 })
  const d = makeTeam("Dynamos", { id: 4 })

  it("returns null during registration", () => {
    const matches = [match(1, { team1: a, team2: b, team1Score: 10, team2Score: 8 })]
    expect(getCurrentLiveMatch(matches, "registration")).toBeNull()
    expect(getNextMatch(matches, "registration")).toBeNull()
  })

  it("prefers in-progress (scored) incomplete matches as live", () => {
    const matches = [
      match(1, { team1: a, team2: b }),
      match(2, { team1: c, team2: d, team1Score: 7, team2Score: 5 }),
    ]
    const live = getCurrentLiveMatch(matches, "pool-play")
    expect(live?.id).toBe(2)
    expect(getNextMatch(matches, "pool-play", live)?.id).toBe(1)
  })

  it("falls back to first incomplete when none have scores", () => {
    const matches = [
      match(5, { team1: a, team2: b }),
      match(2, { team1: c, team2: d }),
    ]
    expect(getCurrentLiveMatch(matches, "pool-play")?.id).toBe(2)
  })

  it("numbers matches by creation id without mutating input", () => {
    const matches = [
      match(3, { team1: a, team2: b }),
      match(1, { team1: c, team2: d }),
    ]
    const copy = [...matches]
    expect(getMatchNumber(matches, matches[0])).toBe(2)
    expect(matches.map((m) => m.id)).toEqual(copy.map((m) => m.id))
  })

  it("builds announcement text", () => {
    const live = match(1, {
      team1: a,
      team2: b,
      team1Score: 11,
      team2Score: 9,
    })
    const next = match(2, { team1: c, team2: d })
    expect(buildAnnouncement(live, next)).toContain("Live game: Aces 11")
    expect(buildAnnouncement(live, next)).toContain("Next up: Crushers versus Dynamos")
    expect(formatTeamName("Super Long Team Name Here")).toBe("Super Long T...")
  })
})

describe("tournament start helpers", () => {
  it("parses tournament date to 10:00 local", () => {
    const start = getTournamentStartAt("2026-07-04")
    expect(start).not.toBeNull()
    expect(start?.getHours()).toBe(10)
    expect(start?.getDate()).toBe(4)
  })

  it("returns null for bad dates", () => {
    expect(getTournamentStartAt("nope")).toBeNull()
    expect(getTournamentStartAt(null)).toBeNull()
  })

  it("computes countdown parts", () => {
    const from = new Date("2026-07-01T10:00:00")
    const to = new Date("2026-07-04T12:30:15")
    expect(getTimeLeft(from, to)).toEqual({
      days: 3,
      hours: 2,
      minutes: 30,
      seconds: 15,
    })
    expect(getTimeLeft(to, from)).toBeNull()
  })
})
