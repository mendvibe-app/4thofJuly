import { describe, expect, it } from "vitest"
import { canApproveRegistration, teamInsertFromRegistration } from "@/lib/registration/approve"
import { MAX_TEAMS } from "@/lib/registration"

const pending = {
  id: 1,
  tournamentId: 10,
  teamName: "Ace Team",
  status: "pending" as const,
}

describe("canApproveRegistration", () => {
  it("allows a clean pending registration", () => {
    expect(canApproveRegistration(pending, ["Other"], 2)).toEqual({ ok: true })
  })

  it("blocks non-pending rows", () => {
    const result = canApproveRegistration({ ...pending, status: "approved" }, [], 0)
    expect(result.ok).toBe(false)
  })

  it("blocks when tournament is full", () => {
    const result = canApproveRegistration(pending, [], MAX_TEAMS)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain(String(MAX_TEAMS))
  })

  it("blocks duplicate team names", () => {
    const result = canApproveRegistration(pending, ["ace team"], 1)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.toLowerCase()).toContain("already registered")
  })
})

describe("teamInsertFromRegistration", () => {
  it("maps to unpaid team insert payload", () => {
    expect(
      teamInsertFromRegistration({
        tournamentId: 3,
        teamName: "Tigers",
        players: ["A", "B"],
      }),
    ).toMatchObject({
      tournament_id: 3,
      name: "Tigers",
      players: ["A", "B"],
      paid: false,
    })
  })
})
