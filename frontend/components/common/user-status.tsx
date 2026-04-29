"use client"

import { useEffect, useState } from "react"
import { Eye, Zap } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { UserDTO } from "@/types"

export function UserStatus() {
  const [onlineUsers, setOnlineUsers] = useState<UserDTO[]>([])
  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await api.get<UserDTO[]>("/users")
        // TODO:Filter for "online" users, or just show first 5 for now as we don't have websocket status yet
        // Simulating "online" by just taking a slice
        setOnlineUsers(users.slice(0, 6)) 
      } catch (error) {
        console.error("Failed to fetch users", error)
      }
    }
    fetchUsers()
  }, [])

  const avatars = ["👨‍💻", "👩‍🎓", "👨‍🎓", "👩‍💻"]

  return (
    <Card className="p-6 top-6">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Eye className="h-5 w-5 text-green-500" />
        Online Now ({onlineUsers.length})
      </h3>

      <div className="space-y-3">
        {onlineUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No users online.</p>
        ) : (
          onlineUsers.map((user, idx) => {
            const isStudying = user.currentStatus === 'STUDYING'
            return (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-primary/5 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="relative">
                    <div className="text-xl">{avatars[user.id % avatars.length]}</div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background ${
                      isStudying ? "bg-orange-500" : "bg-green-500"
                    }`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{user.fullName || user.username}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user.currentStatus?.toLowerCase().replace('_', ' ') || 'Online'}</p>
                  </div>
                </div>
                {isStudying && <Zap className="h-4 w-4 text-accent flex-shrink-0" />}
              </div>
            )
          })
        )}
      </div>

      <Button variant="outline" size="sm" className="w-full mt-4 bg-transparent">
        View All Online
      </Button>
    </Card>
  )
}
