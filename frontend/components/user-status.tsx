"use client"

import { Eye, Zap } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function UserStatus() {
  const onlineUsers = [
    { name: "Alex Kumar", status: "Studying", avatar: "👨‍💻", focused: true },
    { name: "Sarah Chen", status: "On Break", avatar: "👩‍🎓", focused: false },
    { name: "Mike Johnson", status: "Studying", avatar: "👨‍🎓", focused: true },
    { name: "Emily Davis", status: "Group Session", avatar: "👩‍💻", focused: true },
    { name: "James Wilson", status: "Studying", avatar: "👨‍🎓", focused: false },
    { name: "Lisa Brown", status: "Studying", avatar: "👩‍🎓", focused: true },
  ]

  return (
    <Card className="p-6 sticky top-6">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Eye className="h-5 w-5 text-green-500" />
        Online Now ({onlineUsers.length})
      </h3>

      <div className="space-y-3">
        {onlineUsers.map((user, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-primary/5 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="relative">
                <div className="text-xl">{user.avatar}</div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-background" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.status}</p>
              </div>
            </div>
            {user.focused && <Zap className="h-4 w-4 text-accent flex-shrink-0" />}
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" className="w-full mt-4 bg-transparent">
        View All Online
      </Button>
    </Card>
  )
}
