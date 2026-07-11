import { describe, expect, it } from "vitest"
import {
  buildFirstRound,
  findChampion,
  getBracketSize,
  getByeTeams,
  getExpectedRounds,
  getRoundName,
  getSeedMap,
  getTargetScore,
  planNextRound,
  seedTeamsFromPool,
} from "@/lib/knockout"
import { makeCompletedMatch, makeTeams, makeTeam } from "@/lib/pool-play/test-helpers"
import type { Match, Team } from "@/types/tournament"

function complete(match: Match, score1: number, score2: number): Match {
  return {
    ...match,
    team1Score: score1,
    team2Score: score2,
    completed: true,
  }
}

describe("bracket sizing", () => {
  it("pads to next power of two", () => {
    expect(getBracketSize(5)).toBe(8)
    expect(getBracketSize(6)).toBe(8)
    expect(getBracketSize(8)).toBe(8)
    expect(getBracketSize(9)).toBe(16)
    expect(getExpectedRounds(8)).toBe(3)
  })

  it("names rounds from bracket size", () => {
    expect(getRoundName(1, 8)).toBe("Quarterfinals")
    expect(getRoundName(2, 8)).toBe("Semifinals")
    expect(getRoundName(3, 8)).toBe("Championship")
    expect(getRoundName(1, 16)).toBe("First Round")
    expect(getTargetScore(1, 8)).toBe(11)
    expect(getTargetScore(3, 8)).toBe(11)
  })
})

describe("buildFirstRound", () => {
  it("gives byes to top seeds and pairs remaining highest vs lowest", () => {
    const teams = makeTeams(6) // bracket 8 → 2 byes
    const result = buildFirstRound(teams)

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.byeTeams.map((t) => t.id)).toEqual([teams[0].id, teams[1].id])
    expect(result.playingTeams).toHaveLength(4)
    expect(result.matches).toHaveLength(2)

    // Playing seeds 3,4,5,6 → pairs 3v6 and 4v5
    expect(result.matches[0].team1.id).toBe(teams[2].id)
    expect(result.matches[0].team2.id).toBe(teams[5].id)
    expect(result.matches[1].team1.id).toBe(teams[3].id)
    expect(result.matches[1].team2.id).toBe(teams[4].id)

    const playingIds = new Set(result.matches.flatMap((m) => [m.team1.id, m.team2.id]))
    for (const bye of result.byeTeams) {
      expect(playingIds.has(bye.id)).toBe(false)
    }
  })

  it("needs no byes for power-of-two fields", () => {
    const teams = makeTeams(8)
    const result = buildFirstRound(teams)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.byeTeams).toHaveLength(0)
    expect(result.matches).toHaveLength(4)
  })

  it("rejects tiny fields", () => {
    const teams = makeTeams(1)
    const result = buildFirstRound(teams)
    expect(result.ok).toBe(false)
  })
})

