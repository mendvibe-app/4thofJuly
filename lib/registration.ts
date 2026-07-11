export const MAX_TEAMS = 16
export const MIN_TEAMS_TO_START = 4

export function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ")
}

export function namesMatch(a: string, b: string): boolean {
  return normalizeName(a).toLowerCase() === normalizeName(b).toLowerCase()
}

export type TeamInput = {
  teamName: string
  player1: string
  player2: string
}

/** Returns an error message, or null if valid. */
export function validateTeamInput(input: TeamInput): string | null {
  const teamName = normalizeName(input.teamName)
  const player1 = normalizeName(input.player1)
  const player2 = normalizeName(input.player2)

  if (!teamName) return "Please enter a team name"
  if (teamName.length < 2) return "Team name must be at least 2 characters"
  if (!player1) return "Please enter the first player's name"
  if (!player2) return "Please enter the second player's name"
  if (namesMatch(player1, player2)) {
    return "Player 1 and Player 2 must be different people"
  }
  return null
}

export function findDuplicateTeamName(
  teamName: string,
  existingNames: string[],
): string | null {
  const match = existingNames.find((name) => namesMatch(name, teamName))
  return match ? `A team named "${match}" is already registered` : null
}

export function formatSupabaseError(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message?: unknown }).message || "")
    if (message) return message
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}
