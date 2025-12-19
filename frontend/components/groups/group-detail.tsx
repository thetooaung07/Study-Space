"use client"

import { Settings, MessageSquare, Share2, Bell, BarChart3 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface GroupDetailProps {
  groupId: number
}

export function GroupDetail({ groupId }: GroupDetailProps) {
  const group = {
    id: groupId,
    name: "CS101 Study Gang",
    description: "Computer Science fundamentals and algorithms",
    members: 12,
    admin: "You",
    avatar: "👨‍💻",
    sessions: 24,
    lastActive: "Today at 3:45 PM",
    joinedDate: "Oct 15, 2025",
    rules: [
      "Be respectful and supportive",
      "Share resources and notes",
      "No spamming or promotions",
      "Active participation encouraged",
    ],
  }

  const members = [
    { id: 1, name: "You", status: "admin", avatar: "👨‍🎓" },
    { id: 2, name: "Sarah Chen", status: "member", avatar: "👩‍🎓" },
    { id: 3, name: "Alex Kumar", status: "member", avatar: "👨‍💻" },
    { id: 4, name: "Mike Johnson", status: "member", avatar: "👨‍🎓" },
    { id: 5, name: "Emily Davis", status: "member", avatar: "👩‍💻" },
  ]

  return (
    <div className="space-y-6">
      {/* Group Header */}
      <Card className="p-8 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-6">
            <div className="text-6xl">{group.avatar}</div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{group.name}</h1>
              <p className="text-muted-foreground mt-2">{group.description}</p>
              <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
                <span>{group.members} members</span>
                <span>{group.sessions} sessions</span>
                <span>Active: {group.lastActive}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/groups/analytics/${groupId}`}>
              <Button variant="outline" size="icon">
                <BarChart3 className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Group Rules */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Group Rules</h3>
            <ul className="space-y-3">
              {group.rules.map((rule, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">{idx + 1}</span>
                  </div>
                  <span className="text-muted-foreground">{rule}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Recent Sessions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Recent Group Sessions</h3>
            <div className="space-y-3">
              {[1, 2, 3].map((session) => (
                <div key={session} className="p-3 rounded-lg border border-border hover:bg-primary/5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-foreground">Algorithm Deep Dive Session</p>
                      <p className="text-sm text-muted-foreground">Today, 2:30 PM - 3:45 PM</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Members */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Members</h3>
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{member.avatar}</div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{member.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{member.status}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

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
  )
}
