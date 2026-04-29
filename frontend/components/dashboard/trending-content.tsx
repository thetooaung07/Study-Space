"use client"

import { TrendingUp, Users, MessageSquare, ArrowRight } from "lucide-react"
import { Card } from "@/components/ui/card"

export function TrendingContent() {
  const trendingTopics = [
    { title: "Quantum Mechanics", heat: 87, participants: 45 },
    { title: "React Hooks", heat: 75, participants: 32 },
    { title: "Calculus Review", heat: 68, participants: 28 },
    { title: "Spanish Grammar", heat: 62, participants: 19 },
  ]

  const trendingSessions = [
    {
      title: "Advanced Physics Q&A",
      participants: 12,
      duration: "45 min",
      heat: 92,
    },
    {
      title: "Frontend Development",
      participants: 8,
      duration: "1h 20m",
      heat: 78,
    },
    {
      title: "Chemistry Lab Prep",
      participants: 6,
      duration: "30 min",
      heat: 65,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Trending Topics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-accent" />
          Trending Topics
        </h3>

        <div className="space-y-3">
          {trendingTopics.map((topic, idx) => (
            <div key={idx} className="flex items-center justify-between group cursor-pointer">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {topic.title}
                </p>
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {topic.participants} learning
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    style={{ width: `${topic.heat}%` }}
                    className="h-full bg-gradient-to-r from-accent to-orange-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Trending Sessions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-secondary" />
          Hot Sessions
        </h3>

        <div className="space-y-3">
          {trendingSessions.map((session, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {session.title}
                </p>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all" />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3" />
                  {session.participants} in session
                </div>
                <span>{session.duration}</span>
              </div>
              <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                <div
                  style={{ width: `${session.heat}%` }}
                  className="h-full bg-gradient-to-r from-primary to-secondary"
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
