"use client"

import { Users, Plus } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function MyGroups() {
  const groups = [
    {
      id: 1,
      name: "CS101 Study Gang",
      members: 12,
      sessions: 24,
      avatar: "👨‍💻",
    },
    {
      id: 2,
      name: "Morning Grinders",
      members: 8,
      sessions: 45,
      avatar: "🌅",
    },
    {
      id: 3,
      name: "Math Wizards",
      members: 6,
      sessions: 18,
      avatar: "🧙",
    },
  ]

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">My Study Groups</h3>
        <Button size="sm" variant="outline" className="gap-1 bg-transparent">
          <Plus className="h-4 w-4" />
          New
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {groups.map((group) => (
          <div
            key={group.id}
            className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
          >
            <div className="text-3xl mb-3">{group.avatar}</div>
            <h4 className="font-semibold text-foreground mb-1 line-clamp-2">{group.name}</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{group.members} members</span>
              </div>
              <div className="text-xs">{group.sessions} sessions this month</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
