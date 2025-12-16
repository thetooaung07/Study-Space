"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Users, MessageSquare, Pause, Play, Coffee, LogOut, Volume2, VolumeX, Hand, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function ActiveSessionPage() {
  const params = useParams()
  const router = useRouter()
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const [elapsedTime, setElapsedTime] = useState(3825) // 1h 3m 45s
  const [message, setMessage] = useState("")

  // Mock session data
  const session = {
    id: params.id,
    title: "Calculus Study Session",
    subject: "MATH",
    focusLevel: "High",
  }

  const participants = [
    { id: 1, name: "Sarah Chen", avatar: "SC", status: "studying", isHost: true },
    { id: 2, name: "Alex Kumar", avatar: "AK", status: "studying", isHost: false },
    { id: 3, name: "Jamie Lee", avatar: "JL", status: "on-break", isHost: false },
    { id: 4, name: "Chris Taylor", avatar: "CT", status: "studying", isHost: false },
    { id: 5, name: "Morgan Smith", avatar: "MS", status: "studying", isHost: false },
  ]

  const activities = [
    { id: 1, user: "Alex Kumar", action: "raised hand", time: "Just now" },
    { id: 2, user: "Jamie Lee", action: "took a break", time: "2 min ago" },
    { id: 3, user: "Chris Taylor", action: "sent a message", time: "5 min ago" },
    { id: 4, user: "Sarah Chen", action: "started session", time: "1h 3m ago" },
  ]

  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isPlaying])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }

  const handleLeaveSession = () => {
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--pale-blue)] via-[var(--pale-purple)] to-[var(--pale-green)] p-4 lg:p-6">
      <div className="max-w-[1600px] mx-auto h-[calc(100vh-2rem)] lg:h-[calc(100vh-3rem)] grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 lg:gap-6">
        {/* Main Content Area */}
        <div className="flex flex-col gap-4 lg:gap-6 min-h-0">
          {/* Session Header */}
          <Card className="p-4 lg:p-6 backdrop-blur-md bg-white/60 border-white/20 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-lg bg-gradient-to-br from-orange-400/20 to-orange-500/20 flex items-center justify-center backdrop-blur-sm border border-orange-500/30">
                  <Zap className="h-5 w-5 lg:h-6 lg:w-6 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-lg lg:text-xl font-bold text-gray-900">{session.title}</h1>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs lg:text-sm text-gray-600">{session.subject}</span>
                    <span className="h-1 w-1 rounded-full bg-gray-400" />
                    <span className="text-xs lg:text-sm text-gray-600">{session.focusLevel} Focus</span>
                    <span className="h-1 w-1 rounded-full bg-gray-400" />
                    <span className="flex items-center gap-1.5 text-xs lg:text-sm text-green-700">
                      <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      Live
                    </span>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={handleLeaveSession}
                className="gap-2 backdrop-blur-sm bg-white/40 border-white/30 hover:bg-red-50/50 hover:border-red-200 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden lg:inline">Leave</span>
              </Button>
            </div>
          </Card>

          {/* Timer & Controls */}
          <Card className="flex-1 p-6 lg:p-8 backdrop-blur-md bg-white/60 border-white/20 flex flex-col items-center justify-center min-h-0">
            <div className="text-center space-y-6 lg:space-y-8 w-full max-w-2xl">
              {/* Large Timer Display */}
              <div>
                <div className="text-5xl sm:text-6xl lg:text-8xl font-bold text-gray-900 font-mono tracking-tight">
                  {formatTime(elapsedTime)}
                </div>
                <p className="text-sm lg:text-base text-gray-600 mt-3 lg:mt-4">Study session in progress</p>
              </div>

              {/* Session Controls */}
              <div className="flex items-center justify-center gap-3 lg:gap-4">
                <Button
                  size="lg"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="h-14 lg:h-16 w-14 lg:w-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg p-0"
                >
                  {isPlaying ? <Pause className="h-6 w-6 lg:h-7 lg:w-7" /> : <Play className="h-6 w-6 lg:h-7 lg:w-7" />}
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 lg:h-14 px-6 lg:px-8 gap-2 backdrop-blur-sm bg-white/40 border-white/30 hover:bg-white/60"
                >
                  <Coffee className="h-5 w-5" />
                  <span className="hidden sm:inline">Take Break</span>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 lg:h-14 px-6 lg:px-8 gap-2 backdrop-blur-sm bg-white/40 border-white/30 hover:bg-white/60"
                >
                  <Hand className="h-5 w-5" />
                  <span className="hidden sm:inline">Raise Hand</span>
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3 lg:gap-4 pt-4 lg:pt-6">
                <div className="p-3 lg:p-4 rounded-lg backdrop-blur-sm bg-white/40 border border-white/30">
                  <p className="text-xs lg:text-sm text-gray-600">Participants</p>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900 mt-1">{participants.length}</p>
                </div>
                <div className="p-3 lg:p-4 rounded-lg backdrop-blur-sm bg-white/40 border border-white/30">
                  <p className="text-xs lg:text-sm text-gray-600">Studying</p>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900 mt-1">
                    {participants.filter((p) => p.status === "studying").length}
                  </p>
                </div>
                <div className="p-3 lg:p-4 rounded-lg backdrop-blur-sm bg-white/40 border border-white/30">
                  <p className="text-xs lg:text-sm text-gray-600">On Break</p>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900 mt-1">
                    {participants.filter((p) => p.status === "on-break").length}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Sidebar - Participants & Activity */}
        <div className="flex flex-col gap-4 lg:gap-6 min-h-0 max-h-[calc(100vh-2rem)] lg:max-h-[calc(100vh-3rem)]">
          {/* Participants Panel */}
          <Card className="p-4 lg:p-5 backdrop-blur-md bg-white/60 border-white/20 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 lg:h-5 lg:w-5 text-gray-700" />
                <h3 className="font-semibold text-gray-900 text-sm lg:text-base">
                  Participants ({participants.length})
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMuted(!isMuted)}
                className="h-8 w-8 p-0 hover:bg-white/40"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center gap-3 p-2 lg:p-2.5 rounded-lg backdrop-blur-sm bg-white/40 hover:bg-white/50 transition-colors"
                >
                  <div className="h-8 w-8 lg:h-9 lg:w-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                    {participant.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 text-xs lg:text-sm truncate">{participant.name}</p>
                      {participant.isHost && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-700 border border-blue-500/20 shrink-0">
                          Host
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] lg:text-xs text-gray-600 capitalize">
                      {participant.status.replace("-", " ")}
                    </p>
                  </div>
                  <div
                    className={`h-2 w-2 rounded-full shrink-0 ${participant.status === "studying" ? "bg-green-500" : "bg-yellow-500"}`}
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* Activity Feed */}
          <Card className="flex-1 p-4 lg:p-5 backdrop-blur-md bg-white/60 border-white/20 flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-4 w-4 lg:h-5 lg:w-5 text-gray-700" />
              <h3 className="font-semibold text-gray-900 text-sm lg:text-base">Activity Feed</h3>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto mb-4 min-h-0">
              {activities.map((activity) => (
                <div key={activity.id} className="p-3 rounded-lg backdrop-blur-sm bg-white/40 border border-white/30">
                  <p className="text-xs lg:text-sm text-gray-900">
                    <span className="font-semibold">{activity.user}</span>{" "}
                    <span className="text-gray-600">{activity.action}</span>
                  </p>
                  <p className="text-[10px] lg:text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="flex gap-2 shrink-0">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Send a message..."
                className="flex-1 px-3 py-2 rounded-lg backdrop-blur-sm bg-white/40 border border-white/30 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <Button
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shrink-0"
              >
                Send
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
