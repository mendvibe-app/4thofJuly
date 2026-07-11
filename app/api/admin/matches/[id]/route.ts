import { NextResponse } from "next/server"
import { readAdminSessionFromRequest } from "@/lib/admin/session"
import { createServiceClient, isAdminApiEnabled } from "@/lib/supabase/server"

type ScoreBody = {
  team1Score?: number
  team2Score?: number
  completed?: boolean
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    if (!isAdminApiEnabled()) {
      return NextResponse.json({ error: "Admin API disabled" }, { status: 503 })
    }

    const session = readAdminSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const matchId = Number.parseInt(id, 10)
    if (!Number.isFinite(matchId)) {
      return NextResponse.json({ error: "Invalid match id" }, { status: 400 })
    }

    const body = (await request.json()) as ScoreBody
    const payload: Record<string, unknown> = {}
    if (body.team1Score !== undefined) payload.team1_score = body.team1Score
    if (body.team2Score !== undefined) payload.team2_score = body.team2Score
    if (body.completed !== undefined) payload.completed = body.completed

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from("matches")
      .update(payload)
      .eq("id", matchId)
      .select()
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, match: data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
