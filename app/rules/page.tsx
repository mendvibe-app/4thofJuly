"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, BookOpen, Trophy, Users, Clock, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export default function RulesPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 via-white to-blue-100 p-2 sm:p-4 relative overflow-hidden">
      {/* Patriotic background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-red-500 via-white to-blue-500"></div>
        <div className="absolute top-16 left-0 w-full h-32 bg-gradient-to-r from-blue-500 via-white to-red-500"></div>
        <div className="absolute top-32 left-0 w-full h-32 bg-gradient-to-r from-red-500 via-white to-blue-500"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-50 bg-transparent min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />🏠 Back to Tournament
          </Button>
        </div>

        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-red-600">
            4th of July Invitational
          </h1>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-white" style={{ textShadow: '2px 2px 0px #000000, -2px -2px 0px #000000, 2px -2px 0px #000000, -2px 2px 0px #000000' }}>
            16th Annual
          </h2>
          <p className="text-blue-600 font-medium text-lg mb-4">Harbor Way Soccer Tennis Tournament</p>
          
          <div className="flex items-center justify-center gap-2 text-2xl font-bold text-gray-800">
            <BookOpen className="w-8 h-8 text-blue-600" />
            📋 Tournament Rules & Regulations
          </div>
        </div>

        {/* Rules Content */}
        <div className="space-y-6">
          {/* Quick Reference */}
          <Card className="border-2 border-blue-300 bg-gradient-to-r from-blue-50 via-white to-red-50 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-100 to-red-100">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <AlertCircle className="w-5 h-5 text-red-600" />
                🚨 Quick Reference
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                 <div className="bg-white p-4 rounded-lg border border-blue-200">
                   <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                   <h3 className="font-bold text-gray-800">Format</h3>
                   <p className="text-sm text-gray-600">Pool Play + Knockout</p>
                 </div>
                 <div className="bg-white p-4 rounded-lg border border-blue-200">
                   <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                   <h3 className="font-bold text-gray-800">Entry Fee</h3>
                   <p className="text-sm text-gray-600">$20/player, $40/team</p>
                 </div>
                 <div className="bg-white p-4 rounded-lg border border-blue-200">
                   <div className="text-2xl mb-2">🍺</div>
                   <h3 className="font-bold text-gray-800">Beer Required</h3>
                   <p className="text-sm text-gray-600">24-pack per team</p>
                 </div>
                 <div className="bg-white p-4 rounded-lg border border-blue-200">
                   <div className="text-2xl mb-2">🦅</div>
                   <h3 className="font-bold text-gray-800">BEER IN HAND!</h3>
                   <p className="text-sm text-gray-600 font-bold">ALWAYS!</p>
                 </div>
               </div>
            </CardContent>
          </Card>

          {/* Tournament Format */}
          <Card className="border-2 border-red-300 bg-gradient-to-br from-red-50 to-white shadow-lg">
            <CardHeader className="bg-gradient-to-r from-red-100 to-blue-100">
              <CardTitle className="flex items-center gap-2 text-red-900">
                <Trophy className="w-5 h-5 text-blue-600" />
                🏆 Tournament Format
              </CardTitle>
            </CardHeader>
                         <CardContent className="p-6">
               <div className="space-y-4">
                 <div className="bg-red-50 p-4 rounded-lg border border-red-200 mb-4">
                   <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                     🦅 <span>BEER IN HAND EVENT!</span>
                   </h3>
                                        <p className="text-red-700 font-semibold">
                       This is a beer in hand event!!! Always has been, always should be!!!! 
                       It's not official soccer tennis!!!! It's a version of Soccer Tennis where you play with a beer in your hand 
                       celebrating the best country in the world, The United States of America! 🦅
                     </p>
                   <p className="text-red-600 mt-2">
                     <strong>It can be non-alcoholic beer, but you MUST play with a beer in hand or you don't have to play in our tournament!</strong>
                   </p>
                 </div>
                 
                 <div>
                   <h3 className="font-bold text-gray-800 mb-3">🎟️ Tournament Information</h3>
                   <ul className="space-y-2 text-gray-700">
                     <li><strong>Attendance:</strong> Free for all spectators</li>
                     <li><strong>Entry Fee:</strong> $20 per player, $40 per team</li>
                     <li><strong>Beverage Requirement:</strong> Each team must bring a 24-pack of beer</li>
                     <li><strong>Food:</strong> Provided for all players and spectators</li>
                   </ul>
                 </div>
                 
                 <div>
                   <h3 className="font-bold text-gray-800 mb-3">🏆 Tournament Structure</h3>
                   <p className="text-gray-700 mb-2">
                     The tournament consists of two phases:
                   </p>
                   <ul className="space-y-1 text-gray-700 ml-4">
                     <li><strong>Pool Play:</strong> All teams play each other in round-robin format</li>
                     <li><strong>Knockout Bracket:</strong> Single elimination based on pool play seeding</li>
                   </ul>
                 </div>
                 
                 <div>
                   <h3 className="font-bold text-gray-800 mb-3">⚠️ BE READY TO PLAY!</h3>
                   <p className="text-gray-700 font-semibold">
                     It's your responsibility to know when your next game is. Be ready to jump on right after a game is wrapped!
                   </p>
                 </div>
               </div>
             </CardContent>
          </Card>

          {/* Game Rules */}
          <Card className="border-2 border-green-300 bg-gradient-to-br from-green-50 to-white shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-100 to-blue-100">
              <CardTitle className="flex items-center gap-2 text-green-900">
                <BookOpen className="w-5 h-5 text-blue-600" />
                ⚽ Game Rules
              </CardTitle>
            </CardHeader>
                         <CardContent className="p-6">
               <div className="space-y-4">
                 <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
                   <h3 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
                     🍺 <span>BEER IN HAND RULE</span>
                   </h3>
                   <p className="text-yellow-700 font-semibold">
                     Games should ALWAYS be played with a drink (beer/cocktail) in hand. If your beer in hand gets knocked out, 
                     you have to drink the remainder, refill, and it is a POINT FOR THE OTHER TEAM.
                   </p>
                 </div>
                 
                 <div>
                   <h3 className="font-bold text-gray-800 mb-3">⚽ Pool Play Game Rules</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <h4 className="font-semibold text-gray-700 mb-2">Basic Play</h4>
                       <ul className="space-y-1 text-sm text-gray-600">
                         <li><strong>Line is In:</strong> Any ball that lands on the line is considered in play</li>
                         <li><strong>Bounce Rule:</strong> One bounce per side is allowed at any time during possession</li>
                         <li><strong>Unlimited Touches:</strong> Players can touch the ball as many times as needed to get it over the net</li>
                         <li><strong>Stay on Your Side:</strong> Players must remain on their own side of the net</li>
                         <li><strong>Net Touch Rule:</strong> The ball can touch the net and remain in play</li>
                         <li><strong>Ball Play:</strong> Normal soccer rules apply for body parts that can contact the ball</li>
                       </ul>
                     </div>
                     <div>
                       <h4 className="font-semibold text-gray-700 mb-2">Serving Rules</h4>
                       <ul className="space-y-1 text-sm text-gray-600">
                         <li><strong>Gentleman's Serve:</strong> Serve should be delivered in a respectful manner</li>
                         <li><strong>Alternating Serve:</strong> Teams alternate serves after each point</li>
                         <li><strong>Serve from Behind the Line:</strong> Players can choose the type of serve but must serve from behind the designated line</li>
                         <li><strong>Serve Bounce:</strong> The ball must bounce once after the serve. Serving by volleying out of the hands or heading the ball is not allowed</li>
                         <li><strong>First Serve Decision:</strong> Use Rock-Paper-Scissors (best of three) to determine which team serves first</li>
                       </ul>
                     </div>
                   </div>
                 </div>
                 
                 <div>
                   <h3 className="font-bold text-gray-800 mb-3">🏆 Scoring & Net Rules</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <h4 className="font-semibold text-gray-700 mb-2">Scoring</h4>
                       <ul className="space-y-1 text-sm text-gray-600">
                         <li><strong>Winning Point:</strong> First team to reach 11 points and win by 2 points wins the game</li>
                         <li><strong>Trick Shots:</strong> Encouraged for entertainment but do not affect the score</li>
                       </ul>
                     </div>
                     <div>
                       <h4 className="font-semibold text-gray-700 mb-2">Net & Boundaries</h4>
                       <ul className="space-y-1 text-sm text-gray-600">
                         <li><strong>Net Touch:</strong> Players cannot touch the net while playing the ball</li>
                         <li><strong>Accidental Net Touches:</strong> Not allowed</li>
                         <li><strong>Diving Headers:</strong> Allowed over the net as long as the player doesn't touch the net or land on the other team's side</li>
                         <li><strong>Pole Rule:</strong> Poles are considered part of the net. A ball bouncing off a pole earns the side it lands on an extra bounce</li>
                       </ul>
                     </div>
                   </div>
                 </div>
                 
                 <div>
                   <h3 className="font-bold text-gray-800 mb-3">🌳 Live Ball Rule</h3>
                   <p className="text-gray-700">
                     The ball is live if it bounces off a tree, cloud, chair, person, squirrel, etc. 
                     If both teams and officials determine true interference, the point can be replayed.
                   </p>
                 </div>
               </div>
             </CardContent>
          </Card>

          {/* Conduct & Sportsmanship */}
          <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-white shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-100 to-blue-100">
                             <CardTitle className="flex items-center gap-2 text-purple-900">
                 <Users className="w-5 h-5 text-blue-600" />
                 🥊 Bracket Play & Officiating
               </CardTitle>
            </CardHeader>
                         <CardContent className="p-6">
               <div className="space-y-4">
                 <div>
                   <h3 className="font-bold text-gray-800 mb-3">🥊 Bracket Play Rules</h3>
                   <ul className="space-y-2 text-gray-700">
                     <li><strong>Team Formation:</strong> All players on a team must have entered the tournament. New teams can be formed as long as all players have participated in the tournament</li>
                     <li><strong>Pre-Game Drink:</strong> All players must consume a full beer or shot before the first serve. Alternatively, the fastest beer chugging player can serve first</li>
                     <li><strong>Consistent Rules:</strong> All other rules from Pool Play apply</li>
                     <li><strong>Team Dropout:</strong> If a team drops out of the knockout or leaves early, their opponents automatically advance to the next round</li>
                   </ul>
                 </div>
                 
                 <div>
                   <h3 className="font-bold text-gray-800 mb-3">👥 Partner Replacement Rules</h3>
                   <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                     <p className="text-blue-700">
                       <strong>Adding or changing a Partner Mid-Tournament:</strong> If you lose a partner during the tournament, 
                       you can replace the partner with someone who has already been participating in the tournament. 
                       You CANNOT replace your partner with someone who has just shown up at the tournament.
                     </p>
                   </div>
                 </div>
                 
                 <div>
                   <h3 className="font-bold text-gray-800 mb-3">⚖️ Officiating</h3>
                   <ul className="space-y-2 text-gray-700">
                     <li><strong>Official Required:</strong> Each game needs at least one certified official. Please become certified so you can officiate</li>
                     <li><strong>Final Decisions:</strong> Officials' decisions are final, and if needed, the point can be replayed</li>
                     <li><strong>Video Analysis Review:</strong> Currently, there is no regular Video Analysis Review</li>
                     <li><strong>Interference:</strong> If there is an instance of true interference determined by both teams and officials, the point can be replayed</li>
                   </ul>
                 </div>
               </div>
             </CardContent>
          </Card>

          {/* Additional Information */}
          <Card className="border-2 border-yellow-300 bg-gradient-to-br from-yellow-50 to-white shadow-lg">
            <CardHeader className="bg-gradient-to-r from-yellow-100 to-blue-100">
                             <CardTitle className="flex items-center gap-2 text-yellow-900">
                 <AlertCircle className="w-5 h-5 text-blue-600" />
                 💰 Cash Games & Reminders
               </CardTitle>
            </CardHeader>
                         <CardContent className="p-6">
               <div className="space-y-4">
                 <div>
                   <h3 className="font-bold text-gray-800 mb-3">💰 Cash Game Rules</h3>
                   <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                     <ul className="space-y-2 text-green-700">
                       <li><strong>Rule Determination:</strong> All game rules must be agreed upon by both teams before the game begins</li>
                       <li><strong>Cash Handling:</strong> All cash must be present and exchanged at the court before the game starts</li>
                     </ul>
                   </div>
                 </div>
                 
                 <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                   <h3 className="font-bold text-red-800 mb-3 text-center">🦅 REMEMBER: THIS IS A BEER IN HAND EVENT! 🦅</h3>
                   <div className="text-center">
                     <p className="text-red-700 font-bold text-lg mb-2">
                       4th of July Soccer Tennis Tournament is a BEER IN HAND EVENT!!!
                     </p>
                     <p className="text-red-600">
                       Always has been, always should be!!!! 
                     </p>
                     <p className="text-red-600 mt-2">
                       It's not official soccer tennis!!!! It's a version of Soccer Tennis where you play with a beer in your hand 
                       celebrating the best country in the world, The United States of America! 🦅
                     </p>
                   </div>
                 </div>
                 
                 <div>
                   <h3 className="font-bold text-gray-800 mb-3">📝 Important Reminders</h3>
                   <ul className="space-y-2 text-gray-700">
                     <li><strong>Be Ready:</strong> It's your responsibility to know when your next game is. Be ready to jump on right after a game is wrapped!</li>
                     <li><strong>Beer Requirement:</strong> Can be non-alcoholic beer, but you MUST play with a beer in hand</li>
                     <li><strong>Have Fun:</strong> This is about celebrating America and having a great time with friends! 🎉</li>
                   </ul>
                 </div>
               </div>
             </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Button
            onClick={() => router.push("/")}
            className="bg-red-600 hover:bg-red-700 text-white font-bold min-h-[48px] px-6"
          >
            🚀 Back to Tournament
          </Button>
        </div>
      </div>
    </div>
  )
} 