describe("planNextRound", () => {
  it("advances winners and merges round-1 byes", () => {
    const teams = makeTeams(6)
    const first = buildFirstRound(teams)
    expect(first.ok).toBe(true)
    if (!first.ok) return

    const seedMap = getSeedMap(teams)
    const completedRound1: Match[] = first.matches.map((m, i) =>
      complete(
        {
          id: i + 1,
          tournamentId: 1,
          team1: m.team1,
          team2: m.team2,
          team1Score: 0,
          team2Score: 0,
          completed: false,
          phase: "knockout",
          round: 1,
        },
        21,
        10, // team1 always wins
      ),
    )

    const plan = planNextRound({
      currentRound: 1,
      currentRoundMatches: completedRound1,
      existingKnockoutMatches: completedRound1,
      byeTeams: first.byeTeams,
      seedMap,
      bracketSize: first.bracketSize,
    })

    expect(plan.kind).toBe("matches")
    if (plan.kind !== "matches") return
    expect(plan.round).toBe(2)
    // 2 winners + 2 byes = 4 teams → 2 semis
    expect(plan.matches).toHaveLength(2)

    const ids = plan.matches.flatMap((m) => [m.team1.id, m.team2.id])
    expect(ids).toContain(teams[0].id) // bye
    expect(ids).toContain(teams[1].id) // bye
  })

  it("does not recreate an existing next round", () => {
    const teams = makeTeams(4)
    const first = buildFirstRound(teams)
    if (!first.ok) throw new Error("expected ok")

    const round1: Match[] = first.matches.map((m, i) =>
      complete(
        {
          id: i + 1,
          tournamentId: 1,
          ...m,
        },
        21,
        5,
      ),
    )

    const semisAlready: Match[] = [
      {
        id: 99,
        tournamentId: 1,
        team1: teams[0],
        team2: teams[3],
        team1Score: 0,
        team2Score: 0,
        completed: false,
        phase: "knockout",
        round: 2,
      },
    ]

    const plan = planNextRound({
      currentRound: 1,
      currentRoundMatches: round1,
      existingKnockoutMatches: [...round1, ...semisAlready],
      byeTeams: [],
      seedMap: getSeedMap(teams),
      bracketSize: 4,
    })

    expect(plan.kind).toBe("noop")
  })

  it("declares a champion after the final", () => {
    const a = makeTeam("A", { id: 1 })
    const b = makeTeam("B", { id: 2 })
    const finalMatch: Match = {
      id: 1,
      tournamentId: 1,
      team1: a,
      team2: b,
      team1Score: 21,
      team2Score: 18,
      completed: true,
      phase: "knockout",
      round: 2, // 4-team bracket → final is round 2
    }

    const plan = planNextRound({
      currentRound: 2,
      currentRoundMatches: [finalMatch],
      existingKnockoutMatches: [finalMatch],
      byeTeams: [],
      seedMap: getSeedMap([a, b]),
      bracketSize: 4,
    })

    expect(plan.kind).toBe("champion")
    if (plan.kind !== "champion") return
    expect(plan.champion.id).toBe(a.id)
    expect(findChampion([finalMatch], 4)?.id).toBe(a.id)
  })
})

describe("seedTeamsFromPool", () => {
  it("orders by pool standings", () => {
    const teams = makeTeams(3)
    const matches = [
      makeCompletedMatch(teams[2], teams[0], 21, 5), // T3 beats T1
      makeCompletedMatch(teams[2], teams[1], 21, 10), // T3 beats T2
      makeCompletedMatch(teams[1], teams[0], 21, 8), // T2 beats T1
    ]
    const seeded = seedTeamsFromPool(teams, matches)
    expect(seeded.map((t) => t.id)).toEqual([teams[2].id, teams[1].id, teams[0].id])
    expect(getByeTeams(seeded).map((t) => t.id)).toEqual([teams[2].id]) // 3→4 bracket, 1 bye
  })
})

describe("end-to-end 5-team bracket", () => {
  it("reaches a final without duplicate rounds or bye conflicts", () => {
    const teams = makeTeams(5) // bracket 8 → 3 byes, 2 play
    const first = buildFirstRound(teams)
    expect(first.ok).toBe(true)
    if (!first.ok) return

    expect(first.byeTeams).toHaveLength(3)
    expect(first.matches).toHaveLength(1)

    const seedMap = getSeedMap(teams)
    const r1: Match[] = first.matches.map((m, i) =>
      complete({ id: i + 1, tournamentId: 1, ...m }, 21, 7),
    )

    const toSemis = planNextRound({
      currentRound: 1,
      currentRoundMatches: r1,
      existingKnockoutMatches: r1,
      byeTeams: first.byeTeams,
      seedMap,
      bracketSize: 8,
    })
    expect(toSemis.kind).toBe("matches")
    if (toSemis.kind !== "matches") return
    // 1 winner + 3 byes = 4 → 2 matches
    expect(toSemis.matches).toHaveLength(2)

    const r2: Match[] = toSemis.matches.map((m, i) =>
      complete({ id: 10 + i, tournamentId: 1, ...m }, 21, 10),
    )

    const toFinal = planNextRound({
      currentRound: 2,
      currentRoundMatches: r2,
      existingKnockoutMatches: [...r1, ...r2],
      byeTeams: first.byeTeams,
      seedMap,
      bracketSize: 8,
    })
    expect(toFinal.kind).toBe("matches")
    if (toFinal.kind !== "matches") return
    expect(toFinal.matches).toHaveLength(1)
    expect(toFinal.round).toBe(3)
  })
})
