"use client"

import { Trophy, TrendingUp, Award, Target } from "lucide-react"
import { Card } from "@/components/ui/card"
import { GlobalLeaderboard } from "@/components/leaderboard/global-leaderboard"

export function LeaderboardDashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Leaderboard</h2>
          <p className="text-muted-foreground mt-1">Students ranked by total study time</p>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-5 w-5 text-accent" />
            <p className="text-sm text-muted-foreground">Your Rank</p>
          </div>
          <p className="text-2xl font-bold text-foreground">#--</p>
          <p className="text-xs text-muted-foreground mt-1">Based on study time</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-secondary" />
            <p className="text-sm text-muted-foreground">Study Points</p>
          </div>
          <p className="text-2xl font-bold text-foreground">--</p>
          <p className="text-xs text-muted-foreground mt-1">Total minutes</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Award className="h-5 w-5 text-orange-500" />
            <p className="text-sm text-muted-foreground">Achievements</p>
          </div>
          <p className="text-2xl font-bold text-foreground">--</p>
          <p className="text-xs text-muted-foreground mt-1">Unlocked</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Target className="h-5 w-5 text-blue-500" />
            <p className="text-sm text-muted-foreground">Streak</p>
          </div>
          <p className="text-2xl font-bold text-foreground">--</p>
          <p className="text-xs text-accent mt-1">Keep studying!</p>
        </Card>
      </div>

      {/* Leaderboard Content */}
      <div className="min-h-[500px] w-full mt-2">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 ease-in-out">
          <GlobalLeaderboard />
        </div>
      </div>
    </div>
  )
}