"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Trophy, DollarSign, Play, Wifi, WifiOff, AlertCircle } from "lucide-react"
import TeamRegistration from "@/components/team-registration"
import PoolPlay from "@/components/pool-play"
import KnockoutBracket from "@/components/knockout-bracket"
import NCAABracket from "@/components/ncaa-bracket"
import { useTournamentData } from "@/hooks/use-tournament-data"

export default function TournamentApp() {
  const {
    teams,
    poolPlayMatches,
    knockoutMatches,
    currentPhase,
    byeTeam,
    loading,
    connectionStatus,
    addTeam,
    updateTeam,
    deleteTeam,
    updateMatch,
    createMatches,
    updateTournamentPhase,
    setByeTeamId,
    resetTournament,
  } = useTournamentData()

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

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case "connected":
        return <Wifi className="w-6 h-6 text-green-600" />
      case "error":
        return <WifiOff className="w-6 h-6 text-red-600" />
      default:
        return <AlertCircle className="w-6 h-6 text-yellow-600" />
    }
  }

  const getConnectionText = () => {
    switch (connectionStatus) {
      case "connected":
        return "🔴 LIVE Tournament - Everyone Can Participate!"
      case "error":
        return "❌ Database Connection Error - Check Console"
      default:
        return "🔄 Connecting to Database..."
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-spin">⚽</div>
          <h2 className="text-2xl font-bold text-gray-900">Loading Tournament...</h2>
          <p className="text-gray-600">Connecting to live data</p>
          <div className="text-sm text-blue-600">Check browser console for connection details</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-red-600">
            4th of July Invitational
          </h1>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-white" style={{ textShadow: '2px 2px 0px #000000, -2px -2px 0px #000000, 2px -2px 0px #000000, -2px 2px 0px #000000' }}>
            16th Annual
          </h2>
          <p className="text-blue-600 font-medium text-lg">Harbor Way Soccer Tennis Tournament</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Users className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Teams</p>
                  <p className="text-2xl font-bold text-gray-900">{teams.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${totalRevenue}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Trophy className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Paid</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {paidTeams}/{teams.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Play className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Phase</p>
                  <Badge variant="outline" className="text-xs border-gray-300 text-gray-700 mt-1">
                    {currentPhase.replace("-", " ").toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>



        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex flex-wrap gap-2 flex-1">
            <Button
              onClick={() => updateTournamentPhase("registration")}
              className={`flex-1 sm:flex-none h-11 transition-all duration-200 ${
                currentPhase === "registration"
                  ? "nav-flag-active"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
              }`}
              variant={currentPhase === "registration" ? "default" : "outline"}
            >
              Registration
            </Button>
            <Button
              onClick={() => updateTournamentPhase("pool-play")}
              disabled={teams.length < 4}
              className={`flex-1 sm:flex-none h-11 transition-all duration-200 ${
                currentPhase === "pool-play"
                  ? "nav-flag-active"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
              }`}
              variant={currentPhase === "pool-play" ? "default" : "outline"}
            >
              Pool Play
            </Button>
            <Button
              onClick={() => updateTournamentPhase("knockout")}
              disabled={poolPlayMatches.length === 0}
              className={`flex-1 sm:flex-none h-11 transition-all duration-200 ${
                currentPhase === "knockout"
                  ? "nav-flag-active"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
              }`}
              variant={currentPhase === "knockout" ? "default" : "outline"}
            >
              Knockout
            </Button>
            <Button
              onClick={() => window.open("/standings", "_blank")}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 h-11 bg-transparent"
            >
              Standings
            </Button>
            <Button
              onClick={() => window.open("/rules", "_blank")}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 h-11 bg-transparent"
            >
              Rules
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={resetTournament}
            className="border-red-300 text-red-700 hover:bg-red-50 h-11 w-full sm:w-auto bg-transparent"
          >
            Reset Tournament
          </Button>
        </div>

        {/* Main Content */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-gray-900 text-xl font-semibold">{getPhaseTitle()}</CardTitle>
            <CardDescription className="text-gray-600">
              {currentPhase === "registration" && "Add teams and manage registrations"}
              {currentPhase === "pool-play" && "All teams play each other"}
              {currentPhase === "knockout" && "Single elimination bracket"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">{renderPhaseContent()}</CardContent>
        </Card>
      </div>
    </div>
  )
}
