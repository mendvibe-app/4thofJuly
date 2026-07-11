import { MAX_TEAMS, findDuplicateTeamName } from "@/lib/registration"

export type ApprovalCandidate = {
  id: number
  tournamentId: number
  teamName: string
  status: "pending" | "approved" | "rejected"
}

export type ApprovalGateResult =
  | { ok: true }
  | { ok: false; error: string }

/**
 * Pure pre-flight checks before claiming a pending registration.
 * DB claim (status=pending → approved) still required for multi-admin safety.
 */
export function canApproveRegistration(
  registration: ApprovalCandidate,
  existingTeamNames: string[],
  teamCount: number,
): ApprovalGateResult {
  if (registration.status !== "pending") {
    return { ok: false, error: "This registration was already reviewed by someone else." }
  }

  if (teamCount >= MAX_TEAMS) {
    return {
      ok: false,
      error: `Cannot approve — tournament already has ${MAX_TEAMS} teams (maximum).`,
    }
  }

  const duplicate = findDuplicateTeamName(registration.teamName, existingTeamNames)
  if (duplicate) {
    return {
      ok: false,
      error: `${duplicate}. Reject this registration or rename/remove the existing team.`,
    }
  }

  return { ok: true }
}

export function teamInsertFromRegistration(registration: {
  tournamentId: number
  teamName: string
  players: string[]
}) {
  return {
    tournament_id: registration.tournamentId,
    name: registration.teamName,
    players: registration.players,
    paid: false,
    wins: 0,
    losses: 0,
    points_for: 0,
    points_against: 0,
  }
}
