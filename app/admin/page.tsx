"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, LogOut, ArrowLeft, User, Trophy, Users, Clock } from "lucide-react"
import { useAdmin } from "@/hooks/use-admin"
import { useRouter } from "next/navigation"
import { useTournamentData } from "@/hooks/use-tournament-data"
import AdminTournamentManagement from "@/components/admin-tournament-management"
import AdminPendingRegistrations from "@/components/admin-pending-registrations"

export default function AdminPage() {
  const [adminPasscode, setAdminPasscode] = useState('')
  const [adminName, setAdminName] = useState('')
  const [adminError, setAdminError] = useState('')
  const router = useRouter()
  
  const { isAdmin, adminName: currentAdminName, loginAsAdmin, logoutAdmin } = useAdmin()
  const { 
    tournaments, 
    pendingRegistrations, 
    loadTournaments, 
    loadPendingRegistrations 
  } = useTournamentData()

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
    }
  }

  const handleAdminLogout = () => {
    logoutAdmin()
    router.push('/')
  }

  const handleDataUpdated = async () => {
    await Promise.all([loadTournaments(), loadPendingRegistrations()])
  }

  const pendingCount = pendingRegistrations.filter(r => r.status === 'pending').length

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
                <h1 className="text-xl font-black text-white">
                  {isAdmin ? "Admin Dashboard" : "Admin Login"}
                </h1>
              </div>
              
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAdminLogout}
                  className="text-white hover:bg-white/10 outdoor-text"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 pb-24">
        {isAdmin ? (
          <div className="max-w-6xl mx-auto mt-8">
            {/* Admin Header */}
            <div className="mb-8">
              <Card className="tournament-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500 rounded-xl text-white">
                        <Shield className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">Admin Dashboard</h2>
                        <p className="text-slate-600">Logged in as <strong>{currentAdminName}</strong></p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{tournaments.length}</div>
                        <div className="text-sm text-slate-600">Tournaments</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
                        <div className="text-sm text-slate-600">Pending</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Admin Tabs */}
            <Tabs defaultValue="tournaments" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 h-14">
                <TabsTrigger value="tournaments" className="outdoor-text flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Tournament Management
                </TabsTrigger>
                <TabsTrigger value="registrations" className="outdoor-text flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Pending Registrations
                  {pendingCount > 0 && (
                    <span className="ml-2 bg-yellow-500 text-white text-xs rounded-full px-2 py-0.5">
                      {pendingCount}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tournaments" className="space-y-6">
                <AdminTournamentManagement
                  tournaments={tournaments}
                  onTournamentCreated={handleDataUpdated}
                  onTournamentUpdated={handleDataUpdated}
                  onTournamentDeleted={handleDataUpdated}
                />
              </TabsContent>

              <TabsContent value="registrations" className="space-y-6">
                <AdminPendingRegistrations
                  pendingRegistrations={pendingRegistrations}
                  tournaments={tournaments}
                  onRegistrationUpdated={handleDataUpdated}
                />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="max-w-md mx-auto mt-8">
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
                    Admin access allows you to manage tournaments, approve team registrations, and control tournament flow.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
} 