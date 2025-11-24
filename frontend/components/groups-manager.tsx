"use client"

import { useState } from "react"
import { Plus, Search } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GroupCard } from "@/components/group-card"
import { CreateGroupModal } from "@/components/create-group-modal"

export function GroupsManager() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const myGroups = [
    {
      id: 1,
      name: "CS101 Study Gang",
      description: "Computer Science fundamentals and algorithms",
      members: 12,
      activeMembers: 8,
      avatar: "👨‍💻",
      sessions: 24,
      privacy: "public",
      admin: "You",
      joinedDate: "Oct 15, 2025",
    },
    {
      id: 2,
      name: "Morning Grinders",
      description: "Early morning study sessions for motivation",
      members: 8,
      activeMembers: 5,
      avatar: "🌅",
      sessions: 45,
      privacy: "private",
      admin: "Sarah Chen",
      joinedDate: "Sep 20, 2025",
    },
    {
      id: 3,
      name: "Math Wizards",
      description: "Advanced mathematics and calculus mastery",
      members: 6,
      activeMembers: 3,
      avatar: "🧙",
      sessions: 18,
      privacy: "public",
      admin: "Alex Kumar",
      joinedDate: "Aug 10, 2025",
    },
  ]

  const suggestedGroups = [
    {
      id: 4,
      name: "Physics Enthusiasts",
      description: "Quantum mechanics and classical physics",
      members: 34,
      activeMembers: 12,
      avatar: "⚛️",
      sessions: 67,
      privacy: "public",
    },
    {
      id: 5,
      name: "Language Learners Hub",
      description: "Learn new languages together",
      members: 52,
      activeMembers: 18,
      avatar: "🌍",
      sessions: 89,
      privacy: "public",
    },
    {
      id: 6,
      name: "Programming Bootcamp",
      description: "Full-stack development intensive",
      members: 28,
      activeMembers: 15,
      avatar: "💻",
      sessions: 54,
      privacy: "public",
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Study Groups</h2>
          <p className="text-muted-foreground mt-1">Join communities and collaborate with peers</p>
        </div>
        <Button onClick={() => setShowCreateModal(!showCreateModal)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Group
        </Button>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && <CreateGroupModal onClose={() => setShowCreateModal(false)} />}

      {/* Search Bar */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search groups by name or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </Card>

      {/* My Groups Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">My Groups</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myGroups.map((group) => (
            <GroupCard key={group.id} group={group} isOwned />
          ))}
        </div>
      </div>

      {/* Suggested Groups Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">Suggested Groups</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suggestedGroups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      </div>
    </div>
  )
}
