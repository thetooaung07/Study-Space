"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"
import { StudySessionDTO, FocusLevel } from "@/types"

interface SessionFormProps {
  onClose: () => void
  onSuccess?: () => void
}

export function SessionForm({ onClose, onSuccess }: SessionFormProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    sessionType: "",
    description: "",
    focusLevel: "MEDIUM" as FocusLevel,
  })

  const subjects = ["MATH", "SCIENCE", "LANGUAGE", "HISTORY", "PROGRAMMING", "OTHER"]
  const sessionTypes = ["Solo", "Group", "With Friends"]

  const handleSubmit = async () => {
    if (!user) return
    if (!formData.title || !formData.subject) {
      toast.error("Please fill in all required fields")
      return
    }

    setLoading(true)
    try {
      const createdSession = await api.post<StudySessionDTO>(`/sessions?userId=${user.id}`, {
        title: formData.title,
        description: formData.description,
        subject: formData.subject,
        isGroupSession: formData.sessionType !== "Solo",
        focusLevel: formData.focusLevel,
      })
      
      toast.success("Session created successfully!")
      onSuccess?.()
      onClose()
      
      router.push(`/sessions/active/${createdSession.id}`)
    } catch (error) {
      console.error("Failed to create session:", error)
      toast.error("Failed to create session")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6 border-primary/50 bg-primary/5">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Start New Study Session</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground block mb-2">Session Title</label>
          <input
            type="text"
            placeholder="e.g., Calculus Chapter 5 Review"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Subject</label>
            <select 
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select subject...</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Session Type</label>
            <select 
              value={formData.sessionType}
              onChange={(e) => setFormData({ ...formData, sessionType: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select type...</option>
              {sessionTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground block mb-2">Description (Optional)</label>
          <textarea
            placeholder="Add notes about what you'll study..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            rows={3}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground block mb-3">Focus Level</label>
          <div className="flex gap-2">
            {(["LOW", "MEDIUM", "HIGH"] as FocusLevel[]).map((level) => (
              <Button 
                key={level} 
                variant={formData.focusLevel === level ? "default" : "outline"}
                onClick={() => setFormData({ ...formData, focusLevel: level })}
                className={`flex-1 ${formData.focusLevel !== level ? "bg-transparent" : ""}`}
              >
                {level.charAt(0) + level.slice(1).toLowerCase()}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
            {loading ? "Starting..." : "Start Session"}
          </Button>
        </div>
      </div>
    </Card>
  )
}
