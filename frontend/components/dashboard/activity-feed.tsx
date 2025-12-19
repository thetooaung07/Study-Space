"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Hand, Coffee, Trophy, LogIn, MessageSquare, Loader2, Activity } from "lucide-react"
import { api } from "@/lib/api"
import { ActivityDTO } from "@/types"

// Map activity types to icons
const activityIcons: Record<string, typeof Hand> = {
  HAND_RAISE: Hand,
  QUESTION: Hand,
  COFFEE_BREAK: Coffee,
  MILESTONE_REACHED: Trophy,
  JOINED: LogIn,
  LEFT: LogIn,
  SESSION_CREATED: Activity,
  MESSAGE: MessageSquare,
}

// Format relative time
function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
  return date.toLocaleDateString()
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityDTO[]>([])
  const [loading, setLoading] = useState(true)

  
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        console.log("Fetching recent activities...");
        const data = await api.get<ActivityDTO[]>('/activities/recent')
          console.log("Fetching recent activities", data);
        console.log("Recent Activity", data) 
        setActivities(data)
      } catch (error) {
        console.error("Failed to fetch activities:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchActivities()
  }, [])

  if (loading) {
    return (
      <Card className="p-6 sticky top-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Recent Activity</h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    )
  }

  if (activities.length === 0) {
    return (
      <Card className="p-6 sticky top-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Recent Activity </h3>
        <p className="text-sm text-muted-foreground text-center py-4">
          No recent activity yet
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-6 sticky top-6">
      <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {activities.map((activity) => {
          const Icon = activityIcons[activity.type] || Activity
          return (
            <div key={activity.id} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-semibold text-foreground">{activity.userName || "Someone"}</span>
                  <span className="text-muted-foreground"> {activity.message || "performed an action"}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(activity.timestamp)}</p>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
