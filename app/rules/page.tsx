"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Trophy, Users, Clock, AlertCircle, Flag, Play, BarChart3 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTournamentData } from "@/hooks/use-tournament-data"

export default function RulesPage() {
  const router = useRouter()
  const { teams, poolPlayMatches, currentPhase, updateTournamentPhase } = useTournamentData()

  const navigationItems = [
    { id: "registration", label: "Teams", icon: Users, badge: teams.length },
    { id: "pool-play", label: "Pool Play", icon: Play, badge: poolPlayMatches.filter(m => m.completed).length },
    { id: "knockout", label: "Bracket", icon: Trophy, badge: 0 },
    { id: "standings", label: "Standings", icon: BarChart3, badge: 0 },
    { id: "rules", label: "Rules", icon: Flag, current: true },
  ]

  return (
    <div className="min-h-screen bg-slate-900 relative">
      {/* Patriotic Header */}
      <header className="sticky-header usa-header-gradient">
        <div className="safe-area-top">
          <div className="px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 text-center">
                <h1 className="text-2xl sm:text-3xl font-black text-white">
                  🇺🇸 Tournament Rules 🇺🇸
                </h1>
                <p className="text-lg font-semibold text-white opacity-90">
                  16th Annual • Harbor Way Soccer Tennis
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 pb-24">

        {/* Page Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 text-3xl font-bold text-white mb-6 outdoor-text">
            <BookOpen className="w-8 h-8 text-blue-400" />
            📋 Tournament Rules & Regulations
          </div>
        </div>

        {/* Rules Content */}
        <div className="space-y-6">
          {/* Quick Reference */}
          <Card className="border-2 border-blue-400 bg-slate-800 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-red-600 to-blue-600">
              <CardTitle className="flex items-center gap-3 text-white outdoor-text">
                <AlertCircle className="w-6 h-6 text-yellow-400" />
                🚨 Quick Reference
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div className="bg-slate-700 p-4 rounded-lg border-2 border-blue-400">
                  <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <h3 className="font-bold text-white outdoor-text">Format</h3>
                  <p className="text-sm text-blue-300 outdoor-text">Pool Play + Knockout</p>
                </div>
                <div className="bg-slate-700 p-4 rounded-lg border-2 border-blue-400">
                  <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <h3 className="font-bold text-white outdoor-text">Entry Fee</h3>
                  <p className="text-sm text-blue-300 outdoor-text">$20/player, $40/team</p>
                </div>
                <div className="bg-slate-700 p-4 rounded-lg border-2 border-blue-400">
                  <div className="text-2xl mb-2">🍺</div>
                  <h3 className="font-bold text-white outdoor-text">Beer Required</h3>
                  <p className="text-sm text-blue-300 outdoor-text">24-pack per team</p>
                </div>
                <div className="bg-slate-700 p-4 rounded-lg border-2 border-red-400">
                  <div className="text-2xl mb-2">🦅</div>
                  <h3 className="font-bold text-red-400 outdoor-text">BEER IN HAND!</h3>
                  <p className="text-sm text-red-300 font-bold outdoor-text">ALWAYS!</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tournament Format */}
          <Card className="border-2 border-red-400 bg-slate-800 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-red-600 to-blue-600">
              <CardTitle className="flex items-center gap-3 text-white outdoor-text">
                <Trophy className="w-6 h-6 text-yellow-400" />
                🏆 Tournament Format
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="bg-red-900 border-2 border-red-400 p-4 rounded-lg mb-4">
                  <h3 className="font-bold text-red-300 mb-2 flex items-center gap-2 outdoor-text">
                    🦅 <span>BEER IN HAND EVENT!</span>
                  </h3>
                  <p className="text-red-200 font-semibold outdoor-text">
                    This is a beer in hand event!!! Always has been, always should be!!!! 
                    It's not official soccer tennis!!!! It's a version of Soccer Tennis where you play with a beer in your hand 
                    celebrating the best country in the world, The United States of America! 🦅
                  </p>
                  <p className="text-red-300 mt-2 outdoor-text">
                    <strong>It can be non-alcoholic beer, but you MUST play with a beer in hand or you don't have to play in our tournament!</strong>
                  </p>
                </div>
                
                <div>
                  <h3 className="font-bold text-white mb-3 outdoor-text">🎟️ Tournament Information</h3>
                  <ul className="space-y-2 text-blue-200">
                    <li className="outdoor-text"><strong>Attendance:</strong> Free for all spectators</li>
                    <li className="outdoor-text"><strong>Entry Fee:</strong> $20 per player, $40 per team</li>
                    <li className="outdoor-text"><strong>Beverage Requirement:</strong> Each team must bring a 24-pack of beer</li>
                    <li className="outdoor-text"><strong>Food:</strong> Provided for all players and spectators</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-bold text-white mb-3 outdoor-text">🏆 Tournament Structure</h3>
                  <p className="text-blue-200 mb-2 outdoor-text">
                    The tournament consists of two phases:
                  </p>
                  <ul className="space-y-1 text-blue-200 ml-4">
                    <li className="outdoor-text"><strong>Pool Play:</strong> All teams play each other in round-robin format</li>
                    <li className="outdoor-text"><strong>Knockout Bracket:</strong> Single elimination based on pool play seeding</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-bold text-white mb-3 outdoor-text">⚠️ BE READY TO PLAY!</h3>
                  <p className="text-blue-200 font-semibold outdoor-text">
                    It's your responsibility to know when your next game is. Be ready to jump on right after a game is wrapped!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Game Rules */}
          <Card className="border-2 border-green-400 bg-slate-800 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-red-600 to-blue-600">
              <CardTitle className="flex items-center gap-3 text-white outdoor-text">
                <BookOpen className="w-6 h-6 text-yellow-400" />
                ⚽ Game Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="bg-blue-900 border-2 border-blue-400 p-4 rounded-lg mb-4">
                  <h3 className="font-bold text-blue-300 mb-2 flex items-center gap-2 outdoor-text">
                    🍺 <span>BEER IN HAND RULE</span>
                  </h3>
                  <p className="text-blue-200 font-semibold outdoor-text">
                    Games should ALWAYS be played with a drink (beer/cocktail) in hand. If your beer in hand gets knocked out, 
                    you have to drink the remainder, refill, and it is a POINT FOR THE OTHER TEAM.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-bold text-white mb-3 outdoor-text">⚽ Pool Play Game Rules</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-blue-300 mb-2 outdoor-text">Basic Play</h4>
                      <ul className="space-y-1 text-sm text-blue-200">
                        <li className="outdoor-text"><strong>Line is In:</strong> Any ball that lands on the line is considered in play</li>
                        <li className="outdoor-text"><strong>Bounce Rule:</strong> One bounce per side is allowed at any time during possession</li>
                        <li className="outdoor-text"><strong>Unlimited Touches:</strong> Players can touch the ball as many times as needed to get it over the net</li>
                        <li className="outdoor-text"><strong>Stay on Your Side:</strong> Players must remain on their own side of the net</li>
                        <li className="outdoor-text"><strong>Net Touch Rule:</strong> The ball can touch the net and remain in play</li>
                        <li className="outdoor-text"><strong>Ball Play:</strong> Normal soccer rules apply for body parts that can contact the ball</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-300 mb-2 outdoor-text">Serving Rules</h4>
                      <ul className="space-y-1 text-sm text-blue-200">
                        <li className="outdoor-text"><strong>Gentleman's Serve:</strong> Serve should be delivered in a respectful manner</li>
                        <li className="outdoor-text"><strong>Alternating Serve:</strong> Teams alternate serves after each point</li>
                        <li className="outdoor-text"><strong>Serve from Behind the Line:</strong> Players can choose the type of serve but must serve from behind the designated line</li>
                        <li className="outdoor-text"><strong>Serve Bounce:</strong> The ball must bounce once after the serve. Serving by volleying out of the hands or heading the ball is not allowed</li>
                        <li className="outdoor-text"><strong>First Serve Decision:</strong> Use Rock-Paper-Scissors (best of three) to determine which team serves first</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-bold text-white mb-3 outdoor-text">🏆 Scoring & Net Rules</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-blue-300 mb-2 outdoor-text">Scoring</h4>
                      <ul className="space-y-1 text-sm text-blue-200">
                        <li className="outdoor-text"><strong>Winning Point:</strong> First team to reach 11 points and win by 2 points wins the game</li>
                        <li className="outdoor-text"><strong>Trick Shots:</strong> Encouraged for entertainment but do not affect the score</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-300 mb-2 outdoor-text">Net & Boundaries</h4>
                      <ul className="space-y-1 text-sm text-blue-200">
                        <li className="outdoor-text"><strong>Net Touch:</strong> Players cannot touch the net while playing the ball</li>
                        <li className="outdoor-text"><strong>Accidental Net Touches:</strong> Not allowed</li>
                        <li className="outdoor-text"><strong>Court Boundaries:</strong> All designated lines mark the playing area</li>
                        <li className="outdoor-text"><strong>Out of Bounds:</strong> Ball must land within the court boundaries</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-white mb-3 outdoor-text">🎯 Special Rules</h3>
                  <ul className="space-y-1 text-sm text-blue-200">
                    <li className="outdoor-text"><strong>Beer Rule:</strong> If beer is knocked from hand, opposing team gets a point</li>
                    <li className="outdoor-text"><strong>Fair Play:</strong> Respect all players and officials</li>
                    <li className="outdoor-text"><strong>Safety First:</strong> Report any unsafe conditions immediately</li>
                    <li className="outdoor-text"><strong>Have Fun:</strong> This is America's party! 🇺🇸</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact & Emergency */}
          <Card className="border-2 border-yellow-400 bg-slate-800 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-red-600 to-blue-600">
              <CardTitle className="flex items-center gap-3 text-white outdoor-text">
                <AlertCircle className="w-6 h-6 text-yellow-400" />
                📞 Important Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-white mb-3 outdoor-text">🏥 Emergency & Safety</h3>
                  <ul className="space-y-2 text-blue-200">
                    <li className="outdoor-text"><strong>Emergency:</strong> Call 911 immediately</li>
                    <li className="outdoor-text"><strong>Tournament Director:</strong> Available on-site</li>
                    <li className="outdoor-text"><strong>First Aid:</strong> Station located near registration</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-bold text-white mb-3 outdoor-text">🇺🇸 Celebration Guidelines</h3>
                  <ul className="space-y-2 text-blue-200">
                    <li className="outdoor-text"><strong>Patriotic Spirit:</strong> Encouraged and celebrated!</li>
                    <li className="outdoor-text"><strong>Responsible Drinking:</strong> Know your limits</li>
                    <li className="outdoor-text"><strong>Good Sportsmanship:</strong> Required at all times</li>
                    <li className="outdoor-text"><strong>Clean Up:</strong> Leave no trace - keep America beautiful</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Navigation - Mobile First */}
      <nav className="bottom-nav">
        <div className="flex">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = item.current || currentPhase === item.id
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "rules") {
                    // Already on rules page
                    return
                  }
                  if (item.id === "standings") {
                    router.push("/standings")
                    return
                  }
                  router.push("/")
                  setTimeout(() => updateTournamentPhase(item.id as any), 100)
                }}
                className={`
                  bottom-nav-item relative
                  ${isActive ? 'active' : ''}
                `}
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-sm font-medium">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center border-2 border-white">
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
} 