"use client"
import { useRouter } from "next/navigation"
import { Clock, Users, BookOpen, Zap, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface JoinSessionModalProps {
  sessionId: string | number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function JoinSessionModal({ sessionId, open, onOpenChange }: JoinSessionModalProps) {
  const router = useRouter()

  // Mock session data - would come from API
  const session = {
    id: sessionId,
    title: "Calculus Study Session",
    subject: "MATH",
    host: {
      name: "Sarah Chen",
      avatar: "SC",
      totalStudyMinutes: 3450,
    },
    description:
      "Working through integration techniques and practice problems from Chapter 5. All skill levels welcome!",
    participants: [
      { id: 1, name: "Alex Kumar", avatar: "AK", status: "studying" },
      { id: 2, name: "Jamie Lee", avatar: "JL", status: "on-break" },
      { id: 3, name: "Chris Taylor", avatar: "CT", status: "studying" },
      { id: 4, name: "Morgan Smith", avatar: "MS", status: "studying" },
    ],
    duration: "1h 25m",
    focusLevel: "High",
    sessionType: "Group",
    startedAt: "2:30 PM",
    rules: [
      "Keep microphone muted unless speaking",
      "Use hand raise feature for questions",
      "Take breaks every 25 minutes",
    ],
  }

  const handleJoinSession = () => {
    onOpenChange(false)
    router.push(`/sessions/active/${session.id}`)
  }

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
                  Live
                </span>
              </div>
              <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">{session.title}</DialogTitle>
              <p className="text-gray-600 text-sm leading-relaxed">{session.description}</p>
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
              <p className="text-base font-semibold text-gray-900">{session.participants.length}</p>
            </div>

            <div className="p-3 rounded-lg backdrop-blur-sm bg-white/40 border border-white/30">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Zap className="h-4 w-4" />
                <span className="text-xs font-medium">Focus Level</span>
              </div>
              <p className="text-base font-semibold text-gray-900">{session.focusLevel}</p>
            </div>

            <div className="p-3 rounded-lg backdrop-blur-sm bg-white/40 border border-white/30">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <BookOpen className="h-4 w-4" />
                <span className="text-xs font-medium">Type</span>
              </div>
              <p className="text-base font-semibold text-gray-900">{session.sessionType}</p>
            </div>
          </div>

          {/* Host Info */}
          <div className="p-4 rounded-lg backdrop-blur-sm bg-white/40 border border-white/30">
            <p className="text-sm font-medium text-gray-600 mb-3">Hosted by</p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-semibold text-sm">
                {session.host.avatar}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{session.host.name}</p>
                <p className="text-sm text-gray-600">
                  {Math.floor(session.host.totalStudyMinutes / 60)}h total study time
                </p>
              </div>
            </div>
          </div>

          {/* Participants */}
          <div className="p-4 rounded-lg backdrop-blur-sm bg-white/40 border border-white/30">
            <p className="text-sm font-medium text-gray-600 mb-3">Currently Studying</p>
            <div className="grid grid-cols-2 gap-3">
              {session.participants.map((participant) => (
                <div key={participant.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/30">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-green-400 to-teal-400 flex items-center justify-center text-white text-xs font-semibold">
                    {participant.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{participant.name}</p>
                    <p className="text-xs text-gray-600 capitalize">{participant.status.replace("-", " ")}</p>
                  </div>
                  <div
                    className={`h-2 w-2 rounded-full ${participant.status === "studying" ? "bg-green-500" : "bg-yellow-500"}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Session Rules */}
          <div className="p-4 rounded-lg backdrop-blur-sm bg-white/40 border border-white/30">
            <p className="text-sm font-medium text-gray-600 mb-3">Session Guidelines</p>
            <ul className="space-y-2">
              {session.rules.map((rule, index) => (
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
            size="lg"
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg gap-2"
          >
            <Play className="h-5 w-5" />
            Join Study Session
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
