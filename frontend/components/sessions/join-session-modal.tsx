import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Clock, Users, BookOpen, Zap, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { api } from "@/lib/api"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"

interface JoinSessionModalProps {
  sessionId: string | number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function JoinSessionModal({ sessionId, open, onOpenChange }: JoinSessionModalProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  
  // Real session state
  // We use a partial or full DTO here. Initial state is null.
  // We can use a type assertion or just check content availability.
  const [session, setSession] = useState<any>(null) 
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
     if (open && sessionId) {
         const fetchSession = async () => {
             try {
                 setFetching(true)
                 const data = await api.get(`/sessions/${sessionId}`)
                 setSession(data)
             } catch (e) {
                 console.error("Failed to fetch session details", e)
                 toast.error("Could not load session details")
             } finally {
                 setFetching(false)
             }
         }
         fetchSession()
     }
  }, [open, sessionId])


  const handleJoinSession = async () => {
    if (!user) return
    setLoading(true)
    try {
        await api.post(`/sessions/${sessionId}/participants/${user.id}`, {})
        toast.success("Joined session successfully!")
        router.push(`/sessions/active/${sessionId}`)
        onOpenChange(false)
    } catch (error) {
        console.error("Failed to join session:", error)
        toast.error("Failed to join session. You might already be in it.")
    } finally {
        setLoading(false)
    }
  }
  
  if (!session && fetching) {
      return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <div className="p-8 text-center text-muted-foreground">Loading session details...</div>
            </DialogContent>
        </Dialog>
      )
  }
  
  if (!session) return null

  // Helper to ensure lists exist
  const participants = session.participants || []
  const rules = [
      "Keep microphone muted unless speaking",
      "Use hand raise feature for questions",
      "Take breaks every 25 minutes",
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-4xl max-w-5xl max-h-[90vh] overflow-y-auto backdrop-blur-md bg-white/80 border-white/30">
        <DialogHeader>
          <div className="flex items-start justify-between pr-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-700 text-sm font-medium border border-orange-500/20">
                    {session.subject}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-green-700">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  {session.status === 'ACTIVE' ? 'Live' : 'Scheduled'}
                </span>
              </div>
              <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">{session.title}</DialogTitle>
              <p className="text-gray-600 text-sm leading-relaxed">{session.description || "No description provided."}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Session Stats Grid */}
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 rounded-lg backdrop-blur-sm bg-white/40 border border-white/30">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-medium">Duration</span>
              </div>
              <p className="text-base font-semibold text-gray-900">{session.duration}</p>
            </div>

            <div className="p-3 rounded-lg backdrop-blur-sm bg-white/40 border border-white/30">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Users className="h-4 w-4" />
                <span className="text-xs font-medium">Participants</span>
              </div>
              <p className="text-base font-semibold text-gray-900">{session.participantCount}</p>
            </div>

            <div className="p-3 rounded-lg backdrop-blur-sm bg-white/40 border border-white/30">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Zap className="h-4 w-4" />
                <span className="text-xs font-medium">Focus Level</span>
              </div>
              <p className="text-base font-semibold text-gray-900">Medium</p>
            </div>

            <div className="p-3 rounded-lg backdrop-blur-sm bg-white/40 border border-white/30">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <BookOpen className="h-4 w-4" />
                <span className="text-xs font-medium">Type</span>
              </div>
              <p className="text-base font-semibold text-gray-900">{session.isGroupSession ? "Group" : "Solo"}</p>
            </div>
          </div>

          {/* Host Info */}
          {session.creator && (
              <div className="p-4 rounded-lg backdrop-blur-sm bg-white/40 border border-white/30">
                <p className="text-sm font-medium text-gray-600 mb-3">Hosted by</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                    {session.creator.profilePictureUrl ? (
                         <img src={session.creator.profilePictureUrl} alt={session.creator.fullName} className="w-full h-full object-cover" />
                    ) : (
                        session.creator.fullName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{session.creator.fullName}</p>
                    <p className="text-sm text-gray-600">
                      {Math.floor((session.creator.totalStudyMinutes || 0) / 60)}h total study time
                    </p>
                  </div>
                </div>
              </div>
          )}

          {/* Participants */}
          <div className="p-4 rounded-lg backdrop-blur-sm bg-white/40 border border-white/30">
            <p className="text-sm font-medium text-gray-600 mb-3">Currently Studying</p>
            {participants.length === 0 ? (
                <p className="text-sm text-gray-500">No other participants yet.</p>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                  {participants.map((participant: any) => (
                    <div key={participant.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/30">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-green-400 to-teal-400 flex items-center justify-center text-white text-xs font-semibold overflow-hidden">
                        {participant.profilePictureUrl ? (
                             <img src={participant.profilePictureUrl} alt={participant.fullName} className="w-full h-full object-cover" />
                        ) : (
                            participant.fullName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{participant.fullName}</p>
                        <p className="text-xs text-gray-600 capitalize">{participant.currentStatus?.toLowerCase() || 'offline'}</p>
                      </div>
                      <div
                        className={`h-2 w-2 rounded-full ${participant.currentStatus === "STUDYING" ? "bg-green-500" : "bg-gray-400"}`}
                      />
                    </div>
                  ))}
                </div>
            )}
          </div>

          {/* Session Rules */}
          <div className="p-4 rounded-lg backdrop-blur-sm bg-white/40 border border-white/30">
            <p className="text-sm font-medium text-gray-600 mb-3">Session Guidelines</p>
            <ul className="space-y-2">
              {rules.map((rule, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-gray-400 mt-0.5">{index + 1}.</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Join Button */}
          <Button
            onClick={handleJoinSession}
            disabled={loading}
            size="lg"
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg gap-2"
          >
            <Play className="h-5 w-5" />
            {loading ? "Joining..." : "Join Study Session"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
