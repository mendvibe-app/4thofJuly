import { describe, expect, it } from "vitest"
import {
  calculateStandings,
  generatePoolPlaySchedule,
  gamesPlayedByTeam,
} from "@/lib/pool-play"
import { makeCompletedMatch, makeTeams, seededRandom } from "@/lib/pool-play/test-helpers"

function pairKey(a: number, b: number) {
  return a < b ? `${a}:${b}` : `${b}:${a}`
}

describe("generatePoolPlaySchedule", () => {
  const teamCounts = [4, 5, 6, 7, 8, 9, 12]

  for (const count of teamCounts) {
    it(`gives every team at least 3 games for ${count} teams`, () => {
      const teams = makeTeams(count)
      const result = generatePoolPlaySchedule(teams, [], {
        gamesPerTeam: 3,
        random: seededRandom(42 + count),
      })

      expect(result.ok).toBe(true)
      if (!result.ok) return

      const counts = gamesPlayedByTeam(teams, result.matches)
      for (const team of teams) {
        expect(counts.get(team.id) ?? 0).toBeGreaterThanOrEqual(3)
      }
    })

    it(`never creates self-matches or duplicate matchups for ${count} teams`, () => {
      const teams = makeTeams(count)
      const result = generatePoolPlaySchedule(teams, [], {
        gamesPerTeam: 3,
        random: seededRandom(100 + count),
      })

      expect(result.ok).toBe(true)
      if (!result.ok) return

      const pairs = new Set<string>()
      for (const match of result.matches) {
        expect(match.team1.id).not.toBe(match.team2.id)
        const key = pairKey(match.team1.id, match.team2.id)
        expect(pairs.has(key)).toBe(false)
        pairs.add(key)
      }
    })
  }

  it("caps target games at opponents available", () => {
    const teams = makeTeams(4)
    const result = generatePoolPlaySchedule(teams, [], {
      gamesPerTeam: 99,
      random: seededRandom(7),
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.targetGames).toBe(3) // 4 teams → max 3 opponents
  })

  it("respects existing matches and does not regenerate them", () => {
    const teams = makeTeams(6)
    const existing = [
      makeCompletedMatch(teams[0], teams[1], 21, 10),
      makeCompletedMatch(teams[2], teams[3], 21, 15),
    ]

    const result = generatePoolPlaySchedule(teams, existing, {
      gamesPerTeam: 3,
      random: seededRandom(55),
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    const existingKeys = new Set(
      existing.map((m) => pairKey(m.team1.id, m.team2.id)),
    )
    for (const match of result.matches) {
      expect(existingKeys.has(pairKey(match.team1.id, match.team2.id))).toBe(
        false,
      )
    }

    const totals = gamesPlayedByTeam(teams, [...existing, ...result.matches])
    for (const team of teams) {
      expect(totals.get(team.id) ?? 0).toBeGreaterThanOrEqual(3)
    }
  })

  it("fails clearly with fewer than 4 teams", () => {
    const teams = makeTeams(3)
    const result = generatePoolPlaySchedule(teams, [], { gamesPerTeam: 3 })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/at least 4/i)
  })

  it("is deterministic with the same seed", () => {
    const teamsA = makeTeams(8)
    const teamsB = makeTeams(8)
    const a = generatePoolPlaySchedule(teamsA, [], {
      gamesPerTeam: 3,
      random: seededRandom(999),
    })
    const b = generatePoolPlaySchedule(teamsB, [], {
      gamesPerTeam: 3,
      random: seededRandom(999),
    })

    expect(a.ok && b.ok).toBe(true)
    if (!a.ok || !b.ok) return

    expect(
      a.matches.map((m) => pairKey(m.team1.id, m.team2.id)).join("|"),
    ).toBe(b.matches.map((m) => pairKey(m.team1.id, m.team2.id)).join("|"))
  })
})

describe("calculateStandings", () => {
  it("ranks by win percentage then point differential", () => {
    const teams = makeTeams(3)
    // Keep ids stable: Team 1,2,3
    const matches = [
      makeCompletedMatch(teams[0], teams[1], 21, 10), // T1 win
      makeCompletedMatch(teams[0], teams[2], 21, 18), // T1 win
      makeCompletedMatch(teams[1], teams[2], 21, 5), // T2 win
    ]

    const standings = calculateStandings(teams, matches)
    expect(standings[0].id).toBe(teams[0].id) // 2-0
    expect(standings[1].id).toBe(teams[1].id) // 1-1 with better diff than T3
    expect(standings[2].id).toBe(teams[2].id) // 0-2
    expect(standings[0].wins).toBe(2)
    expect(standings[0].gamesPlayed).toBe(2)
  })
})
