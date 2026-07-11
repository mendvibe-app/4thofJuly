"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Users, Calendar, AlertCircle } from "lucide-react"
import type { Tournament } from "@/types/tournament"
import { supabase } from "@/lib/supabase"
import {
  MAX_TEAMS,
  formatSupabaseError,
  findDuplicateTeamName,
  normalizeName,
  validateTeamInput,
} from "@/lib/registration"

interface PublicTeamRegistrationProps {
  tournaments: Tournament[]
  primaryTournamentId?: number | null
  onRegistrationSubmitted?: () => void
}

export default function PublicTeamRegistration({
  tournaments,
  primaryTournamentId = null,
  onRegistrationSubmitted,
}: PublicTeamRegistrationProps) {
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>("")
  const [teamName, setTeamName] = useState("")
  const [player1, setPlayer1] = useState("")
  const [player2, setPlayer2] = useState("")
  const [contactInfo, setContactInfo] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedTeamName, setSubmittedTeamName] = useState("")
  const [error, setError] = useState("")

  const availableTournaments = useMemo(
    () =>
      tournaments.filter(
        (t) =>
          t.currentPhase === "registration" &&
          (t.status === "active" || t.status === "upcoming"),
      ),
    [tournaments],
  )

  // Prefer the primary tournament when it's open for registration
  useEffect(() => {
    if (availableTournaments.length === 0) {
      setSelectedTournamentId("")
      return
    }

    const primaryOpen = primaryTournamentId
      ? availableTournaments.find((t) => t.id === primaryTournamentId)
      : undefined

    if (primaryOpen) {
      setSelectedTournamentId(primaryOpen.id.toString())
      return
    }

    if (availableTournaments.length === 1) {
      setSelectedTournamentId(availableTournaments[0].id.toString())
    }
  }, [availableTournaments, primaryTournamentId])

  const selectedTournament = availableTournaments.find(
    (t) => t.id.toString() === selectedTournamentId,
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!selectedTournamentId) {
      setError("Please select a tournament")
      return
    }

    const validationError = validateTeamInput({ teamName, player1, player2 })
    if (validationError) {
      setError(validationError)
      return
    }

    const tournamentId = Number.parseInt(selectedTournamentId, 10)
    if (Number.isNaN(tournamentId)) {
      setError("Invalid tournament selection")
      return
    }

    setIsSubmitting(true)

    try {
      const [{ data: existingTeams, error: teamsError }, { data: pending, error: pendingError }] =
        await Promise.all([
          supabase
            .from("teams")
            .select("name")
            .eq("tournament_id", tournamentId),
          supabase
            .from("pending_team_registrations")
            .select("team_name, status")
            .eq("tournament_id", tournamentId)
            .eq("status", "pending"),
        ])

      if (teamsError) throw teamsError
      if (pendingError) throw pendingError

      const teamCount = existingTeams?.length ?? 0
      if (teamCount >= MAX_TEAMS) {
        setError(`This tournament is full (${MAX_TEAMS} teams max).`)
        return
      }

      const duplicate = findDuplicateTeamName(teamName, [
        ...(existingTeams ?? []).map((t) => t.name),
        ...(pending ?? []).map((p) => p.team_name),
      ])
      if (duplicate) {
        setError(
          `${duplicate}. If you already submitted, wait for admin review or pick a different name.`,
        )
        return
      }

      const cleanName = normalizeName(teamName)
      const cleanPlayers = [normalizeName(player1), normalizeName(player2)]

      const { error: submitError } = await supabase.from("pending_team_registrations").insert({
        tournament_id: tournamentId,
        team_name: cleanName,
        players: cleanPlayers,
        contact_info: normalizeName(contactInfo) || null,
        status: "pending",
      })

      if (submitError) throw submitError

      setSubmittedTeamName(cleanName)
      setTeamName("")
      setPlayer1("")
      setPlayer2("")
      setContactInfo("")
      setSubmitted(true)

      if (onRegistrationSubmitted) {
        await onRegistrationSubmitted()
      }
    } catch (submitErr) {
      console.error("Error submitting registration:", submitErr)
      setError(formatSupabaseError(submitErr, "Failed to submit registration"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setTeamName("")
    setPlayer1("")
    setPlayer2("")
    setContactInfo("")
    setError("")
    setSubmitted(false)
    setSubmittedTeamName("")
    if (availableTournaments.length === 1) {
      setSelectedTournamentId(availableTournaments[0].id.toString())
    } else if (primaryTournamentId) {
      const primaryOpen = availableTournaments.find((t) => t.id === primaryTournamentId)
      setSelectedTournamentId(primaryOpen ? primaryOpen.id.toString() : "")
    }
  }

  if (availableTournaments.length === 0) {
    return (
      <Card className="tournament-card">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Registration Closed</h3>
            <p className="text-slate-600">
              There are currently no tournaments accepting new team registrations.
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
              {submittedTeamName ? (
                <>
                  <strong>{submittedTeamName}</strong> is in the review queue. An admin will approve
                  or reject it before the team is added to the tournament.
                </>
              ) : (
                <>
                  Your team registration has been submitted. An admin will review it before approval.
                </>
              )}
            </p>
            <Button onClick={resetForm} variant="outline" className="outdoor-text">
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
          Register your team for an upcoming tournament. An admin must approve your registration
          before you appear on the roster. Entry is $40/team.
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="tournament" className="outdoor-text font-medium">
              Tournament *
            </Label>
            <Select
              value={selectedTournamentId}
              onValueChange={setSelectedTournamentId}
              disabled={availableTournaments.length === 1}
            >
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
                        {tournament.status === "active" && " • Currently Active"}
                        {tournament.status === "upcoming" && " • Upcoming"}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTournament && (
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                <strong>{selectedTournament.name}</strong> —{" "}
                {new Date(selectedTournament.date).toLocaleDateString()}
                <br />
                Open for registration
              </AlertDescription>
            </Alert>
          )}

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
              autoComplete="organization"
            />
          </div>

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
              autoComplete="name"
            />
          </div>

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
              autoComplete="off"
            />
          </div>

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
              Optional — helps admins reach you about approval or payment ($40/team).
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full h-14 outdoor-text-large bg-blue-600 hover:bg-blue-700"
            disabled={isSubmitting || !selectedTournamentId}
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
            * Required fields. Max {MAX_TEAMS} teams. Your registration will be reviewed by an admin.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
