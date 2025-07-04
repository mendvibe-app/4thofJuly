"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, LogOut, ArrowLeft, User } from "lucide-react"
import { useAdmin } from "@/hooks/use-admin"
import { useRouter } from "next/navigation"

export default function AdminLoginPage() {
  const [adminPasscode, setAdminPasscode] = useState('')
  const [adminName, setAdminName] = useState('')
  const [adminError, setAdminError] = useState('')
  const router = useRouter()
  
  const { isAdmin, adminName: currentAdminName, loginAsAdmin, logoutAdmin } = useAdmin()

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setAdminError('')

    if (!adminPasscode.trim()) {
      setAdminError('Please enter passcode')
      return
    }

    if (!adminName.trim()) {
      setAdminError('Please enter your name')
      return
    }

    const success = loginAsAdmin(adminPasscode, adminName)
    if (!success) {
      setAdminError('Invalid passcode')
      setAdminPasscode('')
    } else {
      router.push('/')
    }
  }

  const handleAdminLogout = () => {
    logoutAdmin()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="sticky-header usa-header-gradient">
        <div className="safe-area-top">
          <div className="px-4 py-6">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
                className="text-white hover:bg-white/10 outdoor-text"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Tournament
              </Button>
              
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-white" />
                <h1 className="text-xl font-black text-white">Admin Login</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 pb-24">
        <div className="max-w-md mx-auto mt-8">
          {isAdmin ? (
            <Card className="tournament-card">
              <CardHeader>
                <CardTitle className="text-center text-green-700">
                  <Shield className="w-8 h-8 mx-auto mb-2" />
                  Admin Mode Active
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <User className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Logged in as:</p>
                    <p className="text-lg font-bold text-green-700">{currentAdminName}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Button
                    onClick={() => router.push('/')}
                    className="w-full h-14 outdoor-text bg-blue-600 hover:bg-blue-700"
                  >
                    Go to Tournament
                  </Button>
                  
                  <Button
                    onClick={handleAdminLogout}
                    variant="outline"
                    className="w-full h-14 outdoor-text border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="w-5 h-5 mr-2" />
                    Logout Admin
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="tournament-card">
              <CardHeader>
                <CardTitle className="text-center text-slate-700">
                  <Shield className="w-8 h-8 mx-auto mb-2" />
                  Admin Login
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="admin-name" className="outdoor-text">Your Name</Label>
                    <Input
                      id="admin-name"
                      type="text"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="Enter your name"
                      className="mt-1 h-14 outdoor-text"
                      autoFocus
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="admin-passcode" className="outdoor-text">Passcode</Label>
                    <Input
                      id="admin-passcode"
                      type="password"
                      value={adminPasscode}
                      onChange={(e) => setAdminPasscode(e.target.value)}
                      placeholder="Enter passcode"
                      className="mt-1 h-14 outdoor-text"
                    />
                  </div>

                  {adminError && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                      {adminError}
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full h-14 outdoor-text bg-blue-600 hover:bg-blue-700"
                  >
                    <Shield className="w-5 h-5 mr-2" />
                    Login as Admin
                  </Button>
                </form>
                
                <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="font-medium text-slate-700 mb-2">Admin Access</h3>
                  <p className="text-sm text-slate-600">
                    Admin access allows you to manage tournament settings, edit team information, and control tournament flow.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
} 