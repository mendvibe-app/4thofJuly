"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Volume2, VolumeX } from "lucide-react"
import { useTournamentData } from "@/hooks/use-tournament-data"
import {
  buildAnnouncement,
  formatTeamName,
  formatTournamentStartLabel,
  getCurrentLiveMatch,
  getMatchNumber,
  getNextMatch,
  getTimeLeft,
  getTournamentStartAt,
} from "@/lib/live"

const TTS_STORAGE_KEY = "tournament-tts-enabled"

export default function LiveBanner() {
  const {
    tournaments,
    primaryTournamentId,
    poolPlayMatches,
    knockoutMatches,
    currentPhase,
    realtimeConnected,
    isPolling,
  } = useTournamentData()

  const [now, setNow] = useState(() => new Date())
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(true)
  const [ttsEnabled, setTtsEnabled] = useState(false)
  const longPressTimer = useRef<number | null>(null)

  const tournament = useMemo(
    () => tournaments.find((t) => t.id === primaryTournamentId) ?? tournaments[0],
    [tournaments, primaryTournamentId],
  )

  const tournamentStart = useMemo(
    () => getTournamentStartAt(tournament?.date),
    [tournament?.date],
  )

  const timeLeft = tournamentStart ? getTimeLeft(now, tournamentStart) : null

  const allMatches = useMemo(
    () => [...poolPlayMatches, ...knockoutMatches],
    [poolPlayMatches, knockoutMatches],
  )

  const currentLiveMatch = useMemo(
    () => getCurrentLiveMatch(allMatches, currentPhase),
    [allMatches, currentPhase],
  )

  const nextMatch = useMemo(
    () => getNextMatch(allMatches, currentPhase, currentLiveMatch),
    [allMatches, currentPhase, currentLiveMatch],
  )

  useEffect(() => {
    setSpeechSupported(typeof window !== "undefined" && "speechSynthesis" in window)
    try {
      setTtsEnabled(localStorage.getItem(TTS_STORAGE_KEY) === "true")
    } catch {
      setTtsEnabled(false)
    }
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    return () => {
      if (speechSupported && "speechSynthesis" in window) {
        window.speechSynthesis.cancel()
      }
      if (longPressTimer.current) {
        window.clearTimeout(longPressTimer.current)
      }
    }
  }, [speechSupported])

  const setTtsPreference = (enabled: boolean) => {
    setTtsEnabled(enabled)
    try {
      localStorage.setItem(TTS_STORAGE_KEY, enabled ? "true" : "false")
    } catch {
      // ignore storage failures
    }
    if (!enabled && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  const speakAnnouncement = () => {
    if (!speechSupported || !("speechSynthesis" in window)) return
    if (!ttsEnabled) return

    const announcement = buildAnnouncement(currentLiveMatch, nextMatch)
    if (!announcement) return

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(announcement)
    utterance.rate = 0.85
    utterance.volume = 1
    utterance.pitch = 1
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  const handleSpeakerClick = () => {
    if (!ttsEnabled) {
      setTtsPreference(true)
      return
    }
    speakAnnouncement()
  }

  const handleSpeakerPointerDown = () => {
    if (!ttsEnabled) return
    longPressTimer.current = window.setTimeout(() => {
      setTtsPreference(false)
    }, 600)
  }

  const clearLongPress = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const updateModeLabel = realtimeConnected
    ? "Live updates on"
    : isPolling
      ? "Updating every 30s"
      : "Connected"

  // Countdown while still in registration and start is in the future
  if (timeLeft && currentPhase === "registration" && tournamentStart) {
    return (
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg border-b-2 border-red-800">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3 gap-3">
            <div>
              <h2 className="text-lg font-bold">
                {tournament?.name || "4th of July Invitational"}
              </h2>
              <p className="text-red-100 text-sm">Harbor Way Soccer Tennis</p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wide bg-white/15 px-2 py-1 rounded">
              {updateModeLabel}
            </span>
          </div>

          <div className="text-center">
            <div className="text-xs font-bold text-red-200 mb-2">TOURNAMENT STARTS IN</div>
            <div className="flex items-center justify-center gap-3 sm:gap-4">
              {(
                [
                  ["DAYS", timeLeft.days],
                  ["HOURS", timeLeft.hours],
                  ["MINS", timeLeft.minutes],
                  ["SECS", timeLeft.seconds],
                ] as const
              ).map(([label, value], index) => (
                <div key={label} className="flex items-center gap-3 sm:gap-4">
                  {index > 0 && <div className="text-xl font-bold text-white">:</div>}
                  <div className="bg-white/20 rounded-lg px-3 py-2 min-w-[56px]">
                    <div className="text-2xl font-bold">
                      {label === "DAYS" ? value : value.toString().padStart(2, "0")}
                    </div>
                    <div className="text-xs font-medium text-red-200">{label}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-sm text-red-100">
              {formatTournamentStartLabel(tournamentStart)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (currentPhase === "registration" || (!currentLiveMatch && !nextMatch)) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg border-b-2 border-red-800">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2 gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold truncate">
              {tournament?.name || "4th of July Invitational"}
            </h2>
            <p className="text-red-100 text-sm flex items-center gap-2 flex-wrap">
              <span>Harbor Way Soccer Tennis</span>
              <span className="text-[10px] font-bold uppercase tracking-wide bg-white/15 px-2 py-0.5 rounded">
                {updateModeLabel}
              </span>
            </p>
          </div>

          {speechSupported && (currentLiveMatch || nextMatch) && (
            <button
              type="button"
              onClick={handleSpeakerClick}
              onPointerDown={handleSpeakerPointerDown}
              onPointerUp={clearLongPress}
              onPointerLeave={clearLongPress}
              disabled={isSpeaking}
              className={`
                p-2 rounded-lg transition-all duration-200 flex items-center justify-center touch-target
                ${
                  isSpeaking
                    ? "bg-green-500 text-white"
                    : ttsEnabled
                      ? "bg-white/20 text-white hover:bg-white/30"
                      : "bg-black/20 text-white/80 hover:bg-black/30"
                }
              `}
              title={
                !ttsEnabled
                  ? "Announcements off — tap to enable"
                  : isSpeaking
                    ? "Speaking..."
                    : "Tap to announce. Long-press to mute."
              }
              aria-label={
                !ttsEnabled
                  ? "Enable score announcements"
                  : "Announce live scores"
              }
            >
              {isSpeaking ? (
                <div className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5 animate-pulse" />
                  <span className="text-xs font-medium hidden sm:inline">Speaking...</span>
                </div>
              ) : ttsEnabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {currentLiveMatch ? (
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs font-bold bg-green-500 px-2 py-1 rounded">LIVE</span>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-medium text-white truncate">
                  Match {getMatchNumber(allMatches, currentLiveMatch)}:{" "}
                  {formatTeamName(currentLiveMatch.team1.name)} vs{" "}
                  {formatTeamName(currentLiveMatch.team2.name)}
                </span>
                <span className="text-lg sm:text-xl font-bold bg-white/20 px-2 py-1 rounded flex-shrink-0">
                  {currentLiveMatch.team1Score} - {currentLiveMatch.team2Score}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-red-100 text-sm">No live matches</span>
            </div>
          )}

          {nextMatch && (
            <div className="flex items-center gap-2 text-left sm:text-right flex-shrink-0">
              <div>
                <div className="text-xs font-bold text-red-200">NEXT UP</div>
                <div className="text-sm font-medium">
                  Match {getMatchNumber(allMatches, nextMatch)}:{" "}
                  {formatTeamName(nextMatch.team1.name)} vs{" "}
                  {formatTeamName(nextMatch.team2.name)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
