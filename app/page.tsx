"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { 
  Users, 
  Trophy, 
  DollarSign, 
  Play, 
  Wifi, 
  WifiOff, 
  AlertCircle, 
  Radio,
  Home,
  Settings,
  BarChart3,
  Flag,
  Menu,
  X,
      Shield,
    LogOut
} from "lucide-react"
import TeamRegistration from "@/components/team-registration"
import PoolPlay from "@/components/pool-play"
import KnockoutBracket from "@/components/knockout-bracket"
import NCAABracket from "@/components/ncaa-bracket"
import { useTournamentData } from "@/hooks/use-tournament-data"
import { useAdmin } from "@/hooks/use-admin"

export default function TournamentApp() {
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  
  const {
    teams,
    poolPlayMatches,
    knockoutMatches,
    currentPhase,
    byeTeam,
    loading,
    connectionStatus,
    realtimeConnected,
    isPolling,
    addTeam,
    updateTeam,
    deleteTeam,
    updateMatch,
    createMatches,
    updateTournamentPhase,
    setByeTeamId,
    resetTournament,
  } = useTournamentData()

  const { isAdmin, adminName: currentAdminName, logoutAdmin } = useAdmin()

  const handleAdminLogout = () => {
    logoutAdmin()
    setShowMobileMenu(false)
  }

  const totalRevenue = teams.filter((team) => team.paid).length * 40
  const paidTeams = teams.filter((team) => team.paid).length

  const renderPhaseContent = () => {
    switch (currentPhase) {
      case "registration":
        return (
          <TeamRegistration
            teams={teams}
            addTeam={addTeam}
            updateTeam={updateTeam}
            deleteTeam={deleteTeam}
            onStartTournament={async () => await updateTournamentPhase("pool-play")}
          />
        )
      case "pool-play":
        return (
          <PoolPlay
            teams={teams}
            matches={poolPlayMatches}
            updateMatch={updateMatch}
            createMatches={createMatches}
            onAdvanceToKnockout={() => updateTournamentPhase("knockout")}
            setByeTeamId={setByeTeamId}
          />
        )
      case "knockout":
        return (
          <KnockoutBracket
            matches={knockoutMatches}
            poolPlayMatches={poolPlayMatches}
            updateMatch={updateMatch}
            createMatches={createMatches}
            byeTeam={byeTeam}
            allTeams={teams}
          />
        )
      default:
        return null
    }
  }

  const getPhaseTitle = () => {
    switch (currentPhase) {
      case "registration":
        return "Team Registration"
      case "pool-play":
        return "Pool Play"
      case "knockout":
        return "Knockout Bracket"
      default:
        return "Tournament"
    }
  }

  const getPhaseIcon = () => {
    switch (currentPhase) {
      case "registration":
        return <Users className="w-6 h-6" />
      case "pool-play":
        return <Play className="w-6 h-6" />
      case "knockout":
        return <Trophy className="w-6 h-6" />
      default:
        return <Flag className="w-6 h-6" />
    }
  }

  const getConnectionStatus = () => {
    const baseClasses = "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 border-2 shadow-lg"
    
    switch (connectionStatus) {
      case "connected":
        return (
          <div className={`${baseClasses} bg-green-400 text-white border-white animate-pulse`}>
            <Radio className="w-3 h-3" />
            <span>LIVE</span>
          </div>
        )
      case "error":
        return (
          <div className={`${baseClasses} bg-red-500 text-white border-white`}>
            <WifiOff className="w-3 h-3" />
            <span>OFFLINE</span>
          </div>
        )
      default:
        return (
          <div className={`${baseClasses} bg-blue-400 text-white border-white animate-pulse`}>
            <AlertCircle className="w-3 h-3" />
            <span>CONNECTING</span>
          </div>
        )
    }
  }

  const navigationItems = [
    { 
      id: "registration", 
      label: "Teams", 
      icon: Users,
      disabled: false,
      badge: teams.length > 0 ? teams.length : null
    },
    { 
      id: "pool-play", 
      label: "Pool Play", 
      icon: Play,
      disabled: teams.length < 4,
      badge: poolPlayMatches.length > 0 ? poolPlayMatches.length : null
    },
    { 
      id: "knockout", 
      label: "Knockout", 
      icon: Trophy,
      disabled: poolPlayMatches.length === 0,
      badge: knockoutMatches.length > 0 ? knockoutMatches.length : null
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <div className="text-8xl animate-spin">⚽</div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white">Loading Tournament</h2>
            <p className="text-xl text-slate-300">Connecting to live data...</p>
          </div>
          <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="w-full h-full bg-red-500 animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Redesigned Header - Better Layout */}
      <header className="sticky-header usa-header-gradient">
        <div className="safe-area-top">
          <div className="px-4 py-4">
            {/* Top Row - Connection Status and Menu */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getConnectionStatus()}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="touch-target p-3 text-white hover:bg-white/20 rounded-xl"
              >
                {showMobileMenu ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </Button>
            </div>
            
            {/* Main Title Section */}
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-2xl">🇺🇸</span>
                <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  4th of July Invitational
                </h1>
                <span className="text-2xl">🇺🇸</span>
              </div>
              <p className="text-sm sm:text-base font-semibold text-white/90">
                16th Annual • Harbor Way Soccer Tennis
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)}>
          <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-xl p-6 safe-area-top">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-slate-900">Menu</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowMobileMenu(false)}>
                <X className="w-6 h-6" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <Button
                onClick={() => window.open("/standings", "_blank")}
                variant="outline"
                className="w-full justify-start h-14 outdoor-text"
              >
                <BarChart3 className="w-5 h-5 mr-3" />
                Standings
              </Button>
              
              <Button
                onClick={() => window.open("/rules", "_blank")}
                variant="outline"
                className="w-full justify-start h-14 outdoor-text"
              >
                <Flag className="w-5 h-5 mr-3" />
                Rules
              </Button>
              
              {isAdmin ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <Shield className="w-5 h-5 text-green-600" />
                    <div className="flex-1">
                      <p className="font-medium text-green-900">Admin Mode</p>
                      <p className="text-sm text-green-700">{currentAdminName}</p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleAdminLogout}
                    variant="outline"
                    className="w-full justify-start h-14 outdoor-text border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    Logout Admin
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => {
                    setShowMobileMenu(false)
                    window.open("/admin", "_blank")
                  }}
                  variant="outline"
                  className="w-full justify-start h-14 outdoor-text"
                >
                  <Shield className="w-5 h-5 mr-3" />
                  Admin Login
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={resetTournament}
                className="w-full justify-start h-14 outdoor-text border-red-300 text-red-700 hover:bg-red-50"
              >
                <Settings className="w-5 h-5 mr-3" />
                Reset Tournament
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tournament Stats Dashboard */}
      <div className="px-4 py-6 pb-24 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="tournament-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="outdoor-text text-slate-600 font-medium">Teams</p>
                  <p className="text-4xl font-black text-slate-900">{teams.length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-2xl">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="tournament-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="outdoor-text text-slate-600 font-medium">Revenue</p>
                  <p className="text-4xl font-black text-slate-900">${totalRevenue}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-2xl">
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="tournament-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="outdoor-text text-slate-600 font-medium">Paid</p>
                  <p className="text-4xl font-black text-slate-900">
                    {paidTeams}<span className="text-xl text-slate-500">/{teams.length}</span>
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-2xl">
                  <Trophy className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="tournament-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="outdoor-text text-slate-600 font-medium">Phase</p>
                  <Badge className="usa-button-gradient text-white border-0 mt-2 px-3 py-1">
                    {currentPhase.replace("-", " ").toUpperCase()}
                  </Badge>
                </div>
                <div className="p-3 bg-purple-100 rounded-2xl">
                  {getPhaseIcon()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Phase Display */}
        <Card className="tournament-card">
          <CardHeader className="border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 usa-button-gradient rounded-xl text-white">
                  {getPhaseIcon()}
                </div>
                <div>
                  <CardTitle className="text-2xl font-black text-slate-900">
                    {getPhaseTitle()}
                  </CardTitle>
                  <CardDescription className="outdoor-text text-slate-600">
                    {currentPhase === "registration" && "Add teams and manage registrations"}
                    {currentPhase === "pool-play" && "All teams play each other in round-robin"}
                    {currentPhase === "knockout" && "Single elimination tournament bracket"}
                  </CardDescription>
                </div>
              </div>
              
              {connectionStatus === "connected" && realtimeConnected && (
                <div className="status-live">
                  <Radio className="w-4 h-4 inline mr-1" />
                  LIVE
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {renderPhaseContent()}
          </CardContent>
        </Card>
      </div>

      {/* Redesigned Bottom Navigation - Patriotic Theme */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
        {/* Patriotic gradient background matching header */}
        <div className="usa-header-gradient border-t-2 border-white/20">
          <div className="flex px-2 py-3">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = currentPhase === item.id
              
              return (
                <button
                  key={item.id}
                  onClick={() => !item.disabled && updateTournamentPhase(item.id as any)}
                  disabled={item.disabled}
                  className={`
                    flex-1 flex flex-col items-center justify-center
                    touch-target relative transition-all duration-200
                    ${isActive 
                      ? 'text-white transform scale-110' 
                      : 'text-white/80 hover:text-white'
                    }
                    ${item.disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/10 rounded-xl'}
                  `}
                >
                  <div className="relative">
                    <Icon className={`w-6 h-6 mb-1 ${isActive ? 'animate-pulse' : ''}`} />
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 bg-yellow-400 text-slate-900 text-xs rounded-full w-5 h-5 flex items-center justify-center font-black border-2 border-white shadow-lg">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-xs font-bold ${isActive ? 'text-yellow-300' : ''}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-yellow-300 rounded-full animate-pulse" />
                  )}
                </button>
              )
            })}
            
            {/* Special Menu Item - Matching Design */}
            <button
              onClick={() => setShowMobileMenu(true)}
              className="flex-1 flex flex-col items-center justify-center touch-target text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
            >
              <Menu className="w-6 h-6 mb-1" />
              <span className="text-xs font-bold">More</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  )
}

