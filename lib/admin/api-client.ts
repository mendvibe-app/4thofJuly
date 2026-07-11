/** Client helpers when NEXT_PUBLIC_ADMIN_API_ENABLED=true */

export function adminApiEnabledOnClient(): boolean {
  return process.env.NEXT_PUBLIC_ADMIN_API_ENABLED === "true"
}

export async function adminApiLogin(passcode: string, name: string): Promise<boolean> {
  const res = await fetch("/api/admin/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ passcode, name }),
  })
  return res.ok
}

export async function adminApiLogout(): Promise<void> {
  await fetch("/api/admin/session", { method: "DELETE", credentials: "include" })
}

export async function adminCreateMatches(
  matches: Array<{
    tournamentId: number
    team1Id: number
    team2Id: number
    team1Score?: number
    team2Score?: number
    completed?: boolean
    phase: "pool-play" | "knockout"
    round?: number | null
  }>,
): Promise<void> {
  const res = await fetch("/api/admin/matches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ matches }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Admin API create failed (${res.status})`)
  }
}

export async function adminUpdateMatch(
  matchId: number,
  updates: { team1Score?: number; team2Score?: number; completed?: boolean },
): Promise<void> {
  const res = await fetch(`/api/admin/matches/${matchId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(updates),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Admin API update failed (${res.status})`)
  }
}
