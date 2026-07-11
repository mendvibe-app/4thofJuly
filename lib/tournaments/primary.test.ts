import { describe, expect, it } from "vitest"
import { pickPrimaryTournament, sortTournamentsForAdmin } from "@/lib/tournaments"
import type { Tournament } from "@/types/tournament"

function tournament(partial: Partial<Tournament> & Pick<Tournament, "id" | "name" | "date" | "status">): Tournament {
  return {
    currentPhase: "registration",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    ...partial,
  }
}

describe("pickPrimaryTournament", () => {
  it("returns null for empty list", () => {
    expect(pickPrimaryTournament([])).toBeNull()
  })

  it("prefers active over newer upcoming", () => {
    const tournaments = [
      tournament({ id: 1, name: "Old Active", date: "2025-07-04", status: "active" }),
      tournament({ id: 2, name: "New Upcoming", date: "2026-07-04", status: "upcoming" }),
    ]
    expect(pickPrimaryTournament(tournaments)?.id).toBe(1)
  })

  it("among multiple active, picks latest date", () => {
    const tournaments = [
      tournament({ id: 1, name: "A", date: "2025-07-04", status: "active" }),
      tournament({ id: 2, name: "B", date: "2026-07-04", status: "active" }),
    ]
    expect(pickPrimaryTournament(tournaments)?.id).toBe(2)
  })

  it("falls back to latest date when none active", () => {
    const tournaments = [
      tournament({ id: 1, name: "A", date: "2024-07-04", status: "completed" }),
      tournament({ id: 2, name: "B", date: "2026-07-04", status: "upcoming" }),
    ]
    expect(pickPrimaryTournament(tournaments)?.id).toBe(2)
  })
})

describe("sortTournamentsForAdmin", () => {
  it("orders active, then upcoming, then completed", () => {
    const tournaments = [
      tournament({ id: 1, name: "Done", date: "2024-07-04", status: "completed" }),
      tournament({ id: 2, name: "Soon", date: "2026-07-04", status: "upcoming" }),
      tournament({ id: 3, name: "Now", date: "2025-07-04", status: "active" }),
    ]
    expect(sortTournamentsForAdmin(tournaments).map((t) => t.id)).toEqual([3, 2, 1])
  })
})
