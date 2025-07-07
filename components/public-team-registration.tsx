"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Users, Calendar, AlertCircle } from "lucide-react"
import type { Tournament, PendingRegistration } from "@/types/tournament"
import { supabase } from "@/lib/supabase"

interface PublicTeamRegistrationProps {
  tournaments: Tournament[]
  onRegistrationSubmitted?: () => void
}

export default function PublicTeamRegistration({
  tournaments,
  onRegistrationSubmitted,
}: PublicTeamRegistrationProps) {
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>("")
  const [teamName, setTeamName] = useState("")
  const [player1, setPlayer1] = useState("")
  const [player2, setPlayer2] = useState("")
  const [contactInfo, setContactInfo] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  // Auto-select active tournament if there's only one active
  useEffect(() => {
    const activeTournaments = tournaments.filter(t => t.status === 'active' || t.status === 'upcoming')
    if (activeTournaments.length === 1) {
      setSelectedTournamentId(activeTournaments[0].id.toString())
    }
  }, [tournaments])

  const availableTournaments = tournaments.filter(
    t => t.status === 'active' || t.status === 'upcoming'
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (!selectedTournamentId) {
      setError("Please select a tournament")
      return
    }
    if (!teamName.trim()) {
      setError("Please enter a team name")
      return
    }
    if (!player1.trim()) {
      setError("Please enter the first player's name")
      return
    }
    if (!player2.trim()) {
      setError("Please enter the second player's name")
      return
    }

    setIsSubmitting(true)

    try {
      const { error: submitError } = await supabase
        .from("pending_team_registrations")
        .insert({
          tournament_id: parseInt(selectedTournamentId),
          team_name: teamName.trim(),
          players: [player1.trim(), player2.trim()],
          contact_info: contactInfo.trim() || null,
          status: 'pending'
        })

      if (submitError) {
        throw submitError
      }

      // Reset form and show success
      setTeamName("")
      setPlayer1("")
      setPlayer2("")
      setContactInfo("")
      setSelectedTournamentId("")
      setSubmitted(true)
      
      // Call callback if provided
      if (onRegistrationSubmitted) {
        onRegistrationSubmitted()
      }

      // Hide success message after 5 seconds
      setTimeout(() => setSubmitted(false), 5000)

    } catch (error) {
      console.error("Error submitting registration:", error)
      setError(error instanceof Error ? error.message : "Failed to submit registration")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setTeamName("")
    setPlayer1("")
    setPlayer2("")
    setContactInfo("")
    setSelectedTournamentId("")
    setError("")
    setSubmitted(false)
  }

  const selectedTournament = availableTournaments.find(
    t => t.id.toString() === selectedTournamentId
  )

  if (availableTournaments.length === 0) {
    return (
      <Card className="tournament-card">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Open Tournaments</h3>
            <p className="text-slate-600">
              There are currently no tournaments accepting registrations. Check back later!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (submitted) {
    return (
      <Card className="tournament-card">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h3 className="text-xl font-bold text-green-700 mb-2">Registration Submitted!</h3>
            <p className="text-slate-600 mb-4">
              Your team registration has been submitted successfully. An admin will review your registration and you'll be notified once it's approved.
            </p>
            <Button 
              onClick={resetForm}
              variant="outline"
              className="outdoor-text"
            >
              Submit Another Team
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="tournament-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-slate-900">
          <div className="p-2 bg-blue-500 rounded-xl text-white">
            <Users className="w-6 h-6" />
          </div>
          Team Registration
        </CardTitle>
        <p className="text-slate-600 outdoor-text">
          Register your team for an upcoming tournament. Your registration will be reviewed by an admin before approval.
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tournament Selection */}
          <div>
            <Label htmlFor="tournament" className="outdoor-text font-medium">
              Tournament *
            </Label>
            <Select value={selectedTournamentId} onValueChange={setSelectedTournamentId}>
              <SelectTrigger className="mt-1 h-14 outdoor-text">
                <SelectValue placeholder="Select a tournament" />
              </SelectTrigger>
              <SelectContent>
                {availableTournaments.map((tournament) => (
                  <SelectItem key={tournament.id} value={tournament.id.toString()}>
                    <div className="flex flex-col">
                      <span className="font-medium">{tournament.name}</span>
                      <span className="text-sm text-slate-500">
                        {new Date(tournament.date).toLocaleDateString()}
                        {tournament.status === 'active' && ' • Currently Active'}
                        {tournament.status === 'upcoming' && ' • Upcoming'}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Tournament Info */}
          {selectedTournament && (
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                <strong>{selectedTournament.name}</strong> - {new Date(selectedTournament.date).toLocaleDateString()}
                <br />
                Current phase: {selectedTournament.currentPhase.replace('-', ' ')}
              </AlertDescription>
            </Alert>
          )}

          {/* Team Name */}
          <div>
            <Label htmlFor="team-name" className="outdoor-text font-medium">
              Team Name *
            </Label>
            <Input
              id="team-name"
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter your team name"
              className="mt-1 h-14 outdoor-text"
              maxLength={50}
            />
          </div>

          {/* Player 1 */}
          <div>
            <Label htmlFor="player1" className="outdoor-text font-medium">
              Player 1 Name *
            </Label>
            <Input
              id="player1"
              type="text"
              value={player1}
              onChange={(e) => setPlayer1(e.target.value)}
              placeholder="Enter first player's name"
              className="mt-1 h-14 outdoor-text"
              maxLength={50}
            />
          </div>

          {/* Player 2 */}
          <div>
            <Label htmlFor="player2" className="outdoor-text font-medium">
              Player 2 Name *
            </Label>
            <Input
              id="player2"
              type="text"
              value={player2}
              onChange={(e) => setPlayer2(e.target.value)}
              placeholder="Enter second player's name"
              className="mt-1 h-14 outdoor-text"
              maxLength={50}
            />
          </div>

          {/* Contact Information */}
          <div>
            <Label htmlFor="contact-info" className="outdoor-text font-medium">
              Contact Information
              <span className="text-slate-500 font-normal ml-1">(optional)</span>
            </Label>
            <Textarea
              id="contact-info"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder="Email, phone number, or other contact details"
              className="mt-1 outdoor-text resize-none"
              rows={3}
              maxLength={200}
            />
            <p className="text-sm text-slate-500 mt-1">
              Provide contact info if you'd like updates on your registration status
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full h-14 outdoor-text-large bg-blue-600 hover:bg-blue-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>Submitting...</>
            ) : (
              <>
                <Users className="w-5 h-5 mr-2" />
                Submit Team Registration
              </>
            )}
          </Button>

          <p className="text-sm text-slate-500 text-center">
            * Required fields. Your registration will be reviewed by an admin.
          </p>
        </form>
      </CardContent>
    </Card>
  )
} 