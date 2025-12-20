"use client"

import { Users, Star, MoreVertical, BarChart3, LogIn } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { StudyGroupDTO } from "@/types"
import { useRouter } from "next/navigation"

interface GroupCardProps {
  group: StudyGroupDTO
  isOwned?: boolean
  onJoin?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function GroupCard({ group, isOwned = false, onJoin, onEdit, onDelete }: GroupCardProps) {
 
  const router = useRouter();
 
  // Mock/Derived data for visual flair since DTO is simple
  const avatars = ["👨‍💻", "🌅", "🧙", "⚛️", "🌍", "💻", "📚", "🎓", "🚀", "🏆"]
  const avatar = avatars[group.id % avatars.length]
  const activeMembers = Math.round(group.memberCount * 0.6) // Mock active count
  const sessionsCount = Math.round(group.id * 3.5) % 50 // Mock session count

  const handleOnClick = () => {
    router.push(`/groups/${group.id}`)
  }

  return (
    <Card className="p-5 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group flex flex-col h-full" onClick={handleOnClick}>
      <div className="flex items-start justify-between mb-4">
        <div className="text-4xl">{avatar}</div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isOwned && (
            <Link href={`/groups/analytics/${group.id}`}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <BarChart3 className="h-4 w-4" />
              </Button>
            </Link>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Star className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <h4 className="font-semibold text-foreground mb-1 line-clamp-2">{group.name}</h4>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-grow">{group.description}</p>

      <div className="space-y-2 mb-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>{group.memberCount} members</span>
          <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">{activeMembers} active</span>
        </div>
        <div className="text-xs">{sessionsCount} study sessions this month</div>
      </div>

      <div className="mt-auto">
        {isOwned ? (
          <div className="space-y-2 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Created:</span> {new Date(group.createdAt).toLocaleDateString()}
            </p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Link href={`/groups/analytics/${group.id}`} className="col-span-2">
                <Button variant="outline" size="sm" className="w-full bg-transparent gap-2">
                  <BarChart3 className="h-3 w-3" />
                  Analytics
                </Button>
              </Link>
              <Button variant="outline" size="sm" className="bg-transparent" onClick={(e) => {
                e.preventDefault();
                onEdit?.();
              }}>
                Edit
              </Button>
              <Button variant="outline" size="sm" className="bg-transparent hover:bg-destructive/10 hover:text-destructive" onClick={(e) => {
                e.preventDefault();
                onDelete?.();
              }}>
                Delete
              </Button>
            </div>
          </div>
        ) : (
          <Button className="w-full gap-2" onClick={(e) => {
            e.preventDefault();
            onJoin?.();
          }}>
            <LogIn className="h-4 w-4" />
            Join Group
          </Button>
        )}
      </div>
    </Card>
  )
}
