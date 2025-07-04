import { useState, useEffect, useCallback } from 'react'

// Admin configuration - this can be easily changed during tournament
const ADMIN_PASSCODE = 'july4admin'

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminName, setAdminName] = useState('')

  // Load admin state from localStorage on mount
  useEffect(() => {
    const savedAdminState = localStorage.getItem('tournament-admin-state')
    if (savedAdminState) {
      try {
        const { isAdmin: savedIsAdmin, adminName: savedAdminName, timestamp } = JSON.parse(savedAdminState)
        
        // Check if admin session is still valid (expires after 48 hours)
        const now = Date.now()
        const fortyEightHoursInMs = 48 * 60 * 60 * 1000
        
        if (now - timestamp < fortyEightHoursInMs) {
          setIsAdmin(savedIsAdmin)
          setAdminName(savedAdminName)
          console.log(`🔐 Admin session restored for: ${savedAdminName}`)
        } else {
          // Session expired, clear it
          localStorage.removeItem('tournament-admin-state')
          console.log('🔐 Admin session expired, cleared.')
        }
      } catch (error) {
        console.error('Error loading admin state:', error)
        localStorage.removeItem('tournament-admin-state')
      }
    }
  }, [])

  const isValidPasscode = useCallback((passcode: string) => {
    return passcode.toLowerCase().trim() === ADMIN_PASSCODE.toLowerCase()
  }, [])

  const loginAsAdmin = useCallback((passcode: string, name: string) => {
    if (isValidPasscode(passcode)) {
      setIsAdmin(true)
      setAdminName(name.trim())
      
      // Save admin state to localStorage
      const adminState = {
        isAdmin: true,
        adminName: name.trim(),
        timestamp: Date.now()
      }
      localStorage.setItem('tournament-admin-state', JSON.stringify(adminState))
      
      console.log(`🔐 Admin login successful: ${name}`)
      return true
    }
    return false
  }, [isValidPasscode])

  const logoutAdmin = useCallback(() => {
    setIsAdmin(false)
    setAdminName('')
    localStorage.removeItem('tournament-admin-state')
    console.log('🔐 Admin logout successful')
  }, [])

  const kickAllAdmins = useCallback(() => {
    // This would typically clear all admin sessions
    // For now, we'll just clear the current session
    setIsAdmin(false)
    setAdminName('')
    localStorage.removeItem('tournament-admin-state')
    console.log('🔐 All admin sessions cleared')
  }, [])

  return {
    isAdmin,
    adminName,
    loginAsAdmin,
    logoutAdmin,
    kickAllAdmins,
    isValidPasscode
  }
} 