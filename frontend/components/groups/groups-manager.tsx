"use client"

import { useState, useEffect } from "react"
import { Plus, Search } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GroupCard } from "@/components/groups/group-card"
import { CreateGroupModal } from "@/components/groups/create-group-modal"
import { api } from "@/lib/api"
import { StudyGroupDTO } from "@/types"

export function GroupsManager() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [myGroups, setMyGroups] = useState<StudyGroupDTO[]>([])
  const [suggestedGroups, setSuggestedGroups] = useState<StudyGroupDTO[]>([])

  // TODO: dynamic user ID
  const userId = 1

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const userGroups = await api.get<StudyGroupDTO[]>(`/groups/user/${userId}`)
        setMyGroups(userGroups)

        // TODO: This endpoint should probably be filtered on the backend for "not joined"
        // For now finding a creator that isn't me as a proxy for "suggested" or just listing all
        // Assuming there isn't a dedicated "suggested" endpoint yet, using createdGroups for demo
        // or just fetching a random set if an all-groups endpoint existed.
        // Re-using userGroups logic for now or needs new backend endpoint.
        // Let's assume we want to show groups I DON'T own/member. 
        // Since we don't have a "getAllGroups" that excludes mine easily without logic,
        // we'll leave suggested empty or implement a getAll endpoint later.
        // For now, let's just use the same list to verify data flow, or fetch 'all' if possible?
        // Actually, StudyGroupController has no "getAll", so we'll skip suggested for now or fetch by ID.
      } catch (error) {
        console.error("Failed to fetch groups", error)
      }
    }
    fetchGroups()
  }, [])

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
        {myGroups.length === 0 ? (
           <p className="text-muted-foreground">You haven't joined any groups yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myGroups.map((group) => (
              <GroupCard key={group.id} group={group} isOwned={group.creatorId === userId} />
            ))}
          </div>
        )}
      </div>

      {/* Suggested Groups Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">Suggested Groups</h3>
         <p className="text-muted-foreground text-sm">Explore more groups coming soon...</p>
        {/* 
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suggestedGroups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div> 
        */}
      </div>
    </div>
  )
}
