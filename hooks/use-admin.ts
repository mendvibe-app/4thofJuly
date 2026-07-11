import { useState, useEffect, useCallback } from "react"

const ADMIN_PASSCODE = process.env.NEXT_PUBLIC_ADMIN_PASSCODE || "july4admin"

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminName, setAdminName] = useState("")

  useEffect(() => {
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
    return passcode.toLowerCase().trim() === ADMIN_PASSCODE.toLowerCase()
  }, [])

  const loginAsAdmin = useCallback(
    (passcode: string, name: string) => {
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
    loginAsAdmin,
    logoutAdmin,
    kickAllAdmins,
    isValidPasscode,
  }
}
