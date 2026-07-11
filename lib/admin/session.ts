import { createHmac, timingSafeEqual } from "crypto"

const COOKIE_NAME = "hw_admin_session"
const MAX_AGE_SEC = 48 * 60 * 60

function sessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_ADMIN_PASSCODE ||
    "dev-only-admin-session"
  )
}

export function resolveApiAdminPasscode(): string | null {
  const serverOnly = process.env.ADMIN_PASSCODE?.trim()
  if (serverOnly) return serverOnly
  const pub = process.env.NEXT_PUBLIC_ADMIN_PASSCODE?.trim()
  if (pub) return pub
  if (process.env.NODE_ENV === "production") return null
  return "july4admin"
}

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url")
}

export function createAdminSessionToken(adminName: string): string {
  const body = Buffer.from(
    JSON.stringify({
      name: adminName,
      exp: Date.now() + MAX_AGE_SEC * 1000,
    }),
    "utf8",
  ).toString("base64url")
  return `${body}.${sign(body)}`
}

export function verifyAdminSessionToken(token: string | undefined): { name: string } | null {
  if (!token) return null
  const [body, sig] = token.split(".")
  if (!body || !sig) return null
  const expected = sign(body)
  try {
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  } catch {
    return null
  }

  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      name?: string
      exp?: number
    }
    if (!parsed.exp || Date.now() > parsed.exp) return null
    return { name: parsed.name || "Admin" }
  } catch {
    return null
  }
}

export function adminSessionCookie(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : ""
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SEC}${secure}`
}

export function clearAdminSessionCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : ""
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`
}

export function readAdminSessionFromRequest(request: Request): { name: string } | null {
  const cookie = request.headers.get("cookie") || ""
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`))
  return verifyAdminSessionToken(match?.[1])
}

export { COOKIE_NAME }
