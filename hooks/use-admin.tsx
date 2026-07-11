"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { fingerprintPasscode } from "@/lib/admin/passcode"
import { adminApiEnabledOnClient, adminApiLogin, adminApiLogout } from "@/lib/admin/api-client"

const ADMIN_STORAGE_KEY = "tournament-admin-state"
const ENV_PASSCODE = process.env.NEXT_PUBLIC_ADMIN_PASSCODE
const DEV_FALLBACK_PASSCODE = "july4admin"
const IS_PROD = process.env.NODE_ENV === "production"
const SESSION_TTL_MS = 48 * 60 * 60 * 1000

type StoredAdminState = {
  isAdmin: boolean
  adminName: string
  timestamp: number
  passcodeFingerprint: string
}

type AdminContextValue = {
  isAdmin: boolean
  adminName: string
  passcodeConfigured: boolean
  loginAsAdmin: (passcode: string, name: string) => boolean
  logoutAdmin: () => void
  kickAllAdmins: () => void
  isValidPasscode: (passcode: string) => boolean
  requireAdmin: (action?: string) => boolean
}

const AdminContext = createContext<AdminContextValue | null>(null)

function resolveAdminPasscode(): string | null {
  if (ENV_PASSCODE && ENV_PASSCODE.trim().length > 0) {
    return ENV_PASSCODE.trim()
  }
  if (IS_PROD) {
    return null
  }
  return DEV_FALLBACK_PASSCODE
}

function readStoredAdminState(): StoredAdminState | null {
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredAdminState
    if (!parsed || typeof parsed.timestamp !== "number") return null
    return parsed
  } catch {
    return null
  }
}

function clearStoredAdminState() {
  localStorage.removeItem(ADMIN_STORAGE_KEY)
}

function applyStoredSession(
  expectedFingerprint: string | null,
): { isAdmin: boolean; adminName: string } {
  if (!expectedFingerprint) {
    clearStoredAdminState()
    return { isAdmin: false, adminName: "" }
  }

  const saved = readStoredAdminState()
  if (!saved) return { isAdmin: false, adminName: "" }

  const expired = Date.now() - saved.timestamp >= SESSION_TTL_MS
  const rotated = saved.passcodeFingerprint !== expectedFingerprint

  if (expired || rotated || !saved.isAdmin) {
    clearStoredAdminState()
    return { isAdmin: false, adminName: "" }
  }

  return { isAdmin: true, adminName: saved.adminName || "" }
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminName, setAdminName] = useState("")
  const [passcodeConfigured, setPasscodeConfigured] = useState(true)

  const syncFromStorage = useCallback(() => {
    const expected = resolveAdminPasscode()
    setPasscodeConfigured(expected !== null)
    const fingerprint = expected ? fingerprintPasscode(expected) : null
    const session = applyStoredSession(fingerprint)
    setIsAdmin(session.isAdmin)
    setAdminName(session.adminName)
  }, [])

  useEffect(() => {
    syncFromStorage()

    const onStorage = (event: StorageEvent) => {
      if (event.key === ADMIN_STORAGE_KEY || event.key === null) {
        syncFromStorage()
      }
    }

    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [syncFromStorage])

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
      const expected = resolveAdminPasscode()
      if (!expected) return false
      if (!isValidPasscode(passcode)) return false

      const trimmed = name.trim()
      setIsAdmin(true)
      setAdminName(trimmed)

      const payload: StoredAdminState = {
        isAdmin: true,
        adminName: trimmed,
        timestamp: Date.now(),
        passcodeFingerprint: fingerprintPasscode(expected),
      }
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(payload))

      if (adminApiEnabledOnClient()) {
        void adminApiLogin(passcode, trimmed)
      }

      return true
    },
    [isValidPasscode],
  )

  const logoutAdmin = useCallback(() => {
    setIsAdmin(false)
    setAdminName("")
    clearStoredAdminState()
    if (adminApiEnabledOnClient()) {
      void adminApiLogout()
    }
  }, [])

  const value = useMemo(
    () => ({
      isAdmin,
      adminName,
      passcodeConfigured,
      loginAsAdmin,
      logoutAdmin,
      kickAllAdmins: logoutAdmin,
      isValidPasscode,
      requireAdmin,
    }),
    [
      isAdmin,
      adminName,
      passcodeConfigured,
      loginAsAdmin,
      logoutAdmin,
      isValidPasscode,
      requireAdmin,
    ],
  )

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin(): AdminContextValue {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error("useAdmin must be used within AdminProvider")
  }
  return context
}
