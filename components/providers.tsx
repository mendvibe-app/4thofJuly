"use client"

import { TournamentDataProvider } from "@/hooks/use-tournament-data"

export function Providers({ children }: { children: React.ReactNode }) {
  return <TournamentDataProvider>{children}</TournamentDataProvider>
}
