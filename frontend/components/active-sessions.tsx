"use client"

import { useEffect, useState } from "react"
import { Clock, Users, Play } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { StudySessionDTO } from "@/types"
import { JoinSessionModal } from "@/components/join-session-modal"
import { useAuth } from "@/context/auth-context"

export function ActiveSessions() {
  const [sessions, setSessions] = useState<StudySessionDTO[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  
  const { user } = useAuth()
  


  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) return

      try {
        // Fetch sessions for the user or their groups
        // Using user sessions for now as a starting point
        const data = await api.get<StudySessionDTO[]>(`/sessions/user/${user.id}`)
        // Filter for active sessions if needed, though backend might return all
        setSessions(data.filter(s => s.status === 'ACTIVE' || s.status === 'SCHEDULED'))
      } catch (error) {
        console.error("Failed to fetch sessions:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
        fetchSessions()
    }
  }, [user])

  const subjectColors: Record<string, string> = {
    MATH: "from-orange-500/20 to-orange-600/20",
    SCIENCE: "from-blue-500/20 to-blue-600/20",
    PROGRAMMING: "from-purple-500/20 to-purple-600/20",
    LANGUAGE: "from-green-500/20 to-green-600/20",
    HISTORY: "from-yellow-500/20 to-yellow-600/20",
    LITERATURE: "from-pink-500/20 to-pink-600/20",
    ART: "from-teal-500/20 to-teal-600/20",
    MUSIC: "from-indigo-500/20 to-indigo-600/20",
    OTHER: "from-gray-500/20 to-gray-600/20",
  }

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Active Sessions</h3>
        <div className="text-muted-foreground">Loading sessions...</div>
      </Card>
    )
  }

    const handleJoinClick = (sessionId: number) => {
    setSelectedSessionId(sessionId)
    setIsModalOpen(true)
  }

  return (
    <>
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Active Sessions</h3>
        <Button size="sm" variant="outline">
          View All
        </Button>
      </div>

      <div className="space-y-4">
        {sessions.length === 0 ? (
          <p className="text-muted-foreground text-sm">No active sessions found.</p>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`p-4 rounded-lg border border-border bg-gradient-to-r ${
                subjectColors[session.subject] || subjectColors.OTHER
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-foreground">{session.title}</h4>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        session.status === "ACTIVE"
                          ? "bg-pale-green text-status-live-fg border border-pale-green/50"
                          : "bg-pale-blue text-status-scheduled-fg border border-pale-blue/50"
                      }`}
                    >
                      {session.status === "ACTIVE" ? "● Live" : "Scheduled"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {/* Access to host name might need an extra fetch or DTO update, showing ID for now or placeholder */}
                    Hosted by User #{session.creatorId}
                  </p>
                </div>
                {session.status === "ACTIVE" && (
                 <Button size="sm" className="gap-2" onClick={() => handleJoinClick(session.id)}>
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
                  <span>{session.participantCount} studying</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>

     {selectedSessionId && (
        <JoinSessionModal sessionId={selectedSessionId} open={isModalOpen} onOpenChange={setIsModalOpen} />
      )}

      </>
  )
}
