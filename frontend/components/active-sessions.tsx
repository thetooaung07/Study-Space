"use client"

import { Clock, Users, Play } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function ActiveSessions() {
  const sessions = [
    {
      id: 1,
      title: "Math Homework - Calculus",
      subject: "MATH",
      participants: 4,
      duration: "45min",
      status: "ACTIVE",
      host: "You",
    },
    {
      id: 2,
      title: "Physics Study Group",
      subject: "SCIENCE",
      participants: 8,
      duration: "1h 20min",
      status: "ACTIVE",
      host: "Sarah Chen",
    },
    {
      id: 3,
      title: "Programming Interview Prep",
      subject: "PROGRAMMING",
      participants: 3,
      duration: "2h",
      status: "SCHEDULED",
      host: "Alex Kumar",
    },
  ]

  const subjectColors = {
    MATH: "from-orange-500/20 to-orange-600/20",
    SCIENCE: "from-blue-500/20 to-blue-600/20",
    PROGRAMMING: "from-purple-500/20 to-purple-600/20",
    LANGUAGE: "from-green-500/20 to-green-600/20",
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Active Sessions</h3>
        <Button size="sm" variant="outline">
          View All
        </Button>
      </div>

      <div className="space-y-4">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`p-4 rounded-lg border border-border bg-gradient-to-r ${subjectColors[session.subject as keyof typeof subjectColors]}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-foreground">{session.title}</h4>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      session.status === "ACTIVE" ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {session.status === "ACTIVE" ? "● Live" : "Scheduled"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Hosted by {session.host}</p>
              </div>
              {session.status === "ACTIVE" && (
                <Button size="sm" className="gap-2">
                  <Play className="h-4 w-4" />
                  Join
                </Button>
              )}
            </div>
            <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{session.duration}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{session.participants} studying</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
