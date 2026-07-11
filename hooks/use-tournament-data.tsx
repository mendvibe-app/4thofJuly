"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import type {
  Match,
  Team,
  TournamentPhase,
  Tournament,
  PendingRegistration,
} from "@/types/tournament"
import { supabase } from "@/lib/supabase"
import { pickPrimaryTournament } from "@/lib/tournaments"
import type { RealtimeChannel } from "@supabase/supabase-js"

const POLL_INTERVAL_MS = 30_000

type ConnectionStatus = "connecting" | "connected" | "error"

export type TournamentDataValue = {
  tournaments: Tournament[]
  pendingRegistrations: PendingRegistration[]
  teams: Team[]
  poolPlayMatches: Match[]
  knockoutMatches: Match[]
  currentPhase: TournamentPhase
  byeTeam: Team | null
  primaryTournamentId: number | null
  loading: boolean
  connectionStatus: ConnectionStatus
  realtimeConnected: boolean
  isPolling: boolean
  createTournament: (
    tournament: Omit<Tournament, "id" | "createdAt" | "updatedAt">,
  ) => Promise<void>
  updateTournament: (tournamentId: number, updates: Partial<Tournament>) => Promise<void>
  deleteTournament: (tournamentId: number) => Promise<void>
  setActiveTournament: (tournamentId: number) => Promise<void>
  addTeam: (team: Omit<Team, "id" | "tournamentId"> & { tournamentId?: number }) => Promise<void>
  updateTeam: (teamId: number, updates: Partial<Team>) => Promise<void>
  deleteTeam: (teamId: number) => Promise<void>
  updateMatch: (matchId: number, updates: Partial<Match>) => Promise<void>
  createMatches: (
    matches: Array<
      Omit<Match, "id" | "tournamentId" | "tournament"> & { tournamentId?: number }
    >,
  ) => Promise<void>
  updateTournamentPhase: (phase: TournamentPhase) => Promise<void>
  setByeTeamId: (teamId: number | null) => Promise<void>
  resetTournament: () => Promise<void>
  clearKnockoutMatches: () => Promise<void>
  loadTournaments: () => Promise<boolean>
  loadPendingRegistrations: () => Promise<void>
  loadTeams: () => Promise<void>
  loadMatches: () => Promise<void>
}

const TournamentDataContext = createContext<TournamentDataValue | null>(null)

function mapTeam(row: {
  id: number
  tournament_id: number
  name: string
  players: string[]
  paid: boolean
  wins: number
  losses: number
  points_for: number
  points_against: number
}): Team {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    name: row.name,
    players: row.players,
    paid: row.paid,
    wins: row.wins,
    losses: row.losses,
    pointsFor: row.points_for,
    pointsAgainst: row.points_against,
  }
}

