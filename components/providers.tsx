"use client"

import { AdminProvider } from "@/hooks/use-admin"
import { TournamentDataProvider } from "@/hooks/use-tournament-data"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <TournamentDataProvider>{children}</TournamentDataProvider>
    </AdminProvider>
  )
}
