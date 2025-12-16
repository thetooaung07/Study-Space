"use client"

import { useState } from "react"
import { Trophy, TrendingUp, Award, Target } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GlobalLeaderboard } from "@/components/leaderboard/global-leaderboard"
import { GroupLeaderboard } from "@/components/leaderboard/group-leaderboard"

export function LeaderboardDashboard() {
  const [activeTab, setActiveTab] = useState("global")

  return (
    <div className="p-6 space-y-6">
      {/* Header with Top-Right Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Leaderboards</h2>
          <p className="text-muted-foreground mt-1">Track your progress and compete</p>
        </div>

        {/* Tab Switcher (Moved here) */}
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="w-full md:w-[300px]"
        >
          <TabsList className="grid w-full grid-cols-2 bg-muted/60 border border-border/50">
            <TabsTrigger value="global" className="transition-all">Global</TabsTrigger>
            <TabsTrigger value="groups" className="transition-all">Groups</TabsTrigger>
          </TabsList>
        </Tabs>
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

      {/* Tab Content Area 
         min-h-[500px]: prevents vertical jumping
      */}
      <div className="min-h-[500px] w-full mt-2">
        <div 
          key={activeTab} 
          className="animate-in fade-in slide-in-from-bottom-2 duration-500 ease-in-out"
        >
          {activeTab === "global" ? <GlobalLeaderboard /> : <GroupLeaderboard />}
        </div>
      </div>
    </div>
  )
}