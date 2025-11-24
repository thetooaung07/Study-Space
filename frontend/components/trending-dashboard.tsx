"use client"

import { useState } from "react"
import { Zap, Users, TrendingUp } from "lucide-react"
import { Card } from "@/components/ui/card"
import { LiveActivityFeed } from "@/components/live-activity-feed"
import { UserStatus } from "@/components/user-status"
import { TrendingContent } from "@/components/trending-content"

export function TrendingDashboard() {
  const [filter, setFilter] = useState("all")

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-foreground">Trending & Live Activity</h2>
        <p className="text-muted-foreground mt-1">See what's happening in the community right now</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
            <p className="text-sm text-muted-foreground">Active Now</p>
          </div>
          <p className="text-2xl font-bold text-foreground">234</p>
          <p className="text-xs text-muted-foreground mt-1">students studying</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <Zap className="h-5 w-5 text-accent" />
            </div>
            <p className="text-sm text-muted-foreground">Hot Sessions</p>
          </div>
          <p className="text-2xl font-bold text-foreground">12</p>
          <p className="text-xs text-accent mt-1">trending right now</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-secondary" />
            </div>
            <p className="text-sm text-muted-foreground">New Groups</p>
          </div>
          <p className="text-2xl font-bold text-foreground">5</p>
          <p className="text-xs text-muted-foreground mt-1">created today</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-sm text-muted-foreground">Total Study Time</p>
          </div>
          <p className="text-2xl font-bold text-foreground">482h</p>
          <p className="text-xs text-accent mt-1">+45h this week</p>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Activity Feed - Main */}
        <div className="lg:col-span-2">
          <LiveActivityFeed />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Online Users */}
          <UserStatus />

          {/* Trending Content */}
          <TrendingContent />
        </div>
      </div>
    </div>
  )
}
