"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit2, Users, Wifi, Plus, Crown } from "lucide-react"
import type { Team } from "@/types/tournament"
import { useAdmin } from "@/hooks/use-admin"

interface TeamRegistrationProps {
  teams: Team[]
  addTeam: (team: Omit<Team, "id">) => Promise<void>
  updateTeam: (teamId: number, updates: Partial<Team>) => Promise<void>
  deleteTeam: (teamId: number) => Promise<void>
  onStartTournament: () => Promise<void>
}

export default function TeamRegistration({
  teams,
  addTeam,
  updateTeam,
  deleteTeam,
  onStartTournament,
}: TeamRegistrationProps) {
  const { isAdmin } = useAdmin()
  const [teamName, setTeamName] = useState("")
  const [player1, setPlayer1] = useState("")
  const [player2, setPlayer2] = useState("")
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddTeam = async () => {
    console.log("🎯 ADD TEAM DEBUG:", {
      teamName: teamName.trim(),
      player1: player1.trim(),
      player2: player2.trim(),
      isSubmitting
    })
    
    if (!teamName.trim() || !player1.trim() || !player2.trim() || isSubmitting) {
      console.log("❌ VALIDATION FAILED - missing fields or already submitting")
      return
    }

    console.log("✅ VALIDATION PASSED - attempting to add team")
    setIsSubmitting(true)
    try {
      const newTeam: Omit<Team, "id"> = {
        name: teamName.trim(),
        players: [player1.trim(), player2.trim()],
        paid: false,
        wins: 0,
        losses: 0,
        pointsFor: 0,
        pointsAgainst: 0,
      }

      console.log("🚀 CALLING addTeam with:", newTeam)
      await addTeam(newTeam)
      console.log("✅ ADD TEAM SUCCESS!")
      resetForm()
    } catch (error) {
      console.error("❌ ADD TEAM ERROR:", error)
      alert("Failed to add team. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateTeam = async () => {
    if (!editingTeam || !teamName.trim() || !player1.trim() || !player2.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await updateTeam(editingTeam.id, {
        name: teamName.trim(),
        players: [player1.trim(), player2.trim()],
      })
      resetForm()
    } catch (error) {
      console.error("Error updating team:", error)
      alert("Failed to update team. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTeam = async (teamId: number) => {
    console.log("🎯 DELETE TEAM DEBUG:", { teamId })
    
    if (!confirm("Are you sure you want to delete this team?")) {
      console.log("❌ DELETE CANCELLED by user")
      return
    }

    console.log("✅ DELETE CONFIRMED - attempting to delete team")
    try {
      console.log("🚀 CALLING deleteTeam with ID:", teamId)
      await deleteTeam(teamId)
      console.log("✅ DELETE TEAM SUCCESS!")
    } catch (error) {
      console.error("❌ DELETE TEAM ERROR:", error)
      alert("Failed to delete team. Please try again.")
    }
  }

  const handleTogglePayment = async (team: Team) => {
    try {
      await updateTeam(team.id, { paid: !team.paid })
    } catch (error) {
      console.error("Error updating payment status:", error)
      alert("Failed to update payment status. Please try again.")
    }
  }

  const editTeam = (team: Team) => {
    setEditingTeam(team)
    setTeamName(team.name)
    setPlayer1(team.players[0])
    setPlayer2(team.players[1])
  }

  const resetForm = () => {
    setTeamName("")
    setPlayer1("")
    setPlayer2("")
    setEditingTeam(null)
  }

  const canStartTournament = teams.length >= 4 && teams.length <= 16
  const paidTeams = teams.filter(team => team.paid)
  const unpaidTeams = teams.filter(team => !team.paid)

  const generateRandomTeams = async (numTeams: number) => {
    const teamNames = [
      "Thunder Bolts",
      "Fire Dragons",
      "Ice Wolves",
      "Storm Eagles",
      "Lightning Hawks",
      "Blazing Tigers",
      "Frost Bears",
      "Wind Runners",
      "Solar Flares",
      "Ocean Waves",
      "Mountain Lions",
      "Desert Foxes",
      "Sky Warriors",
      "Earth Shakers",
      "Star Crushers",
      "Moon Walkers",
    ]

    const playerNames = [
      "Alex",
      "Jordan",
      "Casey",
      "Taylor",
      "Morgan",
      "Riley",
      "Avery",
      "Quinn",
      "Blake",
      "Cameron",
      "Drew",
      "Emery",
      "Finley",
      "Harper",
      "Hayden",
      "Jamie",
      "Kendall",
      "Logan",
      "Parker",
      "Peyton",
      "Reese",
      "Sage",
      "Skylar",
      "Tanner",
      "River",
      "Phoenix",
      "Sage",
      "Dakota",
      "Rowan",
      "Indigo",
      "Kai",
      "Nova",
    ]

    if (!confirm(`Generate ${numTeams} random teams? This will replace all existing teams.`)) {
      return
    }

    setIsSubmitting(true)
    try {
      console.log("🔄 Generating random teams...")

      // Clear existing teams first (only if there are any)
      if (teams.length > 0) {
        console.log(`🗑️ Clearing ${teams.length} existing teams...`)
        const deletePromises = teams.map((team) => deleteTeam(team.id))
        await Promise.all(deletePromises)
        console.log("✅ Cleared existing teams")

        // Wait a moment for the database to update
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      // Add new random teams
      console.log(`➕ Adding ${numTeams} new teams...`)
      const shuffledTeamNames = [...teamNames].sort(() => Math.random() - 0.5)
      const shuffledPlayerNames = [...playerNames].sort(() => Math.random() - 0.5)

      for (let i = 0; i < numTeams; i++) {
        const newTeam: Omit<Team, "id"> = {
          name:
            shuffledTeamNames[i % shuffledTeamNames.length] +
            (i >= shuffledTeamNames.length ? ` ${Math.floor(i / shuffledTeamNames.length) + 1}` : ""),
          players: [
            shuffledPlayerNames[(i * 2) % shuffledPlayerNames.length],
            shuffledPlayerNames[(i * 2 + 1) % shuffledPlayerNames.length],
          ],
          paid: Math.random() > 0.3, // 70% chance of being paid
          wins: 0,
          losses: 0,
          pointsFor: 0,
          pointsAgainst: 0,
        }

        await addTeam(newTeam)
        console.log(`✅ Added team ${i + 1}/${numTeams}: ${newTeam.name}`)
      }

      console.log(`🎉 Successfully generated ${numTeams} random teams`)
    } catch (error) {
      console.error("❌ Error generating random teams:", error)
      alert(`Failed to generate random teams: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Add Team Form */}
      <Card className="tournament-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-slate-900 outdoor-text-large">
            <div className="p-2 usa-button-gradient rounded-xl text-white">
              <Plus className="w-6 h-6" />
            </div>
            {editingTeam ? "Edit Team" : "Add New Team"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="teamName" className="outdoor-text text-slate-900 font-semibold">
                Team Name
              </Label>
              <Input
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter team name"
                className="touch-target mt-2 text-lg"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="player1" className="outdoor-text text-slate-900 font-semibold">
                Player 1
              </Label>
              <Input
                id="player1"
                value={player1}
                onChange={(e) => setPlayer1(e.target.value)}
                placeholder="Player 1 name"
                className="touch-target mt-2 text-lg"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="player2" className="outdoor-text text-slate-900 font-semibold">
                Player 2
              </Label>
              <Input
                id="player2"
                value={player2}
                onChange={(e) => setPlayer2(e.target.value)}
                placeholder="Player 2 name"
                className="touch-target mt-2 text-lg"
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={editingTeam ? handleUpdateTeam : handleAddTeam}
              disabled={!teamName.trim() || !player1.trim() || !player2.trim() || isSubmitting}
              className="usa-button-gradient touch-target font-bold outdoor-text flex-1"
            >
              {isSubmitting ? "Saving..." : editingTeam ? "Update Team" : "Add Team"}
            </Button>
            {editingTeam && (
              <Button
                variant="outline"
                onClick={resetForm}
                disabled={isSubmitting}
                className="touch-target outdoor-text border-slate-300 text-slate-700 hover:bg-slate-50 flex-1"
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Testing Section */}
      <Card className="tournament-card">
        <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-slate-900 outdoor-text-large">
              <div className="p-2 bg-blue-500 rounded-xl text-white">
                <Users className="w-6 h-6" />
              </div>
              Testing Tools
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Button
              onClick={() => generateRandomTeams(4)}
              variant="outline"
              disabled={isSubmitting}
              className="touch-target outdoor-text border-slate-300 text-slate-700 hover:bg-slate-100 font-medium"
            >
              4 Teams
            </Button>
            <Button
              onClick={() => generateRandomTeams(6)}
              variant="outline"
              disabled={isSubmitting}
              className="touch-target outdoor-text border-slate-300 text-slate-700 hover:bg-slate-100 font-medium"
            >
              6 Teams
            </Button>
            <Button
              onClick={() => generateRandomTeams(8)}
              variant="outline"
              disabled={isSubmitting}
              className="touch-target outdoor-text border-slate-300 text-slate-700 hover:bg-slate-100 font-medium"
            >
              8 Teams
            </Button>
            <Button
              onClick={() => generateRandomTeams(9)}
              variant="outline"
              disabled={isSubmitting}
              className="touch-target outdoor-text border-blue-400 text-blue-700 hover:bg-blue-100 font-bold"
            >
              9 Teams 👋
            </Button>
            <Button
              onClick={() => generateRandomTeams(12)}
              variant="outline"
              disabled={isSubmitting}
              className="touch-target outdoor-text border-slate-300 text-slate-700 hover:bg-slate-100 font-medium"
            >
              12 Teams
            </Button>
          </div>
          <p className="outdoor-text text-slate-600 text-center font-medium">
            {isSubmitting ? "Generating teams..." : "Generate random teams with fake names for testing"}
          </p>
        </CardContent>
      </Card>

      {/* Teams List */}
      {teams.length > 0 && (
        <Card className="tournament-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-slate-900 outdoor-text-large">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-xl text-white">
                  <Users className="w-6 h-6" />
                </div>
                Registered Teams ({teams.length})
              </div>
              <div className="flex gap-2">
                <Badge className="bg-green-100 text-green-800 px-3 py-1">
                  {paidTeams.length} paid
                </Badge>
                {unpaidTeams.length > 0 && (
                                  <Badge className="bg-orange-100 text-orange-800 px-3 py-1">
                  {unpaidTeams.length} unpaid
                </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teams.map((team) => (
                <div key={team.id} className={`team-card ${team.paid ? 'paid' : 'unpaid'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="outdoor-text-large font-bold text-slate-900 truncate">{team.name}</h3>
                      <p className="outdoor-text text-slate-600 break-words">{team.players.join(" & ")}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => editTeam(team)}
                        disabled={isSubmitting}
                        className="touch-target border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        <Edit2 className="w-5 h-5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteTeam(team.id)}
                        disabled={isSubmitting}
                        className="touch-target border-red-300 text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`payment-${team.id}`}
                          checked={team.paid}
                          onCheckedChange={() => handleTogglePayment(team)}
                          disabled={isSubmitting}
                          className="w-6 h-6"
                        />
                        <Label htmlFor={`payment-${team.id}`} className="outdoor-text text-slate-900 font-semibold">
                          Paid $40
                        </Label>
                      </div>
                    </div>
                    <Badge
                      className={`outdoor-text px-4 py-2 font-bold ${
                        team.paid 
                          ? "bg-green-500 text-white" 
                          : "bg-orange-500 text-white"
                      }`}
                    >
                      {team.paid ? "✅ Paid" : "⏳ Unpaid"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tournament Start - Admin Only */}
      {isAdmin && teams.length > 0 && (
        <Card className="tournament-card bg-gradient-to-r from-blue-50/20 to-red-50/20 border-red-200/50">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="space-y-2">
                {!canStartTournament && (
                  <div className="p-3 bg-orange-100 rounded-lg border border-orange-200">
                    <p className="text-sm sm:text-base text-orange-800 font-bold">
                      {teams.length < 4
                        ? `Need at least 4 teams to start tournament (currently ${teams.length})`
                        : `Maximum 16 teams allowed (currently ${teams.length})`}
                    </p>
                  </div>
                )}
                
                {canStartTournament && (
                  <div className="p-3 bg-green-100 rounded-lg border border-green-200">
                    <p className="text-sm sm:text-base text-green-800 font-bold">
                      🎉 Ready to start tournament with {teams.length} teams!
                    </p>
                  </div>
                )}
              </div>
              
              <Button
                onClick={async () => {
                  try {
                    await onStartTournament()
                  } catch (error) {
                    console.error("Error starting tournament:", error)
                    alert("Failed to start tournament. Please try again.")
                  }
                }}
                disabled={!canStartTournament || isSubmitting}
                size="lg"
                className="usa-button-gradient w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-12 py-3 sm:py-4 font-bold text-base sm:text-lg"
              >
                {isSubmitting ? "Starting..." : (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Crown className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="truncate">Start Tournament ({teams.length})</span>
                  </div>
                )}
              </Button>
              
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Set games per team in the next step
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
