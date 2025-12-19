"use client"

import { useEffect, useState } from "react"
import { Users, Clock, Trophy, Zap } from "lucide-react"
import { StatCard } from "@/components/common/stat-card"
import { ActiveSessions } from "@/components/sessions/active-sessions"
import { MyGroups } from "@/components/groups/my-groups"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { useAuth } from "@/context/auth-context"
import { api } from "@/lib/api"
import { StudyGroupDTO } from "@/types"

/** Format minutes to human-readable time */
function formatStudyTime(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }
  return `${minutes}m`
}

export function Dashboard() {
  const { user } = useAuth()
  const [groupCount, setGroupCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return
      
      try {
        // Fetch user's groups
        const groups = await api.get<StudyGroupDTO[]>(`/groups/user/${user.id}`)
        setGroupCount(groups.length)
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user])

  // Calculate stats from user data
  const totalStudyMinutes = user?.totalStudyMinutes || 0
  const streak = user?.currentStreak || 0

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
        <StatCard 
          icon={Clock} 
          label="Total Study Time" 
          value={formatStudyTime(totalStudyMinutes)} 
          trend={totalStudyMinutes > 0 ? "Keep studying!" : "Start your journey"} 
          positive={totalStudyMinutes > 0} 
        />
        <StatCard 
          icon={Users} 
          label="Study Groups" 
          value={loading ? "..." : groupCount.toString()} 
          trend={groupCount > 0 ? `${groupCount} group${groupCount !== 1 ? 's' : ''} joined` : "Join a group!"} 
          positive={groupCount > 0} 
        />
        <StatCard 
          icon={Trophy} 
          label="Sessions Completed" 
          value={Math.floor(totalStudyMinutes / 30).toString()} 
          trend="Based on 30min avg" 
          positive={totalStudyMinutes > 0} 
        />
        <StatCard 
          icon={Zap} 
          label="Streak Days" 
          value={streak.toString()} 
          trend={streak > 0 ? "Keep it going! 🔥" : "Start your streak!"} 
          positive={streak > 0} 
        />
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
