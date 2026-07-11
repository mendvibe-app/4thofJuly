import { describe, expect, it } from "vitest"
import {
  createAdminSessionToken,
  verifyAdminSessionToken,
} from "@/lib/admin/session"

describe("admin session token", () => {
  it("round-trips a valid session", () => {
    const token = createAdminSessionToken("Mikey")
    expect(verifyAdminSessionToken(token)?.name).toBe("Mikey")
  })

  it("rejects tampered tokens", () => {
    const token = createAdminSessionToken("Mikey")
    const [body] = token.split(".")
    expect(verifyAdminSessionToken(`${body}.tampered`)).toBeNull()
    expect(verifyAdminSessionToken(undefined)).toBeNull()
  })
})
