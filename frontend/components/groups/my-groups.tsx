"use client"

import { useState, useEffect } from "react"
import { Users, Plus, CloudCog } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { api } from "@/lib/api"
import { StudyGroupDTO } from "@/types"

export function MyGroups() {
  const { user } = useAuth()
  const router = useRouter()
  const [groups, setGroups] = useState<StudyGroupDTO[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGroups = async () => {
      if (!user) return
      
      try {
        const userGroups = await api.get<StudyGroupDTO[]>(`/groups/user/${user.id}`)
        setGroups(userGroups)
      } catch (error) {
        console.error("Failed to fetch user groups:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchGroups()
  }, [user])

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">My Study Groups</h3>
        </div>
        <div className="flex justify-center p-6">
          <span className="text-muted-foreground">Loading groups...</span>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">My Study Groups</h3>
        <Button 
          size="sm" 
          variant="outline" 
          className="gap-1 bg-transparent"
          onClick={() => router.push("/groups")}
        >
          <Users className="h-4 w-4" />
          View Groups
        </Button>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>You haven't joined any groups yet.</p>
          <Button 
            variant="link" 
            onClick={() => router.push("/groups")}
            className="mt-2"
          >
            Browse Groups
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
              onClick={() => router.push(`/groups/${group.id}`)}
            >
               <div className="text-2xl mb-3 bg-secondary w-12 h-12 flex justify-center items-center text-foreground rounded-full">
                {group.name.charAt(0).toUpperCase()}
              </div>
              <h4 className="font-semibold text-foreground mb-1 line-clamp-2">{group.name}</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{group.memberCount || 0} members</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
