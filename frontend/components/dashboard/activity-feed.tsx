"use client"

import { Card } from "@/components/ui/card"
import { Hand, Coffee, Trophy, LogIn, MessageSquare } from "lucide-react"

export function ActivityFeed() {
  const activities = [
    {
      id: 1,
      type: "HAND_RAISE",
      user: "Sarah Chen",
      action: "asked a question",
      time: "5 min ago",
      icon: Hand,
    },
    {
      id: 2,
      type: "MILESTONE",
      user: "You",
      action: "reached 100 study hours",
      time: "1 hour ago",
      icon: Trophy,
    },
    {
      id: 3,
      type: "BREAK",
      user: "Alex Kumar",
      action: "took a coffee break",
      time: "2 hours ago",
      icon: Coffee,
    },
    {
      id: 4,
      type: "JOINED",
      user: "Mike Johnson",
      action: "joined Math Study Group",
      time: "3 hours ago",
      icon: LogIn,
    },
    {
      id: 5,
      type: "MESSAGE",
      user: "Study Group Admin",
      action: "posted an announcement",
      time: "5 hours ago",
      icon: MessageSquare,
    },
  ]

  return (
    <Card className="p-6 sticky top-6">
      <h3 className="text-lg font-semibold text-foreground mb-6">Recent Activity</h3>

      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = activity.icon
          return (
            <div key={activity.id} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-semibold text-foreground">{activity.user}</span>
                  <span className="text-muted-foreground"> {activity.action}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
