"use client"

import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import PublicTeamRegistration from "@/components/public-team-registration"
import { useTournamentData } from "@/hooks/use-tournament-data"

export default function RegisterPage() {
  const router = useRouter()
  const {
    tournaments,
    primaryTournamentId,
    loadTournaments,
    loadPendingRegistrations,
  } = useTournamentData()

  const handleRegistrationSubmitted = async () => {
    await Promise.all([loadTournaments(), loadPendingRegistrations()])
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="sticky-header usa-header-gradient">
        <div className="safe-area-top">
          <div className="px-4 py-6">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/")}
                className="text-white hover:bg-white/10 outdoor-text"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Tournament
              </Button>

              <h1 className="text-xl font-black text-white">Team Registration</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 pb-24">
        <div className="max-w-2xl mx-auto mt-8">
          <PublicTeamRegistration
            tournaments={tournaments}
            primaryTournamentId={primaryTournamentId}
            onRegistrationSubmitted={handleRegistrationSubmitted}
          />
        </div>
      </main>
    </div>
  )
}
