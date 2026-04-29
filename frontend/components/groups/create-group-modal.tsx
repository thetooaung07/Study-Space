"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { useAuth } from "@/context/auth-context"
import { StudyGroupDTO } from "@/types"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface CreateGroupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  groupToEdit?: StudyGroupDTO
}

export function CreateGroupModal({ open, onOpenChange, onSuccess, groupToEdit }: CreateGroupModalProps) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    groupType: "PUBLIC"
  })

  useEffect(() => {
    if (groupToEdit) {
      setFormData({
        name: groupToEdit.name,
        description: groupToEdit.description,
        groupType: groupToEdit.groupType || "PUBLIC"
      })
    } else {
      // Reset form on open if not editing
      setFormData({
         name: "",
         description: "",
         groupType: "PUBLIC"
      })
    }
  }, [groupToEdit, open])

  const handleSubmit = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      if (groupToEdit) {
        // Edit mode
        await api.put(`/groups/${groupToEdit.id}`, {
          name: formData.name,
          description: formData.description,
          groupType: formData.groupType
        })
      } else {
        // Create mode
        await api.post(`/groups?creatorId=${user.id}`, {
          name: formData.name,
          description: formData.description,
          groupType: formData.groupType
        })
      }
      onSuccess()
    } catch (error) {
      console.error("Failed to save group:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden shadow-none border-none">
        <Card className="p-6 w-full border-none shadow-xl"> 
          <DialogHeader className="mb-4">
             <DialogTitle className="text-lg font-semibold text-foreground">
              {groupToEdit ? "Edit Study Group" : "Create Study Group"}
             </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Group Name</label>
              <input
                type="text"
                placeholder="e.g., Advanced Python Study Group"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Description</label>
              <textarea
                placeholder="Describe your study group's focus and goals..."
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Group Type</label>
              <select 
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                value={formData.groupType}
                onChange={(e) => setFormData({...formData, groupType: e.target.value})}
                disabled={isLoading}
              >
                <option value="PUBLIC">Public - Visible to everyone</option>
                <option value="PERSONAL">Personal - Private to you</option>
                <option value="INVITE_ONLY">Invite Only - Join via code</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 bg-transparent" disabled={isLoading}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={isLoading || !formData.name}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (groupToEdit ? "Save Changes" : "Create Group")}
              </Button>
            </div>
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
