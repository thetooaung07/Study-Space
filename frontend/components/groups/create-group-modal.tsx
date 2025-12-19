"use client"

import { useState, useEffect } from "react"
import { X, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { useAuth } from "@/context/auth-context"
import { StudyGroupDTO } from "@/types"

interface CreateGroupModalProps {
  onClose: () => void
  onSuccess: () => void
  groupToEdit?: StudyGroupDTO
}

export function CreateGroupModal({ onClose, onSuccess, groupToEdit }: CreateGroupModalProps) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPrivate: false
  })

  useEffect(() => {
    if (groupToEdit) {
      setFormData({
        name: groupToEdit.name,
        description: groupToEdit.description,
        isPrivate: groupToEdit.isPrivate
      })
    }
  }, [groupToEdit])

  const handleSubmit = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      if (groupToEdit) {
        // Edit mode
        await api.put(`/groups/${groupToEdit.id}`, {
          name: formData.name,
          description: formData.description,
          isPrivate: formData.isPrivate
        })
      } else {
        // Create mode
        await api.post(`/groups?creatorId=${user.id}`, {
          name: formData.name,
          description: formData.description,
          isPrivate: formData.isPrivate
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
    <Card className="p-6 border-primary/50 bg-primary/5 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">
          {groupToEdit ? "Edit Study Group" : "Create Study Group"}
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose} disabled={isLoading}>
          <X className="h-5 w-5" />
        </Button>
      </div>

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
          <label className="text-sm font-medium text-foreground block mb-2">Privacy</label>
          <select 
            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            value={formData.isPrivate ? "private" : "public"}
            onChange={(e) => setFormData({...formData, isPrivate: e.target.value === "private"})}
            disabled={isLoading}
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent" disabled={isLoading}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={isLoading || !formData.name}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (groupToEdit ? "Save Changes" : "Create Group")}
          </Button>
        </div>
      </div>
    </Card>
  )
}
