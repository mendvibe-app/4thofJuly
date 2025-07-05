"use client"

import { useState, useEffect } from "react"
import { Volume2, VolumeX } from "lucide-react"
import { useTournamentData } from "@/hooks/use-tournament-data"
import type { Match } from "@/types/tournament"

export default function LiveBanner() {
  const { poolPlayMatches, knockoutMatches, currentPhase } = useTournamentData()
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  } | null>(null)
  
  // TTS state management
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(true)

  // Tournament start time: July 5th, 2025 at 10:00 AM Mountain Time (MDT = UTC-6)
  const tournamentStart = new Date('2025-07-05T10:00:00-06:00')

  // Check speech synthesis support on component mount
  useEffect(() => {
    const checkSpeechSupport = () => {
      if (!('speechSynthesis' in window)) {
        setSpeechSupported(false)
        console.warn('Speech synthesis not supported in this browser')
      }
    }
    
    checkSpeechSupport()
  }, [])

  // Countdown timer effect
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date()
      const difference = tournamentStart.getTime() - now.getTime()

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)

        setTimeLeft({ days, hours, minutes, seconds })
      } else {
        setTimeLeft(null)
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [])

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (speechSupported && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [speechSupported])

  // Combine all matches and sort by creation time to find current/next
  const allMatches = [...poolPlayMatches, ...knockoutMatches]
  
  // Find current live match (incomplete match with scores = likely in progress)
  const getCurrentLiveMatch = (): Match | null => {
    if (currentPhase === "registration") return null
    
    const incompleteMatches = allMatches.filter(match => !match.completed)
    if (incompleteMatches.length === 0) return null
    
    // Prioritize matches with scores (likely in progress)
    const matchesWithScores = incompleteMatches.filter(match => 
      match.team1Score > 0 || match.team2Score > 0
    )
    
    if (matchesWithScores.length > 0) {
      // Return the first match with scores (by creation order)
      return matchesWithScores.sort((a, b) => a.id - b.id)[0]
    }
    
    // If no matches have scores, return the first incomplete match
    return incompleteMatches.sort((a, b) => a.id - b.id)[0]
  }

  // Find next upcoming match
  const getNextMatch = (): Match | null => {
    if (currentPhase === "registration") return null
    
    const currentLive = getCurrentLiveMatch()
    const incompleteMatches = allMatches
      .filter(match => !match.completed)
      .filter(match => currentLive ? match.id !== currentLive.id : true)
    
    if (incompleteMatches.length === 0) return null
    
    // Return the next match (could be by creation order or round)
    return incompleteMatches.sort((a, b) => {
      // Sort by phase priority (pool-play first, then knockout)
      if (a.phase !== b.phase) {
        return a.phase === "pool-play" ? -1 : 1
      }
      // Then by round
      if (a.round !== b.round) {
        return (a.round || 0) - (b.round || 0)
      }
      // Then by creation order (id)
      return a.id - b.id
    })[0]
  }

  // Generate TTS announcement text
  const generateAnnouncement = (currentMatch: Match | null, nextMatch: Match | null): string => {
    let announcement = ""
    
    if (currentMatch) {
      // Use full team names for clarity in speech
      const team1Name = currentMatch.team1.name
      const team2Name = currentMatch.team2.name
      const team1Score = currentMatch.team1Score
      const team2Score = currentMatch.team2Score
      
      announcement += `Live game: ${team1Name} ${team1Score}, ${team2Name} ${team2Score}`
    }
    
    if (nextMatch) {
      const nextTeam1Name = nextMatch.team1.name
      const nextTeam2Name = nextMatch.team2.name
      
      if (announcement) {
        announcement += `. Next up: ${nextTeam1Name} versus ${nextTeam2Name}`
      } else {
        announcement = `Next up: ${nextTeam1Name} versus ${nextTeam2Name}`
      }
    }
    
    return announcement
  }

  // Text-to-Speech function
  const speakAnnouncement = () => {
    if (!speechSupported || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported')
      return
    }
    
    const currentMatch = getCurrentLiveMatch()
    const nextMatch = getNextMatch()
    
    if (!currentMatch && !nextMatch) {
      console.warn('No matches to announce')
      return
    }
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel()
    
    const announcement = generateAnnouncement(currentMatch, nextMatch)
    
    if (!announcement) {
      console.warn('No announcement to make')
      return
    }
    
    console.log('📢 Announcing:', announcement)
    
    const utterance = new SpeechSynthesisUtterance(announcement)
    
    // Configure speech settings
    utterance.rate = 0.8      // Slightly slower for clarity
    utterance.volume = 1.0    // Full volume
    utterance.pitch = 1.0     // Normal pitch
    // Use default system voice
    
    // Handle speech events
    utterance.onstart = () => {
      setIsSpeaking(true)
      console.log('🎤 Speech started')
    }
    
    utterance.onend = () => {
      setIsSpeaking(false)
      console.log('🎤 Speech ended')
    }
    
    utterance.onerror = (event) => {
      setIsSpeaking(false)
      console.error('🎤 Speech error:', event.error)
    }
    
    // Start speaking
    window.speechSynthesis.speak(utterance)
  }

  const currentLiveMatch = getCurrentLiveMatch()
  const nextMatch = getNextMatch()

  // Show countdown if tournament hasn't started AND we're still in registration phase
  if (timeLeft && currentPhase === "registration") {
    return (
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg border-b-2 border-red-800">
        <div className="px-4 py-4">
          {/* Tournament Header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold">US 4th of July Invitational</h2>
              <p className="text-red-100 text-sm">16th Annual - Harbor Way Soccer Tennis</p>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="text-center">
            <div className="text-xs font-bold text-red-200 mb-2">TOURNAMENT STARTS IN</div>
            <div className="flex items-center justify-center gap-4">
              <div className="bg-white/20 rounded-lg px-3 py-2 min-w-[60px]">
                <div className="text-2xl font-bold">{timeLeft.days}</div>
                <div className="text-xs font-medium text-red-200">DAYS</div>
              </div>
              <div className="text-xl font-bold text-white">:</div>
              <div className="bg-white/20 rounded-lg px-3 py-2 min-w-[60px]">
                <div className="text-2xl font-bold">{timeLeft.hours.toString().padStart(2, '0')}</div>
                <div className="text-xs font-medium text-red-200">HOURS</div>
              </div>
              <div className="text-xl font-bold text-white">:</div>
              <div className="bg-white/20 rounded-lg px-3 py-2 min-w-[60px]">
                <div className="text-2xl font-bold">{timeLeft.minutes.toString().padStart(2, '0')}</div>
                <div className="text-xs font-medium text-red-200">MINS</div>
              </div>
              <div className="text-xl font-bold text-white">:</div>
              <div className="bg-white/20 rounded-lg px-3 py-2 min-w-[60px]">
                <div className="text-2xl font-bold">{timeLeft.seconds.toString().padStart(2, '0')}</div>
                <div className="text-xs font-medium text-red-200">SECS</div>
              </div>
            </div>
            <div className="mt-3 text-sm text-red-100">
              📅 Saturday, July 5th • 🕙 10:00 AM • 📍 Fort Collins, CO 80524
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Don't show banner if no matches to display or in registration
  if (currentPhase === "registration" || (!currentLiveMatch && !nextMatch)) {
    return null
  }

  const formatTeamName = (teamName: string) => {
    // Truncate long team names for better display
    return teamName.length > 15 ? `${teamName.substring(0, 12)}...` : teamName
  }

  const getMatchNumber = (match: Match): number => {
    // Use consistent numbering based on creation order (same as pool play component)
    const allMatchesByCreation = allMatches.sort((a, b) => a.id - b.id)
    return allMatchesByCreation.findIndex(m => m.id === match.id) + 1
  }

  return (
    <div className="bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg border-b-2 border-red-800">
      <div className="px-4 py-3">
        {/* Tournament Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-lg font-bold">US 4th of July Invitational</h2>
            <p className="text-red-100 text-sm">16th Annual - Harbor Way Soccer Tennis</p>
          </div>
          
          {/* Speaker Button */}
          {speechSupported && (currentLiveMatch || nextMatch) && (
            <button
              onClick={speakAnnouncement}
              disabled={isSpeaking}
              className={`
                p-2 rounded-lg transition-all duration-200 flex items-center justify-center
                ${isSpeaking 
                  ? 'bg-green-500 text-white' 
                  : 'bg-white/20 text-white hover:bg-white/30 active:bg-white/40'
                }
                ${!speechSupported ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              title={
                !speechSupported 
                  ? 'Speech not supported in this browser'
                  : isSpeaking 
                    ? 'Speaking...' 
                    : 'Announce live scores'
              }
            >
              {isSpeaking ? (
                <div className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5 animate-pulse" />
                  <span className="text-xs font-medium">Speaking...</span>
                </div>
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
          )}
        </div>

        {/* Live Match and Next Up */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Current Live Match */}
          {currentLiveMatch ? (
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-bold bg-green-500 px-2 py-1 rounded">LIVE</span>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-medium text-white truncate">
                  {currentLiveMatch.completed ? 'Game' : 'Match'} {getMatchNumber(currentLiveMatch)}: {formatTeamName(currentLiveMatch.team1.name)} vs {formatTeamName(currentLiveMatch.team2.name)}
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

          {/* Next Up */}
          {nextMatch && (
            <div className="flex items-center gap-2 text-right flex-shrink-0">
              <div>
                <div className="text-xs font-bold text-red-200">NEXT UP</div>
                <div className="text-sm font-medium">
                  {nextMatch.completed ? 'Game' : 'Match'} {getMatchNumber(nextMatch)}: {formatTeamName(nextMatch.team1.name)} vs {formatTeamName(nextMatch.team2.name)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 