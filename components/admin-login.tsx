'use client'

import { useState } from 'react'
import { useAdmin } from '@/hooks/use-admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Settings, LogOut, Shield, User } from 'lucide-react'

export default function AdminLogin() {
  const { isAdmin, adminName, loginAsAdmin, logoutAdmin } = useAdmin()
  const [passcode, setPasscode] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!passcode.trim()) {
      setError('Please enter passcode')
      setIsLoading(false)
      return
    }

    if (!name.trim()) {
      setError('Please enter your name')
      setIsLoading(false)
      return
    }

    const success = loginAsAdmin(passcode, name)
    if (!success) {
      setError('Invalid passcode')
      setPasscode('')
    } else {
      setPasscode('')
      setName('')
      setIsOpen(false)
    }
    setIsLoading(false)
  }

  const handleLogout = () => {
    logoutAdmin()
    setPasscode('')
    setName('')
    setError('')
    setIsOpen(false)
  }

  if (isAdmin) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-green-50 border-green-200 hover:bg-green-100 text-green-700 shadow-sm"
            >
              <Shield className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Admin</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="end">
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Shield className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-700">Admin Mode</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">{adminName}</span>
              </div>
              
              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                ✅ Score editing enabled
              </div>
              
              <Button 
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="w-full text-red-600 border-red-200 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    )
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-600 shadow-sm"
          >
            <Settings className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Admin</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="end">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Settings className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-700">Admin Login</span>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="admin-name" className="text-sm">Your Name</Label>
                <Input
                  id="admin-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="h-8 text-sm"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="admin-passcode" className="text-sm">Passcode</Label>
                <Input
                  id="admin-passcode"
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter passcode"
                  className="h-8 text-sm"
                />
              </div>

              {error && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-8 text-sm"
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
            
            <div className="text-xs text-gray-500 text-center pt-2 border-t">
              Contact tournament organizer for access
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
} 