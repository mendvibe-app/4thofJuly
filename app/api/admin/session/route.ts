import { NextResponse } from "next/server"
import {
  adminSessionCookie,
  clearAdminSessionCookie,
  createAdminSessionToken,
  resolveApiAdminPasscode,
} from "@/lib/admin/session"
import { isAdminApiEnabled } from "@/lib/supabase/server"

export async function POST(request: Request) {
  if (!isAdminApiEnabled()) {
    return NextResponse.json({ error: "Admin API disabled" }, { status: 503 })
  }

  const body = (await request.json()) as { passcode?: string; name?: string }
  const expected = resolveApiAdminPasscode()
  if (!expected) {
    return NextResponse.json({ error: "Passcode not configured" }, { status: 503 })
  }

  if (
    !body.passcode ||
    body.passcode.toLowerCase().trim() !== expected.toLowerCase()
  ) {
    return NextResponse.json({ error: "Invalid passcode" }, { status: 401 })
  }

  const name = (body.name || "Admin").trim() || "Admin"
  const token = createAdminSessionToken(name)
  const res = NextResponse.json({ ok: true, name })
  res.headers.set("Set-Cookie", adminSessionCookie(token))
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.headers.set("Set-Cookie", clearAdminSessionCookie())
  return res
}
