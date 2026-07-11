import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Service-role client for server routes only.
 * Never import this from client components.
 */
export function createServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      "Server Supabase client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    )
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function isAdminApiEnabled(): boolean {
  return process.env.ADMIN_API_ENABLED === "true"
}
