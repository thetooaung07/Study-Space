"use client"

import { X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface CreateGroupModalProps {
  onClose: () => void
}

export function CreateGroupModal({ onClose }: CreateGroupModalProps) {
  const avatarEmojis = ["👨‍💻", "🌅", "🧙", "⚛️", "🌍", "💻", "📚", "🎓", "🚀", "🏆"]

  return (
    <Card className="p-6 border-primary/50 bg-primary/5">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Create Study Group</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
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
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground block mb-2">Description</label>
          <textarea
            placeholder="Describe your study group's focus and goals..."
            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            rows={3}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground block mb-3">Choose an Avatar</label>
          <div className="grid grid-cols-5 gap-2">
            {avatarEmojis.map((emoji, idx) => (
              <button
                key={idx}
                className="text-3xl p-3 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/10 transition-all text-center"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Privacy</label>
            <select className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="invitation">Invitation Only</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Category</label>
            <select className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option>Select category...</option>
              <option>Math</option>
              <option>Science</option>
              <option>Programming</option>
              <option>Languages</option>
              <option>History</option>
              <option>Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground block mb-2">Invite Members (Optional)</label>
          <input
            type="email"
            placeholder="Enter emails separated by commas"
            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
            Cancel
          </Button>
          <Button className="flex-1">Create Group</Button>
        </div>
      </div>
    </Card>
  )
}
