"use client"

import { Users, Star, MoreVertical } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StudyGroupDTO } from "@/types"

interface GroupCardProps {
  group: StudyGroupDTO
  isOwned?: boolean
}

export function GroupCard({ group, isOwned = false }: GroupCardProps) {
  // Mock/Derived data for UI fields not yet in API
  const avatars = ["👨‍💻", "🌅", "🧙", "⚛️", "🌍", "💻", "📚", "🚀"]
  const avatar = avatars[group.id % avatars.length]
  const activeMembers = Math.floor(group.memberCount * 0.4) // Mock active count
  const sessionsCount = 0 // Mock, backend doesn't provide this yet
  
  return (
    <Card className="p-5 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group">
      <div className="flex items-start justify-between mb-4">
        <div className="text-4xl">{avatar}</div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Star className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <h4 className="font-semibold text-foreground mb-1 line-clamp-2">{group.name}</h4>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{group.description}</p>

      <div className="space-y-2 mb-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>{group.memberCount} members</span>
          <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">{activeMembers} active</span>
        </div>
        <div className="text-xs">{sessionsCount} study sessions this month</div>
      </div>

      {isOwned ? (
        <div className="space-y-2 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {/* TODO: Admin name not in DTO yet, showing role */}
            <span className="font-medium">Role:</span> Admin
          </p>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Created:</span> {new Date(group.createdAt).toLocaleDateString()}
          </p>
          <Button variant="outline" size="sm" className="w-full mt-2 bg-transparent">
            Manage
          </Button>
        </div>
      ) : (
        <Button className="w-full">Join Group</Button>
      )}
    </Card>
  )
}
