"use client"

import { Hand, Coffee, Trophy, LogIn, MessageSquare, BookOpen, Flame, Star } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function LiveActivityFeed() {
  const activities = [
    {
      id: 1,
      type: "SESSION_START",
      user: "Alex Kumar",
      action: "started studying",
      details: "Advanced Algorithms",
      time: "just now",
      avatar: "👨‍💻",
      icon: BookOpen,
      live: true,
    },
    {
      id: 2,
      type: "MILESTONE",
      user: "Sarah Chen",
      action: "reached 200 study hours",
      details: "Major milestone unlocked!",
      time: "2 min ago",
      avatar: "👩‍🎓",
      icon: Trophy,
      live: false,
    },
    {
      id: 3,
      type: "HAND_RAISE",
      user: "Mike Johnson",
      action: "asked a question in",
      details: "Physics Study Group",
      time: "5 min ago",
      avatar: "👨‍🎓",
      icon: Hand,
      live: true,
    },
    {
      id: 4,
      type: "GROUP_JOIN",
      user: "Emily Davis",
      action: "joined",
      details: "Morning Grinders",
      time: "8 min ago",
      avatar: "👩‍💻",
      icon: LogIn,
      live: false,
    },
    {
      id: 5,
      type: "BREAK",
      user: "James Wilson",
      action: "took a coffee break from",
      details: "Math Study Session",
      time: "12 min ago",
      avatar: "👨‍🎓",
      icon: Coffee,
      live: false,
    },
    {
      id: 6,
      type: "ACHIEVEMENT",
      user: "Lisa Brown",
      action: "earned achievement:",
      details: "7-Day Streak Master",
      time: "15 min ago",
      avatar: "👩‍🎓",
      icon: Star,
      live: false,
    },
    {
      id: 7,
      type: "MESSAGE",
      user: "David Lee",
      action: "posted in",
      details: "CS101 Study Gang",
      time: "18 min ago",
      avatar: "👨‍💻",
      icon: MessageSquare,
      live: false,
    },
    {
      id: 8,
      type: "STREAK",
      user: "You (Thet Oo Aung)",
      action: "maintained your",
      details: "12-day study streak",
      time: "25 min ago",
      avatar: "👨‍🎓",
      icon: Flame,
      live: false,
    },
  ]

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Live Activity Feed
        </h3>
        <Button variant="outline" size="sm">
          Filters
        </Button>
      </div>

      <div className="space-y-3">
        {activities.map((activity) => {
          const Icon = activity.icon
          return (
            <div
              key={activity.id}
              className={`p-4 rounded-lg border transition-all ${
                activity.live
                  ? "bg-green-500/5 border-green-500/30 hover:bg-green-500/10"
                  : "border-border hover:bg-primary/5"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="relative">
                  <div className="text-2xl">{activity.avatar}</div>
                  {activity.live && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-background animate-pulse" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm">
                        <span className="font-semibold text-foreground">{activity.user}</span>
                        <span className="text-muted-foreground"> {activity.action}</span>
                      </p>
                      <p className="text-sm text-primary font-medium">{activity.details}</p>
                    </div>
                    <Icon className={`h-4 w-4 flex-shrink-0 ${activity.live ? "text-green-500" : "text-primary"}`} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{activity.time}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Button variant="outline" className="w-full mt-6 bg-transparent">
        Load More Activities
      </Button>
    </Card>
  )
}
