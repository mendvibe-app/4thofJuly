import { NextResponse } from "next/server"
import { readAdminSessionFromRequest } from "@/lib/admin/session"
import { createServiceClient, isAdminApiEnabled } from "@/lib/supabase/server"

type MatchInsertBody = {
  matches: Array<{
    tournamentId: number
    team1Id: number
    team2Id: number
    team1Score?: number
    team2Score?: number
    completed?: boolean
    phase: "pool-play" | "knockout"
    round?: number | null
  }>
}

export async function POST(request: Request) {
  try {
    if (!isAdminApiEnabled()) {
      return NextResponse.json({ error: "Admin API disabled" }, { status: 503 })
    }

    const session = readAdminSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await request.json()) as MatchInsertBody
    if (!body?.matches?.length) {
      return NextResponse.json({ error: "matches required" }, { status: 400 })
    }

    const supabase = createServiceClient()
    const rows = body.matches.map((m) => ({
      tournament_id: m.tournamentId,
      team1_id: m.team1Id,
      team2_id: m.team2Id,
      team1_score: m.team1Score ?? 0,
      team2_score: m.team2Score ?? 0,
      completed: m.completed ?? false,
      phase: m.phase,
      round: m.round ?? null,
    }))

    const { data, error } = await supabase.from("matches").insert(rows).select()

    if (error) {
      const isDuplicate =
        error.code === "23505" || /duplicate|unique/i.test(error.message || "")
      if (isDuplicate) {
        return NextResponse.json({ ok: true, deduped: true, matches: [] })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, matches: data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
