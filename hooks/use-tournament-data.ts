"use client"

import type { Match, Team, TournamentPhase, Tournament, PendingRegistration } from "@/types/tournament"
import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { RealtimeChannel } from "@supabase/supabase-js"

export function useTournamentData() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [pendingRegistrations, setPendingRegistrations] = useState<PendingRegistration[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [poolPlayMatches, setPoolPlayMatches] = useState<Match[]>([])
  const [knockoutMatches, setKnockoutMatches] = useState<Match[]>([])
  const [currentPhase, setCurrentPhase] = useState<TournamentPhase>("registration")
  const [byeTeam, setByeTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "error">("connecting")
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const [subscriptions, setSubscriptions] = useState<RealtimeChannel[]>([])
  const [primaryTournamentId, setPrimaryTournamentId] = useState<number | null>(null)

  // Load initial data
  useEffect(() => {
    loadTournamentData()
  }, [])

  // Set up real-time subscriptions with enhanced error handling
  useEffect(() => {
    console.log("🔄 Setting up real-time subscriptions...")
    
    // Subscribe to tournaments changes
    const tournamentsSubscription = supabase
      .channel("tournaments-changes")
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "tournaments" 
        },
        (payload) => {
          console.log("🔄 Tournaments updated - reloading...", payload)
          loadTournaments()
        }
      )
      .subscribe((status, err) => {
        console.log("📡 Tournaments subscription status:", status)
        if (err) {
          console.error("❌ Tournaments subscription error:", err)
        } else if (status === "SUBSCRIBED") {
          console.log("✅ Tournaments real-time subscription active")
        }
      })

    // Subscribe to pending registrations changes
    const pendingRegistrationsSubscription = supabase
      .channel("pending-registrations-changes")
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "pending_team_registrations" 
        },
        (payload) => {
          console.log("🔄 Pending registrations updated - reloading...", payload)
          loadPendingRegistrations()
        }
      )
      .subscribe((status, err) => {
        console.log("📡 Pending registrations subscription status:", status)
        if (err) {
          console.error("❌ Pending registrations subscription error:", err)
        } else if (status === "SUBSCRIBED") {
          console.log("✅ Pending registrations real-time subscription active")
        }
      })
    
    // Subscribe to teams changes
    const teamsSubscription = supabase
      .channel("teams-changes")
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "teams" 
        },
        (payload) => {
          console.log("🔄 Teams updated - reloading...", payload)
          loadTeams()
        }
      )
      .subscribe((status, err) => {
        console.log("📡 Teams subscription status:", status)
        if (err) {
          console.error("❌ Teams subscription error:", err)
        } else if (status === "SUBSCRIBED") {
          console.log("✅ Teams real-time subscription active")
        }
      })

    // Subscribe to matches changes
    const matchesSubscription = supabase
      .channel("matches-changes")
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "matches" 
        },
        (payload) => {
          console.log("🔄 Matches updated - reloading...", payload)
          loadMatches()
        }
      )
      .subscribe((status, err) => {
        console.log("📡 Matches subscription status:", status)
        if (err) {
          console.error("❌ Matches subscription error:", err)
        } else if (status === "SUBSCRIBED") {
          console.log("✅ Matches real-time subscription active")
        }
      })

    const newSubscriptions = [
      tournamentsSubscription,
      pendingRegistrationsSubscription,
      teamsSubscription,
      matchesSubscription
    ]
    setSubscriptions(newSubscriptions)

    // Check connection after subscriptions
    setTimeout(() => {
      const allSubscribed = newSubscriptions.every(sub => 
        sub.state === "joined"
      )
      setRealtimeConnected(allSubscribed)
      console.log("📡 Real-time connection status:", allSubscribed ? "Connected" : "Disconnected")
    }, 3000)

    return () => {
      console.log("🔄 Cleaning up real-time subscriptions...")
      newSubscriptions.forEach(subscription => {
        subscription.unsubscribe()
      })
      setSubscriptions([])
      setRealtimeConnected(false)
    }
  }, [])

  // Get or create primary tournament
  const ensurePrimaryTournament = async (): Promise<number> => {
    try {
      // Check if we already have a primary tournament ID
      if (primaryTournamentId) return primaryTournamentId

      // Try to get existing tournaments
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .order("date", { ascending: false })
        .limit(1)

      if (error && error.code !== "42P01") throw error

      // If tournament exists, use it
      if (data && data.length > 0) {
        setPrimaryTournamentId(data[0].id)
        return data[0].id
      }

      // Create a new primary tournament
      const { data: newTournament, error: createError } = await supabase
        .from("tournaments")
        .insert({
          name: "4th of July Invitational 2025",
          date: new Date().toISOString().split('T')[0],
          status: "active",
          current_phase: "registration",
        })
        .select()
        .single()

      if (createError) throw createError

      setPrimaryTournamentId(newTournament.id)
      return newTournament.id
    } catch (error) {
      console.error("❌ Error ensuring primary tournament:", error)
      // Return a fallback ID
      return 1
    }
  }

  // Enhanced data loading with better error handling
  const loadTournamentData = useCallback(async () => {
    console.log("🚀 Loading tournament data...")
    setLoading(true)
    setConnectionStatus("connecting")

    try {
      // Ensure primary tournament exists first
      await ensurePrimaryTournament()
      
      await Promise.all([
        loadTournaments(),
        loadPendingRegistrations(),
        loadTeams(), 
        loadMatches(), 
        loadTournamentSettings()
      ])
      setConnectionStatus("connected")
      console.log("✅ Tournament data loaded successfully!")
    } catch (error) {
      console.error("❌ Failed to load tournament data:", error)
      setConnectionStatus("error")
    } finally {
      setLoading(false)
    }
  }, [])

  // Load tournaments
  const loadTournaments = async () => {
    try {
      console.log("🏆 Loading tournaments...")
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .order("date", { ascending: false })

      if (error) {
        if (error.code === "42P01") {
          console.warn("⚠️ Tournaments table doesn't exist yet. Run the SQL script in Supabase!")
          setTournaments([])
          return
        }
        throw error
      }

      const formattedTournaments: Tournament[] = data.map((tournament) => ({
        id: tournament.id,
        name: tournament.name,
        date: tournament.date,
        status: tournament.status,
        currentPhase: tournament.current_phase,
        byeTeamId: tournament.bye_team_id,
        createdAt: tournament.created_at,
        updatedAt: tournament.updated_at,
      }))

      setTournaments(formattedTournaments)
      console.log(`✅ Loaded ${formattedTournaments.length} tournaments`)
    } catch (error) {
      console.error("❌ Error loading tournaments:", error)
      setTournaments([])
    }
  }

  // Load pending registrations
  const loadPendingRegistrations = async () => {
    try {
      console.log("📋 Loading pending registrations...")
      const { data, error } = await supabase
        .from("pending_team_registrations")
        .select(`
          *,
          tournaments(*)
        `)
        .order("submitted_at", { ascending: false })

      if (error) {
        if (error.code === "42P01") {
          console.warn("⚠️ Pending registrations table doesn't exist yet. Run the SQL script in Supabase!")
          setPendingRegistrations([])
          return
        }
        throw error
      }

      const formattedRegistrations: PendingRegistration[] = data.map((reg) => ({
        id: reg.id,
        tournamentId: reg.tournament_id,
        tournament: reg.tournaments ? {
          id: reg.tournaments.id,
          name: reg.tournaments.name,
          date: reg.tournaments.date,
          status: reg.tournaments.status,
          currentPhase: reg.tournaments.current_phase,
          byeTeamId: reg.tournaments.bye_team_id,
          createdAt: reg.tournaments.created_at,
          updatedAt: reg.tournaments.updated_at,
        } : undefined,
        teamName: reg.team_name,
        players: reg.players,
        contactInfo: reg.contact_info,
        status: reg.status,
        adminNotes: reg.admin_notes,
        submittedAt: reg.submitted_at,
        reviewedAt: reg.reviewed_at,
        reviewedBy: reg.reviewed_by,
      }))

      setPendingRegistrations(formattedRegistrations)
      console.log(`✅ Loaded ${formattedRegistrations.length} pending registrations`)
    } catch (error) {
      console.error("❌ Error loading pending registrations:", error)
      setPendingRegistrations([])
    }
  }

  const loadTeams = async () => {
    try {
      console.log("📊 Loading teams...")
      const { data, error } = await supabase.from("teams").select("*").order("created_at", { ascending: true })

      if (error) {
        // Handle missing table error gracefully
        if (error.code === "42P01") {
          console.warn("⚠️ Teams table doesn't exist yet. Run the SQL script in Supabase!")
          setTeams([])
          return
        }
        throw error
      }

      const formattedTeams: Team[] = data.map((team) => ({
        id: team.id,
        tournamentId: team.tournament_id,
        name: team.name,
        players: team.players,
        paid: team.paid,
        wins: team.wins,
        losses: team.losses,
        pointsFor: team.points_for,
        pointsAgainst: team.points_against,
      }))

      setTeams(formattedTeams)
      console.log(`✅ Loaded ${formattedTeams.length} teams`)
    } catch (error) {
      console.error("❌ Error loading teams:", error)
      setTeams([]) // Fallback to empty array
    }
  }

  const loadMatches = async () => {
    try {
      console.log("🏆 Loading matches...")

      // Get all matches first
      const { data: matchRows, error: matchError } = await supabase
        .from("matches")
        .select("*")
        .order("created_at", { ascending: true })

      if (matchError) {
        // Handle missing table (42P01) gracefully
        if (matchError.code === "42P01") {
          console.warn("⚠️ Matches table doesn't exist yet. Run the SQL script in Supabase!")
          setPoolPlayMatches([])
          setKnockoutMatches([])
          return
        }
        throw matchError
      }

      if (!matchRows || matchRows.length === 0) {
        setPoolPlayMatches([])
        setKnockoutMatches([])
        console.log("ℹ️ No matches yet")
        return
      }

      // Fetch all relevant teams in a single query
      const teamIds = Array.from(
        new Set(matchRows.flatMap((m) => [m.team1_id, m.team2_id]).filter(Boolean) as number[]),
      )

      const { data: teamRows, error: teamError } = await supabase.from("teams").select("*").in("id", teamIds)

      if (teamError) throw teamError

      const teamMap = new Map<number, Team>(
        teamRows!.map((t) => [
          t.id,
          {
            id: t.id,
            tournamentId: t.tournament_id,
            name: t.name,
            players: t.players,
            paid: t.paid,
            wins: t.wins,
            losses: t.losses,
            pointsFor: t.points_for,
            pointsAgainst: t.points_against,
          },
        ]),
      )

      // Build Match objects
      const formattedMatches: Match[] = matchRows.map((m) => ({
        id: m.id,
        tournamentId: m.tournament_id,
        team1: teamMap.get(m.team1_id)!,
        team2: teamMap.get(m.team2_id)!,
        team1Score: m.team1_score,
        team2Score: m.team2_score,
        completed: m.completed,
        phase: m.phase,
        round: m.round,
      }))

      // Separate phases
      setPoolPlayMatches(formattedMatches.filter((m) => m.phase === "pool-play"))
      setKnockoutMatches(formattedMatches.filter((m) => m.phase === "knockout"))

      console.log(`✅ Loaded ${formattedMatches.length} matches (${teamIds.length} unique teams)`)
    } catch (error) {
      console.error("❌ Error loading matches:", error)
      setPoolPlayMatches([])
      setKnockoutMatches([])
    }
  }

  const loadTournamentSettings = async () => {
    try {
      console.log("⚙️ Loading tournament settings...")
      const { data, error } = await supabase
        .from("tournament_settings")
        .select(`
          *,
          bye_team:teams!bye_team_id(*)
        `)
        .single()

      if (error) {
        // Handle missing table or no data
        if (error.code === "42P01" || error.code === "PGRST116") {
          console.warn("⚠️ Tournament settings not found. Using defaults.")
          setCurrentPhase("registration")
          setByeTeam(null)
          return
        }
        throw error
      }

      setCurrentPhase(data.current_phase)

      if (data.bye_team) {
        setByeTeam({
          id: data.bye_team.id,
          tournamentId: data.bye_team.tournament_id,
          name: data.bye_team.name,
          players: data.bye_team.players,
          paid: data.bye_team.paid,
          wins: data.bye_team.wins,
          losses: data.bye_team.losses,
          pointsFor: data.bye_team.points_for,
          pointsAgainst: data.bye_team.points_against,
        })
        console.log(`✅ Bye team loaded: ${data.bye_team.name}`)
      } else {
        setByeTeam(null)
      }
    } catch (error) {
      console.error("❌ Error loading tournament settings:", error)
      setCurrentPhase("registration")
      setByeTeam(null)
    }
  }

  // Tournament management functions
  const createTournament = async (tournament: Omit<Tournament, "id" | "createdAt" | "updatedAt">) => {
    console.log("➕ Creating tournament:", tournament.name)
    const { error } = await supabase.from("tournaments").insert({
      name: tournament.name,
      date: tournament.date,
      status: tournament.status,
      current_phase: tournament.currentPhase,
      bye_team_id: tournament.byeTeamId,
    })

    if (error) {
      console.error("❌ Error creating tournament:", error)
      throw error
    }
    console.log("✅ Tournament created successfully!")
    await loadTournaments()
  }

  const updateTournament = async (tournamentId: number, updates: Partial<Tournament>) => {
    console.log("📝 Updating tournament:", tournamentId)
    const { error } = await supabase
      .from("tournaments")
      .update({
        name: updates.name,
        date: updates.date,
        status: updates.status,
        current_phase: updates.currentPhase,
        bye_team_id: updates.byeTeamId,
      })
      .eq("id", tournamentId)

    if (error) {
      console.error("❌ Error updating tournament:", error)
      throw error
    }
    console.log("✅ Tournament updated successfully!")
    await loadTournaments()
  }

  const deleteTournament = async (tournamentId: number) => {
    console.log("🗑️ Deleting tournament:", tournamentId)
    const { error } = await supabase.from("tournaments").delete().eq("id", tournamentId)

    if (error) {
      console.error("❌ Error deleting tournament:", error)
      throw error
    }
    console.log("✅ Tournament deleted successfully!")
    await loadTournaments()
  }

  const addTeam = async (team: Omit<Team, "id">) => {
    const tournamentId = await ensurePrimaryTournament()
    console.log("➕ Adding team:", team.name)
    const { error } = await supabase.from("teams").insert({
      tournament_id: team.tournamentId || tournamentId,
      name: team.name,
      players: team.players,
      paid: team.paid,
      wins: team.wins || 0,
      losses: team.losses || 0,
      points_for: team.pointsFor || 0,
      points_against: team.pointsAgainst || 0,
    })

    if (error) {
      console.error("❌ Error adding team:", error)
      throw error
    }
    console.log("✅ Team added successfully!")
    
    // Manually reload teams to update UI
    console.log("🔄 Manually reloading teams for UI update...")
    await loadTeams()
  }

  const updateTeam = async (teamId: number, updates: Partial<Team>) => {
    console.log("📝 Updating team:", teamId)
    const { error } = await supabase
      .from("teams")
      .update({
        tournament_id: updates.tournamentId,
        name: updates.name,
        players: updates.players,
        paid: updates.paid,
        wins: updates.wins,
        losses: updates.losses,
        points_for: updates.pointsFor,
        points_against: updates.pointsAgainst,
      })
      .eq("id", teamId)

    if (error) {
      console.error("❌ Error updating team:", error)
      throw error
    }
    console.log("✅ Team updated successfully!")
    
    // Manually reload teams to update UI
    console.log("🔄 Manually reloading teams for UI update...")
    await loadTeams()
  }

  const deleteTeam = async (teamId: number) => {
    console.log("🗑️ Deleting team:", teamId)

    try {
      // First delete any matches involving this team
      const { error: matchError } = await supabase
        .from("matches")
        .delete()
        .or(`team1_id.eq.${teamId},team2_id.eq.${teamId}`)

      if (matchError) {
        console.error("Error deleting team matches:", matchError)
        // Continue anyway - the team deletion might still work
      }

      // Then delete the team
      const { error: teamError } = await supabase.from("teams").delete().eq("id", teamId)

      if (teamError) {
        console.error("❌ Error deleting team:", teamError)
        throw teamError
      }

      console.log("✅ Team deleted successfully!")
      
      // Manually reload teams to update UI
      console.log("🔄 Manually reloading teams for UI update...")
      await loadTeams()
    } catch (error) {
      console.error("❌ Error in deleteTeam:", error)
      throw error
    }
  }

  const updateMatch = async (matchId: number, updates: Partial<Match>) => {
    console.log("⚽ Updating match:", matchId)
    const { error } = await supabase
      .from("matches")
      .update({
        tournament_id: updates.tournamentId,
        team1_score: updates.team1Score,
        team2_score: updates.team2Score,
        completed: updates.completed,
      })
      .eq("id", matchId)

    if (error) {
      console.error("❌ Error updating match:", error)
      throw error
    }
    console.log("✅ Match updated successfully!")
    
    // Manually reload matches to update UI
    console.log("🔄 Manually reloading matches for UI update...")
    await loadMatches()
  }

  // Create matches - simple version for single tournament
  const createMatches = async (matches: Array<Omit<Match, "id" | "tournamentId" | "tournament"> & { tournamentId?: number }>) => {
    const tournamentId = await ensurePrimaryTournament()
    console.log(`🎯 Creating ${matches.length} matches for tournament ${tournamentId}...`)

    try {
      const matchInserts = matches.map((match) => ({
        tournament_id: match.tournamentId || tournamentId,
        team1_id: match.team1.id,
        team2_id: match.team2.id,
        team1_score: match.team1Score || 0,
        team2_score: match.team2Score || 0,
        completed: match.completed || false,
        phase: match.phase,
        round: match.round || null,
      }))

      const { data, error } = await supabase.from("matches").insert(matchInserts).select()

      if (error) {
        console.error("❌ Error creating matches:", error)
        throw error
      }

      console.log(`✅ Created ${data.length} matches successfully!`)
      await loadMatches()
    } catch (error) {
      console.error("❌ Error in createMatches:", error)
      throw error
    }
  }

  const updateTournamentPhase = async (phase: TournamentPhase) => {
    const tournamentId = await ensurePrimaryTournament()
    console.log(`🔄 Updating tournament ${tournamentId} phase to:`, phase)

    try {
      const { error } = await supabase
        .from("tournaments")
        .update({ current_phase: phase })
        .eq("id", tournamentId)

      if (error) {
        console.error("❌ Error updating tournament phase:", error)
        throw error
      }

      // Also update local state immediately
      setCurrentPhase(phase)
      console.log("✅ Tournament phase updated successfully!")
      await loadTournaments()
    } catch (error) {
      console.error("❌ Error in updateTournamentPhase:", error)
      throw error
    }
  }

  const setByeTeamId = async (teamId: number | null) => {
    const tournamentId = await ensurePrimaryTournament()
    console.log(`🔄 Setting bye team for tournament ${tournamentId}:`, teamId)

    try {
      const { error } = await supabase
        .from("tournaments")
        .update({ bye_team_id: teamId })
        .eq("id", tournamentId)

      if (error) {
        console.error("❌ Error setting bye team:", error)
        throw error
      }

      console.log("✅ Bye team set successfully!")
      await loadTournaments()
    } catch (error) {
      console.error("❌ Error in setByeTeamId:", error)
      throw error
    }
  }

  const resetTournament = async () => {
    const tournamentId = await ensurePrimaryTournament()
    console.log(`🔄 Resetting tournament ${tournamentId}...`)

    try {
      // Step 1: Clear bye team reference
      await supabase
        .from("tournaments")
        .update({ bye_team_id: null })
        .eq("id", tournamentId)

      // Step 2: Delete all matches for this tournament
      const { error: matchError } = await supabase
        .from("matches")
        .delete()
        .eq("tournament_id", tournamentId)
      
      if (matchError) {
        console.error("❌ Error deleting matches:", matchError)
        throw matchError
      }
      console.log("✅ All matches deleted")

      // Step 3: Delete all teams for this tournament
      const { error: teamError } = await supabase
        .from("teams")
        .delete()
        .eq("tournament_id", tournamentId)
      
      if (teamError) {
        console.error("❌ Error deleting teams:", teamError)
        throw teamError
      }
      console.log("✅ All teams deleted")

      // Step 4: Reset tournament phase
      const { error: phaseError } = await supabase
        .from("tournaments")
        .update({ current_phase: "registration" })
        .eq("id", tournamentId)
      
      if (phaseError) {
        console.error("❌ Error resetting tournament phase:", phaseError)
        throw phaseError
      }

      console.log("✅ Tournament reset successfully!")
      
      // Manually reload all data to update UI
      console.log("🔄 Manually reloading all data for UI update...")
      await Promise.all([
        loadTournaments(),
        loadTeams(),
        loadMatches(), 
        loadTournamentSettings()
      ])
      console.log("✅ All data reloaded after reset!")
    } catch (error) {
      console.error("❌ Error resetting tournament:", error)
      throw error
    }
  }

  return {
    tournaments,
    pendingRegistrations,
    teams,
    poolPlayMatches,
    knockoutMatches,
    currentPhase,
    byeTeam,
    loading,
    connectionStatus,
    realtimeConnected,
    subscriptions,
    createTournament,
    updateTournament,
    deleteTournament,
    addTeam,
    updateTeam,
    deleteTeam,
    updateMatch,
    createMatches,
    updateTournamentPhase,
    setByeTeamId,
    resetTournament,
    loadTournaments,
    loadPendingRegistrations,
    loadTeams,
    loadMatches,
  }
}
