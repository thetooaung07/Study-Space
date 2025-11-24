"use client"

import { useState } from "react"
import { Trophy, TrendingUp, Award, Target } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GlobalLeaderboard } from "@/components/global-leaderboard"
import { GroupLeaderboard } from "@/components/group-leaderboard"
import { Analytics } from "@/components/analytics"

export function LeaderboardDashboard() {
  const [activeTab, setActiveTab] = useState("global")

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-foreground">Leaderboards & Analytics</h2>
        <p className="text-muted-foreground mt-1">Track your progress and compete with the community</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-5 w-5 text-accent" />
            <p className="text-sm text-muted-foreground">Your Rank</p>
          </div>
          <p className="text-2xl font-bold text-foreground">#47</p>
          <p className="text-xs text-accent mt-1">↑ 5 positions this week</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-secondary" />
            <p className="text-sm text-muted-foreground">Study Points</p>
          </div>
          <p className="text-2xl font-bold text-foreground">2,840</p>
          <p className="text-xs text-accent mt-1">+240 this week</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Award className="h-5 w-5 text-orange-500" />
            <p className="text-sm text-muted-foreground">Achievements</p>
          </div>
          <p className="text-2xl font-bold text-foreground">8</p>
          <p className="text-xs text-muted-foreground mt-1">3 this month</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Target className="h-5 w-5 text-blue-500" />
            <p className="text-sm text-muted-foreground">Streak</p>
          </div>
          <p className="text-2xl font-bold text-foreground">12</p>
          <p className="text-xs text-accent mt-1">Keep studying!</p>
        </Card>
      </div>

      {/* Tab Navigation */}
      <Card className="p-4 flex gap-2 border-b border-border bg-card">
        <Button variant={activeTab === "global" ? "default" : "outline"} onClick={() => setActiveTab("global")}>
          Global Leaderboard
        </Button>
        <Button variant={activeTab === "groups" ? "default" : "outline"} onClick={() => setActiveTab("groups")}>
          Group Leaderboards
        </Button>
        <Button variant={activeTab === "analytics" ? "default" : "outline"} onClick={() => setActiveTab("analytics")}>
          Analytics
        </Button>
      </Card>

      {/* Tab Content */}
      {activeTab === "global" && <GlobalLeaderboard />}
      {activeTab === "groups" && <GroupLeaderboard />}
      {activeTab === "analytics" && <Analytics />}
    </div>
  )
}
