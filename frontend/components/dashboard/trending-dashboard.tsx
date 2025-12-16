"use client"

import { useState, useEffect } from "react"
import { Zap, Users, TrendingUp } from "lucide-react"
import { api } from "@/lib/api"
import { Card } from "@/components/ui/card"
import { LiveActivityFeed } from "@/components/dashboard/live-activity-feed"
import { UserStatus } from "@/components/common/user-status"
import { TrendingContent } from "@/components/dashboard/trending-content"

export function TrendingDashboard() {
  const [filter, setFilter] = useState("all")
  const [analytics, setAnalytics] = useState({
    activeUsersNow: 0,
    hotSessionsCount: 0,
    newGroupsToday: 0,
    totalStudyMinutes: 0
  })

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await api.get<any>('/analytics/overview')
        setAnalytics(data)
      } catch (error) {
        console.error("Failed to fetch analytics:", error)
      }
    }
    fetchAnalytics()
    // Poll every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000)
    return () => clearInterval(interval)
  }, [])

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
          <p className="text-2xl font-bold text-foreground">{analytics.activeUsersNow}</p>
          <p className="text-xs text-muted-foreground mt-1">students studying</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <Zap className="h-5 w-5 text-accent" />
            </div>
            <p className="text-sm text-muted-foreground">Hot Sessions</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{analytics.hotSessionsCount}</p>
          <p className="text-xs text-accent mt-1">trending right now</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-secondary" />
            </div>
            <p className="text-sm text-muted-foreground">New Groups</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{analytics.newGroupsToday}</p>
          <p className="text-xs text-muted-foreground mt-1">created today</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-sm text-muted-foreground">Total Study Time</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{Math.floor(analytics.totalStudyMinutes / 60)}h</p>
          <p className="text-xs text-accent mt-1">aggregate total</p>
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
