import { describe, expect, it } from "vitest"
import {
  findDuplicateTeamName,
  MAX_TEAMS,
  normalizeName,
  validateTeamInput,
} from "@/lib/registration"

describe("registration validation", () => {
  it("requires team name and two distinct players", () => {
    expect(validateTeamInput({ teamName: "", player1: "A", player2: "B" })).toBeTruthy()
    expect(validateTeamInput({ teamName: "T", player1: "A", player2: "A" })).toBeTruthy()
    expect(validateTeamInput({ teamName: "Tigers", player1: "A", player2: "B" })).toBeNull()
  })

  it("normalizes names for duplicate checks", () => {
    expect(normalizeName("  Ace  Team ")).toBe("Ace Team")
    expect(findDuplicateTeamName("Ace Team", ["ace team", "Other"])).toBeTruthy()
    expect(findDuplicateTeamName("New", ["ace team"])).toBeNull()
  })

  it("exposes a team cap", () => {
    expect(MAX_TEAMS).toBeGreaterThanOrEqual(4)
  })
})
