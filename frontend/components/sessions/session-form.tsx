"use client"

import { X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface SessionFormProps {
  onClose: () => void
}

export function SessionForm({ onClose }: SessionFormProps) {
  const subjects = ["MATH", "SCIENCE", "LANGUAGE", "HISTORY", "PROGRAMMING", "OTHER"]
  const sessionTypes = ["Solo", "Group", "With Friends"]

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
            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Subject</label>
            <select className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option>Select subject...</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Session Type</label>
            <select className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option>Select type...</option>
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
            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            rows={3}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground block mb-3">Focus Level</label>
          <div className="flex gap-2">
            {["Low", "Medium", "High"].map((level) => (
              <Button key={level} variant="outline" className="flex-1 bg-transparent">
                {level}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
            Cancel
          </Button>
          <Button className="flex-1">Start Session</Button>
        </div>
      </div>
    </Card>
  )
}
