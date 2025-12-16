"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Trophy, Medal, Crown, Flame, Calendar, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
// import { api } from "@/lib/api" // Assuming api client exists, using fetch for now or mock if preferred

// Mock data for initial invalidation issues or fallback
const MOCK_LEADERBOARD = [
  { id: 1, name: "Sarah Chen", avatar: "/avatars/sarah.jpg", minutes: 2450, rank: 1, trend: "up" },
  { id: 2, name: "Alex Thompson", avatar: "/avatars/alex.jpg", minutes: 2320, rank: 2, trend: "stable" },
  { id: 3, name: "Maria Garcia", avatar: "/avatars/maria.jpg", minutes: 2150, rank: 3, trend: "up" },
  { id: 4, name: "James Wilson", avatar: "/avatars/james.jpg", minutes: 1980, rank: 4, trend: "down" },
  { id: 5, name: "Emily Davis", avatar: "/avatars/emily.jpg", minutes: 1850, rank: 5, trend: "up" },
]

export function LeaderboardPage() {
  const [timeRange, setTimeRange] = useState("weekly")
  const [leaderboardData, setLeaderboardData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch real data
    const fetchData = async () => {
      setLoading(true)
      try {
        // Replace with actual API call
        // const res = await api.get(\`/analytics/leaderboard?range=\${timeRange}\`)
        // setLeaderboardData(res)
        
        // Simulating API loading for now with mock
        setTimeout(() => {
             setLeaderboardData(MOCK_LEADERBOARD)
             setLoading(false)
        }, 500)
      } catch (error) {
        console.error("Failed to fetch leaderboard", error)
        setLoading(false)
      }
    }
    fetchData()
  }, [timeRange])

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Global Leaderboard
          </h1>
          <p className="text-muted-foreground mt-1">Top scholars dedicated to their learning journey</p>
        </div>
        
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">This Week</SelectItem>
            <SelectItem value="monthly">This Month</SelectItem>
            <SelectItem value="all-time">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 items-end">
        {/* Second Place */}
        <div className="order-2 md:order-1">
          <Card className="p-6 flex flex-col items-center bg-card/50 border-muted relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gray-300" />
             <div className="relative mb-4">
                <Avatar className="h-24 w-24 border-4 border-gray-300">
                  <AvatarImage src={leaderboardData[1]?.avatar} />
                  <AvatarFallback className="text-xl bg-muted">2</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-300 text-white px-3 py-0.5 rounded-full text-sm font-bold shadow-sm">
                  #2
                </div>
             </div>
             <h3 className="font-bold text-lg text-center mt-2">{leaderboardData[1]?.name || "Loading..."}</h3>
             <p className="text-muted-foreground text-sm flex items-center gap-1">
                <Flame className="h-3 w-3 text-orange-500" />
                {leaderboardData[1]?.minutes || 0} mins
             </p>
          </Card>
        </div>

        {/* First Place */}
        <div className="order-1 md:order-2 z-10 scale-110">
           <Card className="p-8 flex flex-col items-center bg-gradient-to-b from-yellow-500/10 to-card border-yellow-500/50 shadow-lg relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1.5 bg-yellow-500" />
             <Crown className="h-8 w-8 text-yellow-500 mb-2 animate-pulse" />
             <div className="relative mb-4">
                <Avatar className="h-32 w-32 border-[6px] border-yellow-500 shadow-xl">
                  <AvatarImage src={leaderboardData[0]?.avatar} />
                  <AvatarFallback className="text-3xl bg-yellow-100 text-yellow-700">1</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-white px-4 py-1 rounded-full text-base font-bold shadow-md">
                  #1
                </div>
             </div>
             <h3 className="font-bold text-xl text-center mt-4">{leaderboardData[0]?.name || "Loading..."}</h3>
             <p className="text-yellow-600 font-medium flex items-center gap-1.5 mt-1">
                <Flame className="h-4 w-4 fill-yellow-600" />
                {leaderboardData[0]?.minutes || 0} mins
             </p>
          </Card>
        </div>

        {/* Third Place */}
        <div className="order-3">
          <Card className="p-6 flex flex-col items-center bg-card/50 border-muted relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-orange-700/50" />
             <div className="relative mb-4">
                <Avatar className="h-24 w-24 border-4 border-orange-700/30">
                  <AvatarImage src={leaderboardData[2]?.avatar} />
                  <AvatarFallback className="text-xl bg-orange-50 text-orange-800">3</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-orange-700/80 text-white px-3 py-0.5 rounded-full text-sm font-bold shadow-sm">
                  #3
                </div>
             </div>
             <h3 className="font-bold text-lg text-center mt-2">{leaderboardData[2]?.name || "Loading..."}</h3>
             <p className="text-muted-foreground text-sm flex items-center gap-1">
                <Flame className="h-3 w-3 text-orange-500" />
                {leaderboardData[2]?.minutes || 0} mins
             </p>
          </Card>
        </div>
      </div>

      {/* List */}
      <Card className="bg-card">
        <div className="divide-y divide-border">
           {leaderboardData.slice(3).map((user) => (
             <div key={user.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                   <div className="w-8 text-center font-bold text-muted-foreground text-lg">#{user.rank}</div>
                   <Avatar className="h-10 w-10">
                     <AvatarImage src={user.avatar} />
                     <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                   </Avatar>
                   <div>
                      <h4 className="font-semibold text-foreground">{user.name}</h4>
                      {/* Optional: Add streak or status here */}
                   </div>
                </div>
                <div className="flex items-center gap-6">
                   <div className="text-right">
                      <div className="font-bold text-foreground">{user.minutes} min</div>
                      <div className="text-xs text-muted-foreground">Total time</div>
                   </div>
                </div>
             </div>
           ))}
           {leaderboardData.length <= 3 && (
             <div className="p-8 text-center text-muted-foreground">
                Typically more users would appear here...
             </div>
           )}
        </div>
      </Card>
    </div>
  )
}
