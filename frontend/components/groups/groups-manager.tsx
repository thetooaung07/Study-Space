"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreateGroupModal } from "@/components/groups/create-group-modal"
import { GroupCard } from "@/components/groups/group-card"
import { api } from "@/lib/api"
import { useAuth } from "@/context/auth-context"
import { StudyGroupDTO } from "@/types"
import { Filter } from "lucide-react" // Added import for Filter icon

export function GroupsManager() {
  const { user } = useAuth()
  const [showCreateModal, setShowCreateModal] = useState(false) // This state is replaced by isCreateModalOpen
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState("all") // New state
  const [myGroups, setMyGroups] = useState<StudyGroupDTO[]>([])
  const [allGroups, setAllGroups] = useState<StudyGroupDTO[]>([])
  const [isLoading, setIsLoading] = useState(true) // Renamed from loading
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false) // New state
  const [editingGroup, setEditingGroup] = useState<StudyGroupDTO | undefined>(undefined) // New state

  const fetchGroups = async () => {
    if (!user) return
    try {
      setIsLoading(true)
      const [myGroupsRes, allGroupsRes] = await Promise.all([
        api.get<StudyGroupDTO[]>(`/groups/user/${user.id}`),
        api.get<StudyGroupDTO[]>("/groups")
      ])
      setMyGroups(myGroupsRes)
      setAllGroups(allGroupsRes)
    } catch (error) {
      console.error("Failed to fetch groups:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchGroups()
  }, [user])

  const handleGroupSaved = () => { // Renamed from handleGroupCreated
    setIsCreateModalOpen(false)
    setEditingGroup(undefined)
    fetchGroups()
  }

  const handleJoinGroup = async (groupId: number) => {
    if (!user) return
    try {
      await api.post(`/groups/${groupId}/members/${user.id}`, {})
      fetchGroups()
    } catch (error) {
      console.error("Failed to join group:", error)
    }
  }
  
  const handleEditGroup = (group: StudyGroupDTO) => {
    setEditingGroup(group)
    setIsCreateModalOpen(true)
  }
  
  const handleDeleteGroup = async (groupId: number) => {
    if (!confirm("Are you sure you want to delete this group?")) return
    try {
      await api.delete(`/groups/${groupId}`)
      fetchGroups()
    } catch (error) {
      console.error("Failed to delete group:", error)
    }
  }
  
  const handleCloseModal = () => {
    setIsCreateModalOpen(false)
    setEditingGroup(undefined)
  }

  // Filter suggested groups (groups I'm not in)
  const myGroupIds = new Set(myGroups.map(g => g.id))
  const suggestedGroups = allGroups
    .filter(g => !myGroupIds.has(g.id))
    .filter(g => 
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (g.description || "").toLowerCase().includes(searchQuery.toLowerCase())
    )

  // Filter my groups by search (kept for consistency, though not explicitly in the new JSX)
  const filteredMyGroups = myGroups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (g.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  )


  if (isLoading) { // Changed loading condition
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6"> {/* Updated main div classes */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center"> {/* Updated header structure */}
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search groups..."
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button className="flex-1 md:flex-none gap-2" onClick={() => {
            setEditingGroup(undefined)
            setIsCreateModalOpen(true)
          }}>
            <Plus className="h-4 w-4" />
            Create Group
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          My Groups <span className="text-sm font-normal text-muted-foreground bg-accent/10 px-2 py-0.5 rounded-full">{myGroups.length}</span> {/* Updated h3 */}
        </h3>
        {myGroups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> {/* Updated gap */}
            {myGroups.map((group) => (
              <GroupCard 
                key={group.id} 
                group={group} 
                isOwned={true} // Changed to true as these are "My Groups"
                onEdit={() => handleEditGroup(group)} // Added onEdit
                onDelete={() => handleDeleteGroup(group.id)} // Added onDelete
              />
            ))}
          </div>
        ) : (
          <div className="text-center p-8 border border-dashed border-border rounded-lg"> {/* Updated empty state */}
            <p className="text-muted-foreground">You haven't joined any groups yet.</p>
            <Button variant="link" className="mt-2" onClick={() => {
               setEditingGroup(undefined)
               setIsCreateModalOpen(true)
            }}>Create one now</Button>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          Suggested for You <span className="text-sm font-normal text-muted-foreground bg-accent/10 px-2 py-0.5 rounded-full">{suggestedGroups.length}</span> {/* Updated h3 */}
        </h3>
        {suggestedGroups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> {/* Updated gap */}
            {suggestedGroups.map((group) => (
              <GroupCard 
                key={group.id} 
                group={group} 
                onJoin={() => handleJoinGroup(group.id)}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No new groups available to join.</p>
        )}
      </div>

      <CreateGroupModal 
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={handleGroupSaved}
        groupToEdit={editingGroup}
      />
    </div>
  )
}
