import { describe, expect, it } from "vitest"
import {
  CLOSE_GAME_LOSER,
  GAME_POINT,
  isValidCompletedScore,
} from "@/lib/scoring"

describe("scoring", () => {
  it("uses 11 win-by-2 as the published game target", () => {
    expect(GAME_POINT).toBe(11)
    expect(CLOSE_GAME_LOSER).toBe(9)
  })

  it("accepts standard and deuce finishes", () => {
    expect(isValidCompletedScore(11, 0)).toBe(true)
    expect(isValidCompletedScore(11, 9)).toBe(true)
    expect(isValidCompletedScore(12, 10)).toBe(true)
  })

  it("rejects ties and short wins", () => {
    expect(isValidCompletedScore(11, 11)).toBe(false)
    expect(isValidCompletedScore(11, 10)).toBe(false)
    expect(isValidCompletedScore(10, 8)).toBe(false)
  })
})
