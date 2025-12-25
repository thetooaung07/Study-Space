"use client"

import { useState, useEffect, use } from "react"
import { Calendar, Clock, TrendingUp, Award, ArrowLeft, Filter, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { api } from "@/lib/api"
import { StudyGroupDTO, GroupMemberStatsDTO, GroupStatsDTO } from "@/types"
import { useAuth } from "@/context/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

/** Format minutes to human-readable time */
function formatStudyTime(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }
  return `${minutes}m`
}

/** Get days ago date */
function getDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

export default function GroupAnalyticsPage({ params }: { params: Promise<{ groupId: string }> }) {
  const resolvedParams = use(params)
  const groupId = resolvedParams.groupId
  const { user } = useAuth()
  
  const [dateRange, setDateRange] = useState<"thisWeek" | "thisMonth" | "allTime">("thisMonth")
  const [group, setGroup] = useState<StudyGroupDTO | null>(null)
  const [members, setMembers] = useState<GroupMemberStatsDTO[]>([])
  const [stats, setStats] = useState<GroupStatsDTO | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !groupId) return

    const fetchData = async () => {
      setLoading(true)
      try {
        // Check membership first
        const details = await api.get<any>(`/groups/${groupId}/details?requestingUserId=${user.id}`)
        
        const isMember = details.members.some((m: any) => m.id === user.id)
        if (!isMember) {
          // specific error or just redirect
          window.location.href = `/groups/${groupId}`
          return
        }

        setGroup(details.group)

        // Get date range based on selection
        let sinceDate: string
        switch (dateRange) {
          case "thisWeek":
            sinceDate = getDaysAgo(7)
            break
          case "thisMonth":
            sinceDate = getDaysAgo(30)
            break
          case "allTime":
            sinceDate = getDaysAgo(365 * 5) // 5 years ago
            break
        }

        // Fetch group stats
        const statsData = await api.get<GroupStatsDTO>(`/groups/${groupId}/stats?cutoffDate=${sinceDate}`)
        setStats(statsData)

        // Fetch member leaderboard using the complex JPQL query
        const membersData = await api.get<GroupMemberStatsDTO[]>(
          `/groups/${groupId}/members/leaderboard?since=${sinceDate}&minMinutes=0`
        )
        setMembers(membersData)
      } catch (error) {
        console.error("Failed to fetch analytics data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [groupId, dateRange, user])

  const maxMinutes = members.length > 0 ? Math.max(...members.map((m) => m.totalMinutes)) : 1

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--pale-blue)] via-[var(--pale-purple)] to-[var(--pale-green)] p-6 lg:p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--pale-blue)] via-[var(--pale-purple)] to-[var(--pale-green)] p-6 lg:p-8 flex items-center justify-center">
        <p className="text-muted-foreground">Group not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--pale-blue)] via-[var(--pale-purple)] to-[var(--pale-green)] p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/groups">
              <Button variant="outline" size="icon" className="backdrop-blur-md bg-white/60 border-white/40">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="text-4xl">👨‍💻</div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{group.name}</h1>
                <p className="text-muted-foreground">Group Analytics & Performance</p>
              </div>
            </div>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-2">
            <Button
              variant={dateRange === "thisWeek" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRange("thisWeek")}
              className={dateRange === "thisWeek" ? "" : "backdrop-blur-md bg-white/60 border-white/40 hover:bg-secondary"}
            >
              This Week
            </Button>
            
            <Button
              variant={dateRange === "thisMonth" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRange("thisMonth")}
              className={dateRange === "thisMonth" ? "" : "backdrop-blur-md bg-white/60 border-white/40 hover:bg-secondary"}
            >
              This Month
            </Button>
            <Button
              variant={dateRange === "allTime" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRange("allTime")}
              className={dateRange === "allTime" ? "" : "backdrop-blur-md bg-white/60 border-white/40 hover:bg-secondary"}
            >
              All Time
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-5 backdrop-blur-md bg-white/60 border-white/40 hover:bg-white/70 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <p className="text-sm text-muted-foreground">Total Study Time</p>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatStudyTime(stats?.totalStudyMinutes || 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Combined group time</p>
          </Card>

          <Card className="p-5 backdrop-blur-md bg-white/60 border-white/40 hover:bg-white/70 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <p className="text-sm text-muted-foreground">Group Sessions</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats?.sessionCount || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Sessions completed</p>
          </Card>

          <Card className="p-5 backdrop-blur-md bg-white/60 border-white/40 hover:bg-white/70 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Award className="h-5 w-5 text-orange-600" />
              <p className="text-sm text-muted-foreground">Active Members</p>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {stats?.activeMemberCount || 0} / {group.memberCount}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {group.memberCount > 0 
                ? `${Math.round(((stats?.activeMemberCount || 0) / group.memberCount) * 100)}% participation`
                : 'No members yet'}
            </p>
          </Card>

          <Card className="p-5 backdrop-blur-md bg-white/60 border-white/40 hover:bg-white/70 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="h-5 w-5 text-green-600" />
              <p className="text-sm text-muted-foreground">Avg Session Length</p>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatStudyTime(Math.round(stats?.averageSessionDuration || 0))}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Per session</p>
          </Card>
        </div>

        {/* Top Users by Study Time */}
        <Card className="p-6 backdrop-blur-md bg-white/60 border-white/40">
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Top Members by Study Time
          </h2>

          {members.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No study activity recorded yet for this period
            </p>
          ) : (
            <div className="space-y-3">
              {members.map((member, index) => {
                const rank = index + 1
                const isCurrentUser = user?.id === member.userId
                const avgMinutes = member.sessionCount > 0 
                  ? Math.round(member.totalMinutes / member.sessionCount) 
                  : 0
                
                return (
                  <div
                    key={member.userId}
                    className={`p-4 rounded-xl border transition-all ${
                      isCurrentUser
                        ? "bg-blue-50/80 border-blue-200/60 shadow-sm"
                        : "bg-white/40 border-white/40 hover:bg-white/60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4 flex-1">
                        {/* Rank Badge */}
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                            rank === 1
                              ? "bg-yellow-100 text-yellow-700"
                              : rank === 2
                                ? "bg-gray-100 text-gray-700"
                                : rank === 3
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-gray-50 text-gray-600"
                          }`}
                        >
                          {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`}
                        </div>

                        {/* User Info */}
                        <div className="flex items-center gap-3 flex-1">
                          <Avatar className="w-12 h-12 border-2 border-white/50 shadow-sm">
                            <AvatarImage src={member.profilePictureUrl || "/placeholder.svg"} />
                            <AvatarFallback className="bg-pale-blue/60 text-foreground font-semibold">
                              {member.fullName
                                ? member.fullName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .substring(0, 2)
                                : "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-foreground">{member.fullName || "Unknown"}</p>
                              {isCurrentUser && (
                                <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">You</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{member.sessionCount} sessions</p>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="hidden lg:flex items-center gap-8">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-foreground">{formatStudyTime(member.totalMinutes)}</p>
                            <p className="text-xs text-muted-foreground">Total Time</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xl font-semibold text-foreground">{member.sessionCount}</p>
                            <p className="text-xs text-muted-foreground">Sessions</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-medium text-foreground">{formatStudyTime(avgMinutes)}</p>
                            <p className="text-xs text-muted-foreground">Avg Time</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${(member.totalMinutes / maxMinutes) * 100}%` }}
                        className={`h-full transition-all ${
                          rank === 1
                            ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                            : rank === 2
                              ? "bg-gradient-to-r from-gray-400 to-gray-600"
                              : rank === 3
                                ? "bg-gradient-to-r from-orange-400 to-orange-600"
                                : "bg-gradient-to-r from-blue-400 to-purple-500"
                        }`}
                      />
                    </div>

                    {/* Mobile Stats */}
                    <div className="lg:hidden grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-200">
                      <div className="text-center">
                        <p className="text-sm font-bold text-foreground">{formatStudyTime(member.totalMinutes)}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-foreground">{member.sessionCount}</p>
                        <p className="text-xs text-muted-foreground">Sessions</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">{formatStudyTime(avgMinutes)}</p>
                        <p className="text-xs text-muted-foreground">Avg</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
