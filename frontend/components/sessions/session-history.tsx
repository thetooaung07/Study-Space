"use client"

import { MoreVertical, Calendar, Clock, Users, FileText } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function SessionHistory() {
  const sessions = [
    {
      id: 1,
      title: "Calculus Chapter 5 Review",
      subject: "MATH",
      date: "Today, 2:30 PM",
      duration: "1h 30m",
      participants: 3,
      notes: "Focused on integration techniques",
      status: "COMPLETED",
    },
    {
      id: 2,
      title: "Physics Problem Set",
      subject: "SCIENCE",
      date: "Today, 12:00 PM",
      duration: "45m",
      participants: 1,
      notes: "Thermodynamics problems",
      status: "COMPLETED",
    },
    {
      id: 3,
      title: "Web Development Practice",
      subject: "PROGRAMMING",
      date: "Yesterday, 6:15 PM",
      duration: "2h 15m",
      participants: 2,
      notes: "React hooks and state management",
      status: "COMPLETED",
    },
    {
      id: 4,
      title: "Spanish Vocabulary",
      subject: "LANGUAGE",
      date: "Nov 22, 4:00 PM",
      duration: "1h",
      participants: 1,
      notes: "Chapter 8 vocabulary review",
      status: "COMPLETED",
    },
  ]

  const subjectColors = {
    MATH: "from-orange-500/20 to-orange-600/20 border-orange-500/30",
    SCIENCE: "from-blue-500/20 to-blue-600/20 border-blue-500/30",
    PROGRAMMING: "from-purple-500/20 to-purple-600/20 border-purple-500/30",
    LANGUAGE: "from-green-500/20 to-green-600/20 border-green-500/30",
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Session History</h3>
        <Button variant="outline" size="sm">
          Filter
        </Button>
      </div>

      <div className="space-y-4">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`p-4 rounded-lg border bg-gradient-to-r ${subjectColors[session.subject as keyof typeof subjectColors]}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-foreground">{session.title}</h4>
                  <span className="text-xs px-2 py-1 rounded-full bg-background/50 text-muted-foreground">
                    {session.subject}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{session.notes}</p>
              </div>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-4 gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{session.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{session.duration}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>
                  {session.participants} participant{session.participants !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Details</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