function mapTournament(row: {
  id: number
  name: string
  date: string
  status: Tournament["status"]
  current_phase: TournamentPhase
  bye_team_id: number | null
  created_at: string
  updated_at: string
}): Tournament {
  return {
    id: row.id,
    name: row.name,
    date: row.date,
    status: row.status,
    currentPhase: row.current_phase,
    byeTeamId: row.bye_team_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function useTournamentDataState(): TournamentDataValue {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [pendingRegistrations, setPendingRegistrations] = useState<PendingRegistration[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [poolPlayMatches, setPoolPlayMatches] = useState<Match[]>([])
  const [knockoutMatches, setKnockoutMatches] = useState<Match[]>([])
  const [currentPhase, setCurrentPhase] = useState<TournamentPhase>("registration")
  const [byeTeam, setByeTeam] = useState<Team | null>(null)
  const [primaryTournamentId, setPrimaryTournamentId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting")
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const [isPolling, setIsPolling] = useState(false)

  const primaryTournamentIdRef = useRef<number | null>(null)
  const channelStatusesRef = useRef<Record<string, string>>({})

  const syncPrimaryId = useCallback((id: number | null) => {
    primaryTournamentIdRef.current = id
    setPrimaryTournamentId(id)
  }, [])

  const demoteOtherActiveTournaments = useCallback(async (exceptId: number) => {
    const { error } = await supabase
      .from("tournaments")
      .update({ status: "upcoming" })
      .eq("status", "active")
      .neq("id", exceptId)

    if (error && error.code !== "42P01") throw error
  }, [])

  const ensurePrimaryTournament = useCallback(async (): Promise<number> => {
    if (primaryTournamentIdRef.current) {
      return primaryTournamentIdRef.current
    }

    const { data, error } = await supabase.from("tournaments").select("*")

    if (error && error.code !== "42P01") throw error

    const formatted = (data ?? []).map(mapTournament)
    const primary = pickPrimaryTournament(formatted)

    if (primary) {
      syncPrimaryId(primary.id)
      return primary.id
    }

    throw new Error("NO_TOURNAMENT")
  }, [syncPrimaryId])

  const loadTournaments = useCallback(async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .order("date", { ascending: false })

      if (error) {
        if (error.code === "42P01") {
          setTournaments([])
          syncPrimaryId(null)
          return true
        }
        throw error
      }

      const formatted = (data ?? []).map(mapTournament)
      setTournaments(formatted)

      const previousId = primaryTournamentIdRef.current
      const primary = pickPrimaryTournament(formatted)

      if (primary) {
        syncPrimaryId(primary.id)
        setCurrentPhase(primary.currentPhase)
        if (!primary.byeTeamId) {
          setByeTeam(null)
        }
        return primary.id !== previousId
      }

      syncPrimaryId(null)
      return previousId !== null
    } catch (error) {
      console.error("Error loading tournaments:", error)
      setTournaments([])
      return false
    }
  }, [syncPrimaryId])

  const loadPendingRegistrations = useCallback(async () => {
    try {
      const tournamentId = primaryTournamentIdRef.current
      let query = supabase
        .from("pending_team_registrations")
        .select(`*, tournaments(*)`)
        .order("submitted_at", { ascending: false })

      if (tournamentId) {
        query = query.eq("tournament_id", tournamentId)
      }

      const { data, error } = await query

      if (error) {
        if (error.code === "42P01") {
          setPendingRegistrations([])
          return
        }
        throw error
      }

      const formatted: PendingRegistration[] = (data ?? []).map((reg) => ({
        id: reg.id,
        tournamentId: reg.tournament_id,
        tournament: reg.tournaments ? mapTournament(reg.tournaments) : undefined,
        teamName: reg.team_name,
        players: reg.players,
        contactInfo: reg.contact_info ?? undefined,
        status: reg.status,
        adminNotes: reg.admin_notes ?? undefined,
        submittedAt: reg.submitted_at,
        reviewedAt: reg.reviewed_at ?? undefined,
        reviewedBy: reg.reviewed_by ?? undefined,
      }))

      setPendingRegistrations(formatted)
    } catch (error) {
      console.error("Error loading pending registrations:", error)
      setPendingRegistrations([])
    }
  }, [])

  const loadTeams = useCallback(async () => {
    try {
      const tournamentId = primaryTournamentIdRef.current
      let query = supabase.from("teams").select("*").order("created_at", { ascending: true })

      if (tournamentId) {
        query = query.eq("tournament_id", tournamentId)
      }

      const { data, error } = await query

      if (error) {
        if (error.code === "42P01") {
          setTeams([])
          return
        }
        throw error
      }

      setTeams((data ?? []).map(mapTeam))
    } catch (error) {
      console.error("Error loading teams:", error)
      setTeams([])
    }
  }, [])

  const loadMatches = useCallback(async () => {
    try {
      const tournamentId = primaryTournamentIdRef.current
      let query = supabase.from("matches").select("*").order("created_at", { ascending: true })

      if (tournamentId) {
        query = query.eq("tournament_id", tournamentId)
      }

      const { data: matchRows, error: matchError } = await query

      if (matchError) {
        if (matchError.code === "42P01") {
          setPoolPlayMatches([])
          setKnockoutMatches([])
          return
        }
        throw matchError
      }

      if (!matchRows || matchRows.length === 0) {
        setPoolPlayMatches([])
        setKnockoutMatches([])
        return
      }

      const teamIds = Array.from(
        new Set(matchRows.flatMap((m) => [m.team1_id, m.team2_id]).filter(Boolean) as number[]),
      )

      const { data: teamRows, error: teamError } = await supabase
        .from("teams")
        .select("*")
        .in("id", teamIds)

      if (teamError) throw teamError

      const teamMap = new Map<number, Team>((teamRows ?? []).map((t) => [t.id, mapTeam(t)]))

      const formattedMatches = matchRows
        .map((m): Match | null => {
          const team1 = teamMap.get(m.team1_id)
          const team2 = teamMap.get(m.team2_id)
          if (!team1 || !team2) return null
          return {
            id: m.id,
            tournamentId: m.tournament_id,
            team1,
            team2,
            team1Score: m.team1_score,
            team2Score: m.team2_score,
            completed: m.completed,
            phase: m.phase,
            round: m.round ?? undefined,
          }
        })
        .filter((m): m is Match => m !== null)

      setPoolPlayMatches(formattedMatches.filter((m) => m.phase === "pool-play"))
      setKnockoutMatches(formattedMatches.filter((m) => m.phase === "knockout"))
    } catch (error) {
      console.error("Error loading matches:", error)
      setPoolPlayMatches([])
      setKnockoutMatches([])
    }
  }, [])

  const loadPrimaryTournamentState = useCallback(async () => {
    const tournamentId = primaryTournamentIdRef.current
    if (!tournamentId) {
      setCurrentPhase("registration")
      setByeTeam(null)
      return
    }

    const { data, error } = await supabase
      .from("tournaments")
      .select(`*, bye_team:teams!bye_team_id(*)`)
      .eq("id", tournamentId)
      .maybeSingle()

    if (error) {
      if (error.code === "42P01" || error.code === "PGRST116") {
        setCurrentPhase("registration")
        setByeTeam(null)
        return
      }
      throw error
    }

    if (!data) {
      setCurrentPhase("registration")
      setByeTeam(null)
      return
    }

    setCurrentPhase(data.current_phase)
    setByeTeam(data.bye_team ? mapTeam(data.bye_team) : null)
  }, [])

  const refreshScopedData = useCallback(async () => {
    await Promise.all([
      loadTournaments(),
      loadPendingRegistrations(),
      loadTeams(),
      loadMatches(),
      loadPrimaryTournamentState(),
    ])
  }, [
    loadTournaments,
    loadPendingRegistrations,
    loadTeams,
    loadMatches,
    loadPrimaryTournamentState,
  ])

  const loadTournamentData = useCallback(async () => {
    setLoading(true)
    setConnectionStatus("connecting")

    try {
      await ensurePrimaryTournament()
      await refreshScopedData()
      setConnectionStatus("connected")
    } catch (error) {
      if (error instanceof Error && error.message === "NO_TOURNAMENT") {
        syncPrimaryId(null)
        setTournaments([])
        setTeams([])
        setPoolPlayMatches([])
        setKnockoutMatches([])
        setPendingRegistrations([])
        setCurrentPhase("registration")
        setByeTeam(null)
        setConnectionStatus("connected")
      } else {
        console.error("Failed to load tournament data:", error)
        setConnectionStatus("error")
      }
    } finally {
      setLoading(false)
    }
  }, [ensurePrimaryTournament, refreshScopedData, syncPrimaryId])

  useEffect(() => {
    loadTournamentData()
  }, [loadTournamentData])

  // Realtime subscriptions — single set for the provider lifetime
  useEffect(() => {
    const channelId = Math.random().toString(36).slice(2, 10)
    const channelNames = [
      `tournaments-changes-${channelId}`,
      `pending-registrations-changes-${channelId}`,
      `teams-changes-${channelId}`,
      `matches-changes-${channelId}`,
    ] as const

    const updateRealtimeStatus = () => {
      const statuses = Object.values(channelStatusesRef.current)
      const allJoined =
        statuses.length === channelNames.length &&
        statuses.every((status) => status === "SUBSCRIBED")
      setRealtimeConnected(allJoined)
      if (allJoined) {
        setIsPolling(false)
      }
    }

    const channels: RealtimeChannel[] = [
      supabase
        .channel(channelNames[0])
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "tournaments" },
          () => {
            void loadTournaments().then((primaryChanged) => {
              if (primaryChanged) {
                void Promise.all([
                  loadPendingRegistrations(),
                  loadTeams(),
                  loadMatches(),
                  loadPrimaryTournamentState(),
                ])
              } else {
                void loadPrimaryTournamentState()
              }
            })
          },
        )
        .subscribe((status) => {
          channelStatusesRef.current[channelNames[0]] = status
          updateRealtimeStatus()
        }),
      supabase
        .channel(channelNames[1])
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "pending_team_registrations" },
          () => {
            void loadPendingRegistrations()
          },
        )
        .subscribe((status) => {
          channelStatusesRef.current[channelNames[1]] = status
          updateRealtimeStatus()
        }),
      supabase
        .channel(channelNames[2])
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "teams" },
          () => {
            void loadTeams().then(() => loadPrimaryTournamentState())
          },
        )
        .subscribe((status) => {
          channelStatusesRef.current[channelNames[2]] = status
          updateRealtimeStatus()
        }),
      supabase
        .channel(channelNames[3])
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "matches" },
          () => {
            void loadMatches()
          },
        )
        .subscribe((status) => {
          channelStatusesRef.current[channelNames[3]] = status
          updateRealtimeStatus()
        }),
    ]

    const realtimeCheck = window.setTimeout(updateRealtimeStatus, 2500)

    return () => {
      window.clearTimeout(realtimeCheck)
      channels.forEach((channel) => {
        void supabase.removeChannel(channel)
      })
      channelStatusesRef.current = {}
      setRealtimeConnected(false)
    }
  }, [
    loadTournaments,
    loadPendingRegistrations,
    loadTeams,
    loadMatches,
    loadPrimaryTournamentState,
  ])

  // Polling fallback when realtime is not connected
  useEffect(() => {
    if (loading || connectionStatus === "error") return

    if (realtimeConnected) {
      setIsPolling(false)
      return
    }

    setIsPolling(true)
    const interval = window.setInterval(() => {
      void Promise.all([
        loadTournaments(),
        loadPendingRegistrations(),
        loadTeams(),
        loadMatches(),
        loadPrimaryTournamentState(),
      ])
    }, POLL_INTERVAL_MS)

    return () => {
      window.clearInterval(interval)
    }
  }, [
    loading,
    connectionStatus,
    realtimeConnected,
    loadTournaments,
    loadPendingRegistrations,
    loadTeams,
    loadMatches,
    loadPrimaryTournamentState,
  ])

  const createTournament = useCallback(
    async (tournament: Omit<Tournament, "id" | "createdAt" | "updatedAt">) => {
      if (tournament.status === "active") {
        await demoteOtherActiveTournaments(-1)
      }

      const { data, error } = await supabase
        .from("tournaments")
        .insert({
          name: tournament.name,
          date: tournament.date,
          status: tournament.status,
          current_phase: tournament.currentPhase,
          bye_team_id: tournament.byeTeamId,
        })
        .select()
        .single()

      if (error) throw error

      if (tournament.status === "active" && data) {
        syncPrimaryId(data.id)
      }

      await refreshScopedData()
    },
    [demoteOtherActiveTournaments, refreshScopedData, syncPrimaryId],
  )

  const updateTournament = useCallback(
    async (tournamentId: number, updates: Partial<Tournament>) => {
      if (updates.status === "active") {
        await demoteOtherActiveTournaments(tournamentId)
      }

      const payload: Record<string, unknown> = {}
      if (updates.name !== undefined) payload.name = updates.name
      if (updates.date !== undefined) payload.date = updates.date
      if (updates.status !== undefined) payload.status = updates.status
      if (updates.currentPhase !== undefined) payload.current_phase = updates.currentPhase
      if (updates.byeTeamId !== undefined) payload.bye_team_id = updates.byeTeamId

      const { error } = await supabase
        .from("tournaments")
        .update(payload)
        .eq("id", tournamentId)

      if (error) throw error

      if (updates.status === "active") {
        syncPrimaryId(tournamentId)
      }

      await refreshScopedData()
    },
    [demoteOtherActiveTournaments, refreshScopedData, syncPrimaryId],
  )

  const setActiveTournament = useCallback(
    async (tournamentId: number) => {
      await demoteOtherActiveTournaments(tournamentId)

      const { error } = await supabase
        .from("tournaments")
        .update({ status: "active" })
        .eq("id", tournamentId)

      if (error) throw error

      syncPrimaryId(tournamentId)
      await refreshScopedData()
    },
    [demoteOtherActiveTournaments, refreshScopedData, syncPrimaryId],
  )

  const deleteTournament = useCallback(
    async (tournamentId: number) => {
      const { error } = await supabase.from("tournaments").delete().eq("id", tournamentId)
      if (error) throw error

      if (primaryTournamentIdRef.current === tournamentId) {
        syncPrimaryId(null)
      }
      await loadTournamentData()
    },
    [loadTournamentData, syncPrimaryId],
  )

  const addTeam = useCallback(
    async (team: Omit<Team, "id" | "tournamentId"> & { tournamentId?: number }) => {
      const tournamentId = await ensurePrimaryTournament()
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

      if (error) throw error
      await loadTeams()
    },
    [ensurePrimaryTournament, loadTeams],
  )

  const updateTeam = useCallback(
    async (teamId: number, updates: Partial<Team>) => {
      const payload: Record<string, unknown> = {}
      if (updates.tournamentId !== undefined) payload.tournament_id = updates.tournamentId
      if (updates.name !== undefined) payload.name = updates.name
      if (updates.players !== undefined) payload.players = updates.players
      if (updates.paid !== undefined) payload.paid = updates.paid
      if (updates.wins !== undefined) payload.wins = updates.wins
      if (updates.losses !== undefined) payload.losses = updates.losses
      if (updates.pointsFor !== undefined) payload.points_for = updates.pointsFor
      if (updates.pointsAgainst !== undefined) payload.points_against = updates.pointsAgainst

      const { error } = await supabase.from("teams").update(payload).eq("id", teamId)
      if (error) throw error
      await loadTeams()
    },
    [loadTeams],
  )

  const deleteTeam = useCallback(
    async (teamId: number) => {
      const { error: matchError } = await supabase
        .from("matches")
        .delete()
        .or(`team1_id.eq.${teamId},team2_id.eq.${teamId}`)

      if (matchError) {
        console.error("Error deleting team matches:", matchError)
      }

      const { error: teamError } = await supabase.from("teams").delete().eq("id", teamId)
      if (teamError) throw teamError

      await Promise.all([loadTeams(), loadMatches()])
    },
    [loadTeams, loadMatches],
  )

  const updateMatch = useCallback(
    async (matchId: number, updates: Partial<Match>) => {
      const payload: Record<string, unknown> = {}
      if (updates.tournamentId !== undefined) payload.tournament_id = updates.tournamentId
      if (updates.team1Score !== undefined) payload.team1_score = updates.team1Score
      if (updates.team2Score !== undefined) payload.team2_score = updates.team2Score
      if (updates.completed !== undefined) payload.completed = updates.completed

      const { error } = await supabase.from("matches").update(payload).eq("id", matchId)
      if (error) throw error
      await loadMatches()
    },
    [loadMatches],
  )

  const createMatches = useCallback(
    async (
      matches: Array<
        Omit<Match, "id" | "tournamentId" | "tournament"> & { tournamentId?: number }
      >,
    ) => {
      const tournamentId = await ensurePrimaryTournament()
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

      const { error } = await supabase.from("matches").insert(matchInserts).select()
      if (error) throw error
      await loadMatches()
    },
    [ensurePrimaryTournament, loadMatches],
  )

  const updateTournamentPhase = useCallback(
    async (phase: TournamentPhase) => {
      const tournamentId = await ensurePrimaryTournament()
      const { error } = await supabase
        .from("tournaments")
        .update({ current_phase: phase })
        .eq("id", tournamentId)

      if (error) throw error

      setCurrentPhase(phase)
      await loadTournaments()
    },
    [ensurePrimaryTournament, loadTournaments],
  )

  const setByeTeamId = useCallback(
    async (teamId: number | null) => {
      const tournamentId = await ensurePrimaryTournament()
      const { error } = await supabase
        .from("tournaments")
        .update({ bye_team_id: teamId })
        .eq("id", tournamentId)

      if (error) throw error
      await Promise.all([loadTournaments(), loadPrimaryTournamentState()])
    },
    [ensurePrimaryTournament, loadTournaments, loadPrimaryTournamentState],
  )

  const resetTournament = useCallback(async () => {
    const tournamentId = await ensurePrimaryTournament()

    const { error: clearByeError } = await supabase
      .from("tournaments")
      .update({ bye_team_id: null })
      .eq("id", tournamentId)
    if (clearByeError) throw clearByeError

    const { error: matchError } = await supabase
      .from("matches")
      .delete()
      .eq("tournament_id", tournamentId)
    if (matchError) throw matchError

    const { error: teamError } = await supabase
      .from("teams")
      .delete()
      .eq("tournament_id", tournamentId)
    if (teamError) throw teamError

    const { error: phaseError } = await supabase
      .from("tournaments")
      .update({ current_phase: "registration" })
      .eq("id", tournamentId)
    if (phaseError) throw phaseError

    setCurrentPhase("registration")
    setByeTeam(null)
    await refreshScopedData()
  }, [ensurePrimaryTournament, refreshScopedData])

  const clearKnockoutMatches = useCallback(async () => {
    const tournamentId = primaryTournamentIdRef.current
    if (!tournamentId) return

    const { error } = await supabase
      .from("matches")
      .delete()
      .eq("tournament_id", tournamentId)
      .eq("phase", "knockout")

    if (error) throw error

    const { error: byeError } = await supabase
      .from("tournaments")
      .update({ bye_team_id: null })
      .eq("id", tournamentId)
    if (byeError) throw byeError

    setByeTeam(null)
    await Promise.all([loadMatches(), loadPrimaryTournamentState()])
  }, [loadMatches, loadPrimaryTournamentState])

  return useMemo(
    () => ({
      tournaments,
      pendingRegistrations,
      teams,
      poolPlayMatches,
      knockoutMatches,
      currentPhase,
      byeTeam,
      primaryTournamentId,
      loading,
      connectionStatus,
      realtimeConnected,
      isPolling,
      createTournament,
      updateTournament,
      deleteTournament,
      setActiveTournament,
      addTeam,
      updateTeam,
      deleteTeam,
      updateMatch,
      createMatches,
      updateTournamentPhase,
      setByeTeamId,
      resetTournament,
      clearKnockoutMatches,
      loadTournaments,
      loadPendingRegistrations,
      loadTeams,
      loadMatches,
    }),
    [
      tournaments,
      pendingRegistrations,
      teams,
      poolPlayMatches,
      knockoutMatches,
      currentPhase,
      byeTeam,
      primaryTournamentId,
      loading,
      connectionStatus,
      realtimeConnected,
      isPolling,
      createTournament,
      updateTournament,
      deleteTournament,
      setActiveTournament,
      addTeam,
      updateTeam,
      deleteTeam,
      updateMatch,
      createMatches,
      updateTournamentPhase,
      setByeTeamId,
      resetTournament,
      clearKnockoutMatches,
      loadTournaments,
      loadPendingRegistrations,
      loadTeams,
      loadMatches,
    ],
  )
}

export function TournamentDataProvider({ children }: { children: ReactNode }) {
  const value = useTournamentDataState()
  return (
    <TournamentDataContext.Provider value={value}>{children}</TournamentDataContext.Provider>
  )
}

export function useTournamentData(): TournamentDataValue {
  const context = useContext(TournamentDataContext)
  if (!context) {
    throw new Error("useTournamentData must be used within TournamentDataProvider")
  }
  return context
}
