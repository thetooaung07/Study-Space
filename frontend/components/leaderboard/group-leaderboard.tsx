"use client"

import { Users } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { GroupStatsDTO } from "@/types"

export function GroupLeaderboard() {
  const [groups, setGroups] = useState<GroupStatsDTO[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await api.get<GroupStatsDTO[]>('/groups/leaderboard')
        setGroups(data)
      } catch (error) {
        console.error("Failed to fetch group leaderboard:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchLeaderboard()
  }, [])

  return (
    <div className="space-y-6">
      <Card className="p-6">
         <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
               <Users className="h-5 w-5 text-accent" />
               Top Study Groups
            </h3>
         </div>
      
        {loading ? (
             <p className="text-center text-gray-500">Loading leaderboard...</p>
        ) : groups.length === 0 ? (
             <p className="text-center text-gray-500">No group data available.</p>
        ) : (
             <div className="space-y-4">
               {groups.map((group, idx) => (
                 <div
                   key={group.groupId}
                   className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-gray-50 transition-colors"
                 >
                   <div className="flex items-center gap-4">
                     <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${
                         idx === 0 ? "bg-yellow-100 text-yellow-600" :
                         idx === 1 ? "bg-gray-100 text-gray-600" :
                         idx === 2 ? "bg-orange-100 text-orange-600" :
                         "bg-blue-50 text-blue-600"
                     }`}>
                         {idx + 1}
                     </div>
                     <div>
                       <h4 className="font-semibold text-foreground">{group.groupName}</h4>
                       <p className="text-sm text-muted-foreground">{group.sessionCount} sessions • {group.activeMemberCount} active members</p>
                     </div>
                   </div>
                   <div className="text-right">
                     <p className="font-bold text-lg text-foreground">{Math.floor(group.totalStudyMinutes / 60)}h</p>
                     <p className="text-xs text-muted-foreground">{group.totalStudyMinutes % 60}m</p>
                   </div>
                 </div>
               ))}
             </div>
        )}
      </Card>
    </div>
  )
}
