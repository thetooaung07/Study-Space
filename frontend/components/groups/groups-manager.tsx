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

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { TransferOwnershipDialog } from "./transfer-ownership-modal"

export function GroupsManager() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [myGroups, setMyGroups] = useState<StudyGroupDTO[]>([])
  const [allGroups, setAllGroups] = useState<StudyGroupDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<StudyGroupDTO | undefined>(undefined)

  // Confirmation states
  const [deleteGroupData, setDeleteGroupData] = useState<number | null>(null)
  const [leaveGroupData, setLeaveGroupData] = useState<number | null>(null)
  
  // Transfer Ownership State
  const [transferDialogData, setTransferDialogData] = useState<{open: boolean, groupId: string, groupName: string, members: any[]} >({
    open: false, groupId: "", groupName: "", members: []
  })

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

  const handleGroupSaved = () => {
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
  
  const confirmDeleteGroup = async () => {
    if (!deleteGroupData) return
    try {
      await api.delete(`/groups/${deleteGroupData}`)
      fetchGroups()
      setDeleteGroupData(null)
    } catch (error: any) {
      console.error("Failed to delete group:", error)
      if (error?.status === 400 || error?.response?.status === 400) {
          try {
             const details = await api.get<any>(`/groups/${deleteGroupData}/details`)
             const members = details.members.filter((m: any) => m.id !== user?.id).map((m: any) => ({
               id: m.id,
               name: m.fullName,
               avatar: m.profilePictureUrl,
               studyTime: m.totalStudyMinutesInGroup || 0,
               sessionsCount: 0, 
               joinedDate: new Date(m.joinedAt).toLocaleDateString()
             }))
             
             if (members.length > 0) {
               const group = myGroups.find(g => g.id === deleteGroupData)
               setTransferDialogData({
                 open: true,
                 groupId: deleteGroupData.toString(),
                 groupName: group?.name || "Group",
                 members: members
               })
               setDeleteGroupData(null) 
               return
             }
         } catch (e) {
            console.error("Error fetching details for transfer:", e)
         }
      }
      setDeleteGroupData(null)
    } 
  }

  const handleTransferAndLeave = async (newOwnerId: number) => {
    if (!user) return
    const groupId = transferDialogData.groupId
    try {
      await api.put(`/groups/${groupId}/transfer?newOwnerId=${newOwnerId}`, {})
      
      await api.delete(`/groups/${groupId}/members/${user.id}`)
      
      fetchGroups()
      setTransferDialogData(prev => ({ ...prev, open: false }))
    } catch (error) {
      console.error("Failed to transfer and leave:", error)
    }
  }

  const confirmLeaveGroup = async () => {
    if (!leaveGroupData || !user) return
    try {
      await api.delete(`/groups/${leaveGroupData}/members/${user.id}`)
      fetchGroups()
    } catch (error) {
      console.error("Failed to leave group:", error)
    } finally {
      setLeaveGroupData(null)
    }
  }
  
  const handleCloseModal = () => {
    setIsCreateModalOpen(false)
    setEditingGroup(undefined)
  }

  // ... (filtering logic)
  const myGroupIds = new Set(myGroups.map(g => g.id))
  const suggestedGroups = allGroups
    .filter(g => !myGroupIds.has(g.id))
    .filter(g => 
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (g.description || "").toLowerCase().includes(searchQuery.toLowerCase())
    )


  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative flex-1 w-full md:max-w-md">
          {/* <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search groups..."
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          /> */}
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {/* <Button variant="outline" className="flex-1 md:flex-none gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button> */}
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
          My Groups <span className="text-sm font-normal text-muted-foreground bg-accent/10 px-2 py-0.5 rounded-full">{myGroups.length}</span>
        </h3>
        {myGroups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myGroups.map((group) => (
              <GroupCard 
                key={group.id} 
                group={group} 
                isOwned={true}
                onEdit={() => handleEditGroup(group)}
                onDelete={() => setDeleteGroupData(group.id)}
                onLeave={() => setLeaveGroupData(group.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center p-8 border border-dashed border-border rounded-lg">
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
          Suggested for You <span className="text-sm font-normal text-muted-foreground bg-accent/10 px-2 py-0.5 rounded-full">{suggestedGroups.length}</span>
        </h3>
        {suggestedGroups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteGroupData} onOpenChange={(open) => !open && setDeleteGroupData(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the group and remove all data associated with it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteGroup} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Confirmation Dialog */}
      <AlertDialog open={!!leaveGroupData} onOpenChange={(open) => !open && setLeaveGroupData(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Group?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave this group? You can join again later if it is public.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLeaveGroup} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transfer Ownership Dialog */}
      <TransferOwnershipDialog 
        open={transferDialogData.open}
        onOpenChange={(open) => setTransferDialogData(prev => ({ ...prev, open }))}
        groupId={transferDialogData.groupId}
        groupName={transferDialogData.groupName}
        members={transferDialogData.members}
        onTransferAndLeave={handleTransferAndLeave}
      />

    </div>
  )
}
