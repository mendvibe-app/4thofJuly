"use client"

import type { Match, Team, TournamentPhase } from "@/types/tournament"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export function useTournamentData() {
  const [teams, setTeams] = useState<Team[]>([])
  const [poolPlayMatches, setPoolPlayMatches] = useState<Match[]>([])
  const [knockoutMatches, setKnockoutMatches] = useState<Match[]>([])
  const [currentPhase, setCurrentPhase] = useState<TournamentPhase>("registration")
  const [byeTeam, setByeTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "error">("connecting")

  // Load initial data
  useEffect(() => {
    loadTournamentData()
  }, [])

  // Set up real-time subscriptions
  useEffect(() => {
    // Subscribe to teams changes
    const teamsSubscription = supabase
      .channel("teams-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "teams" }, (payload) => {
        console.log("🔄 Teams updated - reloading...", payload)
        loadTeams()
      })
      .subscribe((status) => {
        console.log("📡 Teams subscription status:", status)
      })

    // Subscribe to matches changes
    const matchesSubscription = supabase
      .channel("matches-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, () => {
        console.log("🔄 Matches updated - reloading...")
        loadMatches()
      })
      .subscribe()

    // Subscribe to tournament settings changes
    const settingsSubscription = supabase
      .channel("settings-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "tournament_settings" }, () => {
        console.log("🔄 Tournament settings updated - reloading...")
        loadTournamentSettings()
      })
      .subscribe()

    return () => {
      teamsSubscription.unsubscribe()
      matchesSubscription.unsubscribe()
      settingsSubscription.unsubscribe()
    }
  }, [])

  const loadTournamentData = async () => {
    console.log("🚀 Loading tournament data...")
    setLoading(true)
    setConnectionStatus("connecting")

    try {
      await Promise.all([loadTeams(), loadMatches(), loadTournamentSettings()])
      setConnectionStatus("connected")
      console.log("✅ Tournament data loaded successfully!")
    } catch (error) {
      console.error("❌ Failed to load tournament data:", error)
      setConnectionStatus("error")
    } finally {
      setLoading(false)
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

  const addTeam = async (team: Omit<Team, "id">) => {
    console.log("➕ Adding team:", team.name)
    const { error } = await supabase.from("teams").insert({
      name: team.name,
      players: team.players,
      paid: team.paid,
      wins: team.wins,
      losses: team.losses,
      points_for: team.pointsFor,
      points_against: team.pointsAgainst,
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

  const createMatches = async (matches: Omit<Match, "id">[]) => {
    console.log("🏆 Creating matches:", matches.length)
    
    // Validate input data
    if (!matches || matches.length === 0) {
      console.error("❌ No matches provided to create")
      throw new Error("No matches provided to create")
    }
    
    // Validate each match
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i]
      if (!match.team1 || !match.team2) {
        console.error(`❌ Invalid match ${i}: Missing team data`, match)
        throw new Error(`Invalid match ${i}: Missing team data`)
      }
      if (!match.team1.id || !match.team2.id) {
        console.error(`❌ Invalid match ${i}: Missing team IDs`, match)
        throw new Error(`Invalid match ${i}: Missing team IDs`)
      }
    }
    
    const matchData = matches.map((match) => ({
      team1_id: match.team1.id,
      team2_id: match.team2.id,
      team1_score: match.team1Score,
      team2_score: match.team2Score,
      completed: match.completed,
      phase: match.phase,
      round: match.round,
    }))

    console.log("📝 Match data to insert:", matchData)
    
    const { error, data } = await supabase.from("matches").insert(matchData).select()

    if (error) {
      console.error("❌ Error creating matches:", error)
      console.error("❌ Failed data:", matchData)
      throw error
    }
    console.log("✅ Matches created successfully!", data)
    
    // Manually reload matches to update UI
    console.log("🔄 Manually reloading matches for UI update...")
    await loadMatches()
  }

  const updateTournamentPhase = async (phase: TournamentPhase) => {
    console.log("🔄 Updating tournament phase to:", phase)

    // First, ensure tournament_settings record exists
    const { data: existing } = await supabase.from("tournament_settings").select("id").single()

    if (!existing) {
      // Create initial record
      const { error: insertError } = await supabase.from("tournament_settings").insert({
        current_phase: phase,
        bye_team_id: null,
      })

      if (insertError) {
        console.error("❌ Error creating tournament settings:", insertError)
        throw insertError
      }
    } else {
      // Update existing record
      const { error } = await supabase
        .from("tournament_settings")
        .update({ current_phase: phase })
        .eq("id", existing.id)

      if (error) {
        console.error("❌ Error updating tournament phase:", error)
        throw error
      }
    }
    console.log("✅ Tournament phase updated successfully!")
    
    // Manually reload tournament settings to update UI
    console.log("🔄 Manually reloading tournament settings for UI update...")
    await loadTournamentSettings()
  }

  const setByeTeamId = async (teamId: number | null) => {
    console.log("👋 Setting bye team:", teamId)

    // First, ensure tournament_settings record exists
    const { data: existing } = await supabase.from("tournament_settings").select("id").single()

    if (!existing) {
      // Create initial record
      const { error: insertError } = await supabase.from("tournament_settings").insert({
        current_phase: "registration",
        bye_team_id: teamId,
      })

      if (insertError) {
        console.error("❌ Error creating tournament settings:", insertError)
        throw insertError
      }
    } else {
      // Update existing record
      const { error } = await supabase.from("tournament_settings").update({ bye_team_id: teamId }).eq("id", existing.id)

      if (error) {
        console.error("❌ Error setting bye team:", error)
        throw error
      }
    }
    console.log("✅ Bye team set successfully!")
    
    // Manually reload tournament settings to update UI
    console.log("🔄 Manually reloading tournament settings for UI update...")
    await loadTournamentSettings()
  }

  const resetTournament = async () => {
    console.log("🔄 Resetting tournament...")

    try {
      // Step 1: Reset tournament settings first (clear bye_team_id to remove foreign key reference)
      const { data: existing } = await supabase.from("tournament_settings").select("id").single()

      if (existing) {
        const { error: settingsError } = await supabase
          .from("tournament_settings")
          .update({
            current_phase: "registration",
            bye_team_id: null,  // Clear this BEFORE deleting teams
          })
          .eq("id", existing.id)

        if (settingsError) {
          console.error("❌ Error resetting tournament settings:", settingsError)
          throw settingsError
        }
        console.log("✅ Tournament settings reset")
      }

      // Step 2: Delete all matches (due to foreign key constraints with teams)
      const { error: matchError } = await supabase.from("matches").delete().gte("id", 0)
      if (matchError) {
        console.error("❌ Error deleting matches:", matchError)
        throw matchError
      }
      console.log("✅ All matches deleted")

      // Step 3: Now safe to delete all teams (no foreign key references left)
      const { error: teamError } = await supabase.from("teams").delete().gte("id", 0)
      if (teamError) {
        console.error("❌ Error deleting teams:", teamError)
        throw teamError
      }
      console.log("✅ All teams deleted")

      console.log("✅ Tournament reset successfully!")
      
      // Manually reload all data to update UI
      console.log("🔄 Manually reloading all data for UI update...")
      await Promise.all([
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
  }
}
