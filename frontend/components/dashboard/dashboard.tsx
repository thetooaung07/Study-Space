"use client"

import { Users, Clock, Trophy, Zap, CloudCog } from "lucide-react"
import { StatCard } from "@/components/common/stat-card"
import { ActiveSessions } from "@/components/sessions/active-sessions"
import { MyGroups } from "@/components/groups/my-groups"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { useAuth } from "@/context/auth-context"

export function Dashboard() {

  const {user } = useAuth() 

  console.log(user);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Welcome back, {user ? user.fullName : ""} </h2>
          <p className="text-muted-foreground mt-1">Track your study progress and connect with peers</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={Clock} label="Total Study Time" value="42h 30m" trend="Up 12% this week" positive />
        <StatCard icon={Users} label="Study Groups" value="5" trend="2 new invitations" positive />
        <StatCard icon={Trophy} label="Leaderboard Rank" value="#47" trend="Up 5 positions" positive />
        <StatCard icon={Zap} label="Streak Days" value="12" trend="Keep it going!" positive />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Active Sessions & Groups */}
        <div className="lg:col-span-2 space-y-6">
          <ActiveSessions />
          <MyGroups />
        </div>

        {/* Right Column - Activity Feed */}
        <div className="lg:col-span-1">
          <ActivityFeed />
        </div>
      </div>
    </div>
  )
}
