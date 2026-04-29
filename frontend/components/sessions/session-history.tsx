"use client"

import { useEffect, useState } from "react"
import { MoreVertical, Calendar, Clock, Users, FileText, Loader2, Trash2 } from "lucide-react"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { useAuth } from "@/context/auth-context"
import { StudySessionDTO } from "@/types"

interface SessionHistoryProps {
  onSessionDeleted?: () => void
}

export function SessionHistory({ onSessionDeleted }: SessionHistoryProps) {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<StudySessionDTO[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) return
      
      try {
        const allSessions = await api.get<StudySessionDTO[]>(`/sessions/user/${user.id}`)
        setSessions(allSessions)
      } catch (error) {
        console.error("Failed to fetch session history:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSessions()
  }, [user])

  const subjectColors: Record<string, string> = {
    MATH: "from-orange-500/20 to-orange-600/20 border-orange-500/30",
    SCIENCE: "from-blue-500/20 to-blue-600/20 border-blue-500/30",
    PROGRAMMING: "from-purple-500/20 to-purple-600/20 border-purple-500/30",
    LANGUAGE: "from-green-500/20 to-green-600/20 border-green-500/30",
    HISTORY: "from-yellow-500/20 to-yellow-600/20 border-yellow-500/30",
    ART: "from-pink-500/20 to-pink-600/20 border-pink-500/30",
    MUSIC: "from-indigo-500/20 to-indigo-600/20 border-indigo-500/30",
    OTHER: "from-gray-500/20 to-gray-600/20 border-gray-500/30",
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === now.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
        `, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    }
  }

  const handleDeleteSession = async (sessionId: number) => {
    try {
      await api.delete(`/sessions/${sessionId}`)
      setSessions(sessions.filter(s => s.id !== sessionId))
      toast.success("Session deleted")
      onSessionDeleted?.()
    } catch (error) {
      console.error("Failed to delete session", error)
      toast.error("Failed to delete session")
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading session history...</span>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Session History</h3>
        <Button variant="outline" size="sm">
          Filter
        </Button>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No completed sessions yet.</p>
          <p className="text-sm mt-1">Start a study session to see your history here!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`p-4 rounded-lg border bg-gradient-to-r ${subjectColors[session.subject] || subjectColors.OTHER}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-foreground">{session.title}</h4>
                    <span className="text-xs px-2 py-1 rounded-full bg-background/50 text-muted-foreground">
                      {session.subject}
                    </span>
                  </div>
                  {session.description && (
                    <p className="text-sm text-muted-foreground mb-3">{session.description}</p>
                  )}

                </div>
                {session.creatorId === user?.id && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Session?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this session history. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteSession(session.id)} className="bg-destructive text-white hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>

              <div className="grid grid-cols-4 gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(session.startTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{session.duration || `${session.durationMinutes || 0} min`}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>
                    {session.participantCount} participant{session.participantCount !== 1 ? "s" : ""}
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
      )}
    </Card>
  )
}
