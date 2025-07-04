'use client'

import { useState } from 'react'
import { useAdmin } from '@/hooks/use-admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function AdminLogin() {
  const { isAdmin, adminName, loginAsAdmin, logoutAdmin } = useAdmin()
  const [passcode, setPasscode] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!passcode.trim()) {
      setError('Please enter an admin passcode')
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
      setError('Invalid admin passcode')
      setPasscode('')
    } else {
      setPasscode('')
      setName('')
    }
    setIsLoading(false)
  }

  const handleLogout = () => {
    logoutAdmin()
    setPasscode('')
    setName('')
    setError('')
  }

  if (isAdmin) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-green-600">🔐</span>
            Admin Mode
          </CardTitle>
          <CardDescription>
            You are logged in as an admin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                {adminName}
              </Badge>
            </div>
            <Button 
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              Logout
            </Button>
          </div>
          
          <Alert>
            <AlertDescription className="text-sm">
              ✅ You can now edit scores and manage the tournament
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <span className="text-yellow-600">🔒</span>
          Admin Login
        </CardTitle>
        <CardDescription>
          Enter admin passcode to edit scores
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-name">Your Name</Label>
            <Input
              id="admin-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="border-gray-300"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="admin-passcode">Admin Passcode</Label>
            <Input
              id="admin-passcode"
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter admin passcode"
              className="border-gray-300"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login as Admin'}
          </Button>
        </form>
        
        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>Contact tournament organizer for admin access</p>
        </div>
      </CardContent>
    </Card>
  )
} 