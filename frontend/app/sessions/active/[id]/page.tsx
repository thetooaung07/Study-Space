"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Users, MessageSquare, Pause, Play, Coffee, LogOut, Volume2, VolumeX, Hand, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { StudySessionDTO, ActivityDTO, UserDTO } from "@/types"
import { useAuth } from "@/context/auth-context"
import { TransferSessionHostDialog } from "@/components/sessions/transfer-session-host-modal"

export default function ActiveSessionPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const sessionId = params.id
  
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [message, setMessage] = useState("")
  
  const [session, setSession] = useState<StudySessionDTO | null>(null)
  const [activities, setActivities] = useState<ActivityDTO[]>([])
  const [loading, setLoading] = useState(true)
  
  // Per-user timer tracking
  const [userStartTime, setUserStartTime] = useState<number | null>(null)
  const [totalPausedTime, setTotalPausedTime] = useState(0)
  const [pauseStartTime, setPauseStartTime] = useState<number | null>(null)
  const [hasJoined, setHasJoined] = useState(false)

  // Transfer Host Dialog State
  const [showTransferDialog, setShowTransferDialog] = useState(false)

  // Auto-join session when entering (if not creator)
  useEffect(() => {
    const joinSession = async () => {
      if (!user || !sessionId || hasJoined) return
      
      try {
        const sessionData = await api.get<StudySessionDTO>(`/sessions/${sessionId}`)
        
        // If user is not the creator and not already a participant, join
        const isCreator = sessionData.creatorId === user.id
        const isParticipant = sessionData.participants?.some(p => p.id === user.id)
        
        if (!isCreator && !isParticipant) {
          await api.post(`/sessions/${sessionId}/participants/${user.id}`, {})
          toast.success("Joined session!")
        }
        
        // Set status to STUDYING when entering session
        await api.put(`/users/${user.id}/status?status=STUDYING`, {})
        
        setHasJoined(true)
      } catch (error) {
        console.error("Failed to join session:", error)
      }
    }
    
    joinSession()
  }, [user, sessionId, hasJoined])

  // Fetch session data and activities (separate from timer)
  useEffect(() => {
      if (!sessionId) return

      const fetchData = async () => {
          try {
              const sessionData = await api.get<StudySessionDTO>(`/sessions/${sessionId}`)
              setSession(sessionData)

              const activitiesData = await api.get<ActivityDTO[]>(`/activities/session/${sessionId}`)
              setActivities(activitiesData)
          } catch (error) {
              console.error("Failed to load session:", error)
              toast.error("Failed to load session details")
              router.push("/dashboard")
          } finally {
              setLoading(false)
          }
      }
      
      fetchData()
      
      // Poll for updates every 10 seconds
      const pollInterval = setInterval(fetchData, 10000)
      return () => clearInterval(pollInterval)
  }, [sessionId, router])

  // Initialize user's timer based on server data
  useEffect(() => {
    if (session && user) {
        // Find current user in participants to get true join time
        // Use loose equality (==) to handle potential string/number mismatches
        const currentUserParticipant = session.participants?.find(p => p.id == user.id)
        
        if (currentUserParticipant) {
             // 1. Join Time
            if (currentUserParticipant.joinedAt) {
                const joinedTime = new Date(currentUserParticipant.joinedAt).getTime()
                if (!isNaN(joinedTime)) {
                    setUserStartTime(joinedTime)
                }
            }

            // 2. Pause Logic
            let historicalPausedSeconds = currentUserParticipant.totalPausedSeconds || 0
            let currentActivePauseCals = 0

            // If currently paused (has lastPausedAt timestamp), calculate duration until NOW
            if (currentUserParticipant.lastPausedAt) {
                const lastPausedTime = new Date(currentUserParticipant.lastPausedAt).getTime()
                if (!isNaN(lastPausedTime)) {
                     // Timer is currently PAUSED
                     setIsPlaying(false)
                     // Add the duration from last pause until now to total
                     currentActivePauseCals = (new Date().getTime() - lastPausedTime) / 1000
                }
            } else {
                // If no lastPausedAt, user is actively studying
                setIsPlaying(true)
            }

            // Set total paused time (converting seconds to ms)
            // SMOOTHING FIX: Only update if significant difference (>2s) to avoid jitter from network latency
            const serverTotalPausedMs = (historicalPausedSeconds + currentActivePauseCals) * 1000
            
            setTotalPausedTime(prev => {
                const diff = Math.abs(serverTotalPausedMs - prev)
                // If difference is small (< 2000ms), prefer local state to prevent UI jumps
                // But ALWAYS update if we are initializing (prev === 0)
                if (prev === 0 || diff > 2000) {
                    return serverTotalPausedMs
                }
                return prev
            })
            
            // Calculate initial elapsed time immediately if not yet set
            const startTime = currentUserParticipant.joinedAt 
                ? new Date(currentUserParticipant.joinedAt).getTime() 
                : new Date().getTime()
            
            if (!isNaN(startTime) && elapsedTime === 0) {
                 const now = new Date().getTime()
                 const elapsed = Math.floor((now - startTime - serverTotalPausedMs) / 1000)
                 setElapsedTime(elapsed > 0 ? elapsed : 0)
            }

        } else if (!userStartTime) {
             setUserStartTime(new Date().getTime())
        }
    }
  }, [session, user])

  // User's personal stopwatch timer - runs independently every second
  useEffect(() => {
    if (!isPlaying || !userStartTime) return

    // Calculate elapsed time every second
    const timerInterval = setInterval(() => {
      const now = new Date().getTime()
      // totalPausedTime needs to stay static here while playing? 
      // Actually, standard stopwatch logic: elapsed = (Now - Start) - TotalPaused
      const elapsed = Math.floor((now - userStartTime - totalPausedTime) / 1000)
      setElapsedTime(elapsed > 0 ? elapsed : 0)
    }, 1000)

    return () => clearInterval(timerInterval)
  }, [isPlaying, userStartTime, totalPausedTime])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }

  const formatSessionStartTime = (startTime?: string) => {
    if (!startTime) return "Not started"
    const date = new Date(startTime)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const handleTransferAndLeave = async (newHostId: number) => {
    if (!user || !sessionId) return
    try {
      // 1. Transfer Host
      await api.put(`/sessions/${sessionId}/transfer?newHostId=${newHostId}`, {})
      
      // 2. Perform Leave Logic
      if (userStartTime) {
          const now = new Date().getTime()
          const totalElapsed = now - userStartTime - totalPausedTime
          const studyMinutes = Math.floor(totalElapsed / 60000)
          
          await api.delete(`/sessions/${sessionId}/participants/${user.id}?studyMinutes=${studyMinutes}`)
          toast.success("Host transferred and left session")
      }
      
      await api.put(`/users/${user.id}/status?status=ONLINE`, {})
      
      if (session?.studyGroupId) {
        router.push(`/groups/${session.studyGroupId}`)
      } else {
        router.push('/dashboard')
      }

    } catch (error) {
      console.error("Failed to transfer and leave:", error)
      toast.error("Failed to transfer host")
    }
  }

  const handleLeaveSession = async () => {
    if (!user || !session) return
    
    const isCreator = session.creatorId === user.id
    // Active participants excluding self
    const otherParticipants = (session.participants || []).filter(p => !p.leftAt && p.id !== user.id)

    if (isCreator && otherParticipants.length > 0) {
      // Prompt Transfer
      setShowTransferDialog(true)
      return
    }
    
    const confirmMessage = isCreator
        ? "Are you sure you want to end this session? Since you are the only one here, it will be closed."
        : "Are you sure you want to leave this session?"
    
    if (!confirm(confirmMessage)) return
  
    try {
        if (userStartTime) {
          const now = new Date().getTime()
          const totalElapsed = now - userStartTime - totalPausedTime
          const studyMinutes = Math.floor(totalElapsed / 60000)
          
          await api.delete(`/sessions/${sessionId}/participants/${user.id}?studyMinutes=${studyMinutes}`)
          toast.success("Left session")
        }
      
      await api.put(`/users/${user.id}/status?status=ONLINE`, {})
      
      if (session.studyGroupId) {
        router.push(`/groups/${session.studyGroupId}`)
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error("Failed to leave session:", error)
      toast.error("Failed to leave session")
    }
  }
  

  const handlePauseToggle = async () => {
    const newIsPlaying = !isPlaying
    setIsPlaying(newIsPlaying)
    const now = new Date().getTime()

    if (user && sessionId) {
        try {
            if (!newIsPlaying) {
                // User is pausing (going on break)
                setPauseStartTime(now)
                
                await api.put(`/sessions/${sessionId}/participants/${user.id}/pause`, {})
                await api.put(`/users/${user.id}/status?status=AWAY`, {})
            } else {
               
                let currentPauseStart = pauseStartTime
                
             
                const currentUserParticipant = session?.participants?.find(p => p.id == user.id)
                if (currentUserParticipant?.lastPausedAt) {
                     const serverPauseStart = new Date(currentUserParticipant.lastPausedAt).getTime()
                     if (!isNaN(serverPauseStart)) {
                         currentPauseStart = serverPauseStart
                     }
                }
                
                if (currentPauseStart) {
                    const pauseDuration = now - currentPauseStart
                
                    const historicalSeconds = currentUserParticipant?.totalPausedSeconds || 0
                    const newTotalMs = (historicalSeconds * 1000) + pauseDuration
                    
                    setTotalPausedTime(prev => Math.max(prev, newTotalMs))
                }
                
                setPauseStartTime(null)

                await api.put(`/sessions/${sessionId}/participants/${user.id}/resume`, {})
                await api.put(`/users/${user.id}/status?status=STUDYING`, {})
                
              
            }
        } catch (error) {
            console.error("Failed to sync pause state:", error)
            setIsPlaying(!newIsPlaying)
            toast.error("Failed to update status")
        }
    }
  }

  const handleRaiseHand = async () => {
    if (!user || !sessionId) return
    try {
      const params = new URLSearchParams({
        sessionId: sessionId as string,
        userId: user.id.toString(),
        type: "HAND_RAISE",
        message: `${user.fullName} raised their hand`
      })
      
      await api.post(`/activities?${params.toString()}`, {})
      toast.success("Hand raised! ✋")
    } catch (e) {
      console.error("Failed to raise hand", e)
    }
  }

  const handleSendMessage = async () => {
      if (!message.trim() || !user || !sessionId) return
      try {
          const params = new URLSearchParams({
              sessionId: sessionId as string,
              userId: user.id.toString(),
              type: "MESSAGE", 
              message: message
          })
          
          await api.post(`/activities?${params.toString()}`, {})
          
          setMessage("")
      } catch (e) {
          console.error("Failed to send message", e)
          toast.error("Failed to send message")
      }
  }

  if (loading) {
      return <div className="min-h-screen flex items-center justify-center">Loading session...</div>
  }

  if (!session) return null

  const participantsList = session.participants || []

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
                    <span className="text-xs lg:text-sm text-gray-600">Started: {formatSessionStartTime(session.startTime)}</span>
                    <span className="h-1 w-1 rounded-full bg-gray-400" />
                    <span className="flex items-center gap-1.5 text-xs lg:text-sm text-green-700">
                      <span className={`h-2 w-2 rounded-full ${session.status === 'ACTIVE' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                      {session.status === 'ACTIVE' ? 'Live' : 'Scheduled'}
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
                <span className="hidden lg:inline">
                  {session.creatorId === user?.id && participantsList.length > 1 ? "End / Leave" : "Leave Session"}
                </span>
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
                <p className="text-sm lg:text-base text-gray-600 mt-3 lg:mt-4">
                    Your study time {isPlaying ? '(studying)' : '(on break)'}
                </p>
              </div>

              {/* Session Controls */}
              <div className="flex items-center justify-center gap-3 lg:gap-4">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handlePauseToggle}
                  className={`w-36 h-12 lg:h-14 px-6 lg:px-8 gap-2 ${
                    !isPlaying 
                      ? 'text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:text-white  border-transparent' 
                      : 'backdrop-blur-sm bg-white/40 border-white/30 hover:bg-white/60'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Coffee className="h-5 w-5" />
                      <span className="hidden sm:inline">Take a Break</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5" />
                      <span className="hidden sm:inline">Resume</span>
                    </>
                  )}
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleRaiseHand}
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
                  <p className="text-xl lg:text-2xl font-bold text-gray-900 mt-1">{participantsList.length}</p>
                </div>
                <div className="p-3 lg:p-4 rounded-lg backdrop-blur-sm bg-white/40 border border-white/30">
                  <p className="text-xs lg:text-sm text-gray-600">Studying</p>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900 mt-1">
                    {participantsList.filter(p => !p.currentStatus || p.currentStatus === 'STUDYING' || p.currentStatus === 'ONLINE').length}
                  </p>
                </div>
                <div className="p-3 lg:p-4 rounded-lg backdrop-blur-sm bg-white/40 border border-white/30">
                  <p className="text-xs lg:text-sm text-gray-600">On Break</p>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900 mt-1">
                     {participantsList.filter(p => p.currentStatus === 'AWAY').length}
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
                  Participants ({participantsList.length})
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
              {participantsList.map((participant: UserDTO) => (
                <div
                  key={participant.id}
                  className="flex items-center gap-3 p-2 lg:p-2.5 rounded-lg backdrop-blur-sm bg-white/40 hover:bg-white/50 transition-colors"
                >
                  <Avatar className="h-8 w-8 lg:h-9 lg:w-9 shrink-0">
                    <AvatarImage src={participant.profilePictureUrl || ""} alt={participant.fullName} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-400 text-white text-xs font-semibold">
                      {participant.fullName
                        ? participant.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                        : participant.username?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 text-xs lg:text-sm truncate">{participant.fullName}</p>
                      {participant.id === session.creatorId && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-700 border border-blue-500/20 shrink-0">
                          Host
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] lg:text-xs text-gray-600 capitalize">
                      {participant.currentStatus?.toLowerCase() || 'offline'}
                    </p>
                  </div>
                  <div
                    className={`h-2 w-2 rounded-full shrink-0 ${participant.currentStatus === "STUDYING" || participant.currentStatus === 'ONLINE' ? "bg-green-500" : "bg-yellow-500"}`}
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
              {activities.length === 0 ? <p className="text-xs text-gray-500 text-center">No recent activity</p> : 
               activities.map((activity) => (
                <div key={activity.id} className="p-3 rounded-lg backdrop-blur-sm bg-white/40 border border-white/30">
                  <p className="text-xs lg:text-sm text-gray-900">
                    <span className="font-semibold">{activity.userName || "Unknown"}</span>{" "}
                    <span className="text-gray-600">{activity.message || activity.type}</span>
                  </p>
                  <p className="text-[10px] lg:text-xs text-gray-500 mt-1">{new Date(activity.timestamp).toLocaleTimeString()}</p>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="flex gap-2 shrink-0 items-center">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Send a message..."
                className="flex-1 px-3 py-2 rounded-lg backdrop-blur-sm bg-white/40 border border-white/30 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <Button
                size="sm"
                onClick={handleSendMessage}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shrink-0"
              >
                Send
              </Button>
            </div>
          </Card>
        </div>

        <TransferSessionHostDialog 
            open={showTransferDialog} 
            onOpenChange={setShowTransferDialog}
            sessionTitle={session?.title || "Session"}
            participants={(session?.participants || []).filter(p => p.id !== user?.id && !p.leftAt)}
            onTransferAndLeave={handleTransferAndLeave}
        />
      </div>
    </div>
  )
}
