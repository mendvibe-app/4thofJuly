/**
 * Harbor Way soccer tennis scoring.
 * Matches app/rules: first to GAME_POINT, win by WIN_BY.
 */
export const GAME_POINT = 11
export const WIN_BY = 2

/** Typical close-game loser score (e.g. 11–9). */
export const CLOSE_GAME_LOSER = GAME_POINT - WIN_BY

/** Blowout preset winner/loser. */
export const BLOWOUT_WINNER = GAME_POINT
export const BLOWOUT_LOSER = 0

export function isValidCompletedScore(winnerScore: number, loserScore: number): boolean {
  if (winnerScore === loserScore) return false
  const high = Math.max(winnerScore, loserScore)
  const low = Math.min(winnerScore, loserScore)
  if (high < GAME_POINT) return false
  if (high === GAME_POINT) return high - low >= WIN_BY
  // Extra points past GAME_POINT still require win-by
  return high - low >= WIN_BY
}
