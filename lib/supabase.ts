import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

export type Database = {
  public: {
    Tables: {
      teams: {
        Row: {
          id: number
          name: string
          players: string[]
          paid: boolean
          wins: number
          losses: number
          points_for: number
          points_against: number
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          players: string[]
          paid?: boolean
          wins?: number
          losses?: number
          points_for?: number
          points_against?: number
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          players?: string[]
          paid?: boolean
          wins?: number
          losses?: number
          points_for?: number
          points_against?: number
          created_at?: string
        }
      }
      matches: {
        Row: {
          id: number
          team1_id: number
          team2_id: number
          team1_score: number
          team2_score: number
          completed: boolean
          phase: "pool-play" | "knockout"
          round: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          team1_id: number
          team2_id: number
          team1_score?: number
          team2_score?: number
          completed?: boolean
          phase: "pool-play" | "knockout"
          round?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          team1_id?: number
          team2_id?: number
          team1_score?: number
          team2_score?: number
          completed?: boolean
          phase?: "pool-play" | "knockout"
          round?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      tournament_settings: {
        Row: {
          id: number
          current_phase: "registration" | "pool-play" | "knockout"
          bye_team_id: number | null
          updated_at: string
        }
        Insert: {
          id?: number
          current_phase?: "registration" | "pool-play" | "knockout"
          bye_team_id?: number | null
          updated_at?: string
        }
        Update: {
          id?: number
          current_phase?: "registration" | "pool-play" | "knockout"
          bye_team_id?: number | null
          updated_at?: string
        }
      }
    }
  }
}
