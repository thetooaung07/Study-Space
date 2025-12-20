"use client"

import { useEffect, useState } from "react"
import { Settings, MessageSquare, Share2, Bell, BarChart3, Plus, Globe, Lock, Clock, Users, Play, CloudCog } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import Link from "next/link"
import { Sidebar } from "@/components/common/sidebar"
import { Header } from "@/components/common/header"
import { api } from "@/lib/api"
import { useAuth } from "@/context/auth-context"
import { StudyGroupDTO, StudySessionDTO } from "@/types"
import { CreateGroupSessionModal } from "@/components/groups/create-group-session-modal"
import { useParams, useRouter } from "next/navigation"


export default function GroupDetailPage() {

  const params = useParams()
  const router = useRouter()
  const groupId = params.groupId as string
  const [activeTab, setActiveTab] = useState<"sessions" | "members">("sessions")
  const [isCreateSessionModalOpen, setIsCreateSessionModalOpen] = useState(false)
  
  const [group, setGroup] = useState<StudyGroupDTO | null>(null)
  const [sessions, setSessions] = useState<StudySessionDTO[]>([])
  // For now using simple member count/list as mock since full member endpoint might differ
  const [members, setMembers] = useState<any[]>([]) 
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  // Fetch data
  useEffect(() => {
    if (!groupId) return

    const fetchData = async () => {
      setLoading(true)
      try {
        const details = await api.get<any>(`/groups/${groupId}/details${user ? `?requestingUserId=${user.id}` : ''}`)
        setGroup(details.group)
        setSessions(details.sessions)
        setMembers(details.members)

      } catch (error) {
        console.error("Failed to fetch group data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [groupId, user])

  const formatStudyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}m`
  }

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

  if (loading || !group) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <p>Loading group...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Group Header */}
            <Card className="p-8 bg-gradient-to-r from-[rgb(from_var(--pale-blue)_r_g_b)]/40 to-[rgb(from_var(--pale-purple)_r_g_b)]/40 backdrop-blur-md border-white/40">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-6">
                  <div className="text-6xl">👨‍💻</div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold text-foreground">{group.name}</h1>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground bg-white/50 backdrop-blur-sm px-2 py-1 rounded">
                        {group.groupType === "PUBLIC" ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                        <span className="capitalize">{group.groupType}</span>
                      </div>
                    </div>
                    <p className="text-muted-foreground mt-2">{group.description}</p>
                    <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
                      <span>{group.memberCount} members</span>
                      <span>{sessions.length} sessions</span>
                      {/* <span>{formatStudyTime(group.totalStudyTime)} studied</span> */}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/groups/${groupId}/analytics`}>
                    <Button variant="outline" size="icon" className="bg-white/40 backdrop-blur-sm border-white/50">
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="outline" size="icon" className="bg-white/40 backdrop-blur-sm border-white/50">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="bg-white/40 backdrop-blur-sm border-white/50">
                    <Bell className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Tabs */}
            <div className="flex items-center gap-4 border-b border-border">
              <button
                onClick={() => setActiveTab("sessions")}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === "sessions"
                    ? "text-foreground border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sessions ({sessions.length})
              </button>
              <button
                onClick={() => setActiveTab("members")}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === "members"
                    ? "text-foreground border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Members ({members.length})
              </button>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {activeTab === "sessions" && (
                  <Card className="p-6 bg-white/60 backdrop-blur-md border-white/40">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-foreground">Group Sessions</h3>
                      <Button size="sm" className="gap-2" onClick={() => setIsCreateSessionModalOpen(true)}>
                        <Plus className="h-4 w-4" />
                        New Session
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {sessions.length === 0 ? (
                         <div className="text-center py-8 text-muted-foreground">
                            No active sessions found for this group.
                         </div>
                      ) : (
                        sessions
                        .sort((a, b) => {
                            // Sort by Status: ACTIVE first
                            if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
                            if (a.status !== 'ACTIVE' && b.status === 'ACTIVE') return 1;
                            // Then Sort by CreatedAt Descending (newest first)
                            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                        })
                        .map((session) => (
                        <div
                          key={session.id}
                          className={`p-4 rounded-lg border border-border bg-gradient-to-r ${subjectColors[session.subject] || subjectColors['OTHER']}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h4 className="font-semibold text-foreground">{session.title}</h4>
                                {session.status === 'ACTIVE' && (
                                  <span className="text-xs px-2 py-1 rounded-full bg-pale-green text-status-live-fg border border-pale-green/50">
                                    ● Live
                                  </span>
                                )}
                                {session.visibility === "PUBLIC" ? (
                                  <Globe className="h-3 w-3 text-muted-foreground" />
                                ) : (
                                  <Lock className="h-3 w-3 text-muted-foreground" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">Hosted by {session.creator?.fullName || session.creator?.username || `User #${session.creatorId}`}</p>
                              <div className="text-xs text-muted-foreground mt-1">
                                {session.status === 'ACTIVE' ? (
                                  <span>Started: {new Date(session.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                ) : (
                                  <span>Ended: {new Date(session.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {session.endTime ? new Date(session.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Now'}</span>
                                )}
                              </div>
                            </div>
                            {session.status === "ACTIVE" && (session.visibility === "PUBLIC" || (session.visibility === "PRIVATE" && user?.id === session.creatorId)) && (
                              <Link href={`/sessions/active/${session.id}`}>
                                <Button size="sm" className="gap-2">
                                  <Play className="h-4 w-4" />
                                  Join
                                </Button>
                              </Link>
                            )}
                          </div>
                          <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{session.duration || "0m"}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{session.participantCount} participants</span>
                            </div>
                          </div>
                        </div>
                      )))}
                    </div>
                  </Card>
                )}

                {activeTab === "members" && (
                  <Card className="p-6 bg-white/60 backdrop-blur-md border-white/40">
                    <h3 className="text-lg font-semibold text-foreground mb-6">Group Members</h3>
                    <div className="space-y-4">
                      {members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-white/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <Avatar className="w-10 h-10">
                                <AvatarImage src={member.profilePictureUrl || "/placeholder.svg"} />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                    {member.fullName
                                    ? member.fullName
                                        .split(" ")
                                        .map((n: string) => n[0])
                                        .join("")
                                    : member.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-foreground">{member.fullName}</p>
                                {member.isAdmin && (
                                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Admin</span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground capitalize">
                                {member.currentStatus.toLowerCase()}
                              </p>
                              {/* Study time not currently available in simple member list, would need calling stats endpoint */}
                            </div>
                          </div>
                          {/* TODO: View Profile */}
                          {/* <Button variant="outline" size="sm" className="bg-white/40 backdrop-blur-sm border-white/50">
                            View Profile
                          </Button> */}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>

              {/* Right Column - Sidebar */}
              <div className="space-y-6">
                {/* Group Rules */}
                {/* <Card className="p-6 bg-white/60 backdrop-blur-md border-white/40">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Group Rules</h3>
                  <ul className="space-y-3">
                    {["Be respectful", "Share knowledge", "Have fun"].map((rule, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-primary">{idx + 1}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{rule}</span>
                      </li>
                    ))}
                  </ul>
                </Card> */}

                {/* Group Actions */}
                <div className="space-y-2">
                  <Button className="w-full gap-2 bg-transparent" variant="outline">
                    <Share2 className="h-4 w-4" />
                    Share Invite
                  </Button>
                  <Button className="w-full gap-2 bg-transparent" variant="outline">
                    <MessageSquare className="h-4 w-4" />
                    Message Group
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <CreateGroupSessionModal
        open={isCreateSessionModalOpen}
        onOpenChange={setIsCreateSessionModalOpen}
        groupId={groupId}
        groupName={group.name}
        onSuccess={(session) => {
           if (session?.id) {
             router.push(`/sessions/active/${session.id}`)
           } else {
             // Fallback: Reload sessions if no ID passed (shouldn't happen with new modal logic)
             const fetchSessions = async () => {
               try {
                  const sessionsData = await api.get<StudySessionDTO[]>(`/sessions/group/${groupId}${user ? `?requestingUserId=${user.id}` : ''}`)
                  setSessions(sessionsData)
               } catch(e) { console.error(e) }
             }
             fetchSessions()
           }
        }}
      />
    </div>
  )
}
