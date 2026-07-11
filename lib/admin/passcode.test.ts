import { describe, expect, it } from "vitest"
import { fingerprintPasscode } from "@/lib/admin/passcode"

describe("fingerprintPasscode", () => {
  it("is stable for the same passcode", () => {
    expect(fingerprintPasscode("Secret")).toBe(fingerprintPasscode("secret"))
    expect(fingerprintPasscode("Secret")).toBe(fingerprintPasscode("  SECRET  "))
  })

  it("changes when the passcode changes", () => {
    expect(fingerprintPasscode("alpha")).not.toBe(fingerprintPasscode("beta"))
  })
})
