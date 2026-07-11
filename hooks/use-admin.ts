"use client"

import { useState, useEffect, useCallback } from "react"

const ENV_PASSCODE = process.env.NEXT_PUBLIC_ADMIN_PASSCODE
const DEV_FALLBACK_PASSCODE = "july4admin"
const IS_PROD = process.env.NODE_ENV === "production"

function resolveAdminPasscode(): string | null {
  if (ENV_PASSCODE && ENV_PASSCODE.trim().length > 0) {
    return ENV_PASSCODE.trim()
  }
  if (IS_PROD) {
    return null
  }
  return DEV_FALLBACK_PASSCODE
}

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminName, setAdminName] = useState("")
  const [passcodeConfigured, setPasscodeConfigured] = useState(true)

  useEffect(() => {
    setPasscodeConfigured(resolveAdminPasscode() !== null)

    const savedAdminState = localStorage.getItem("tournament-admin-state")
    if (!savedAdminState) return

    try {
      const {
        isAdmin: savedIsAdmin,
        adminName: savedAdminName,
        timestamp,
      } = JSON.parse(savedAdminState)

      const now = Date.now()
      const fortyEightHoursInMs = 48 * 60 * 60 * 1000

      if (now - timestamp < fortyEightHoursInMs) {
        setIsAdmin(savedIsAdmin)
        setAdminName(savedAdminName)
      } else {
        localStorage.removeItem("tournament-admin-state")
      }
    } catch {
      localStorage.removeItem("tournament-admin-state")
    }
  }, [])

  const isValidPasscode = useCallback((passcode: string) => {
    const expected = resolveAdminPasscode()
    if (!expected) return false
    return passcode.toLowerCase().trim() === expected.toLowerCase()
  }, [])

  const requireAdmin = useCallback(
    (action = "perform this action") => {
      if (!isAdmin) {
        alert(`Admin access required to ${action}.`)
        return false
      }
      return true
    },
    [isAdmin],
  )

  const loginAsAdmin = useCallback(
    (passcode: string, name: string) => {
      if (!resolveAdminPasscode()) {
        return false
      }
      if (!isValidPasscode(passcode)) return false

      setIsAdmin(true)
      setAdminName(name.trim())

      localStorage.setItem(
        "tournament-admin-state",
        JSON.stringify({
          isAdmin: true,
          adminName: name.trim(),
          timestamp: Date.now(),
        }),
      )

      return true
    },
    [isValidPasscode],
  )

  const logoutAdmin = useCallback(() => {
    setIsAdmin(false)
    setAdminName("")
    localStorage.removeItem("tournament-admin-state")
  }, [])

  const kickAllAdmins = useCallback(() => {
    setIsAdmin(false)
    setAdminName("")
    localStorage.removeItem("tournament-admin-state")
  }, [])

  return {
    isAdmin,
    adminName,
    passcodeConfigured,
    loginAsAdmin,
    logoutAdmin,
    kickAllAdmins,
    isValidPasscode,
    requireAdmin,
  }
}
