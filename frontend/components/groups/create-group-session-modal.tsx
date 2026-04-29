"use client"

import type React from "react"

import { useState } from "react"
import { Globe, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { api } from "@/lib/api"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"

interface CreateGroupSessionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  groupName: string
  onSuccess?: (session?: any) => void
}

export function CreateGroupSessionModal({ open, onOpenChange, groupId, groupName, onSuccess }: CreateGroupSessionModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    description: "",
    isGroupSession: true,
    visibility: "PUBLIC" as "PUBLIC" | "PRIVATE"
  })

  const subjects = ["MATH", "SCIENCE", "LANGUAGE", "HISTORY", "PROGRAMMING", "OTHER"]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      const createdSession = await api.post<any>(`/sessions?userId=${user.id}`, {
        title: formData.title,
        description: formData.description,
        subject: formData.subject,
        studyGroupId: parseInt(groupId),
        isGroupSession: true,
        visibility: formData.visibility,
      })
      
      toast.success("Session created successfully!")
      onSuccess?.(createdSession)
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to create session:", error)
      toast.error("Failed to create session")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden shadow-none border-none">
        <Card className="p-6 w-full border-none"> 
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold text-foreground">Create Session in {groupName}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Session Visibility */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-3">Session Visibility</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, visibility: "PUBLIC"})}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.visibility === "PUBLIC"
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background/40 hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Globe className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-foreground">Public</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-left">
                    Visible to all group members
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({...formData, visibility: "PRIVATE"})}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.visibility === "PRIVATE"
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background/40 hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Lock className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-foreground">Private</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-left">
                    Only visible to you
                  </p>
                </button>
              </div>
            </div>

            {/* Session Title */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Session Title</label>
              <input
                type="text"
                placeholder="e.g., Algorithm Deep Dive"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Subject & Duration */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Subject</label>
                <select
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select...</option>
                  {subjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Description</label>
              <textarea
                placeholder="What will you work on?"
                 value={formData.description}
                 onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={2}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 bg-transparent"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Creating..." : "Create Session"}
              </Button>
            </div>
          </form>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
