"use client"

import { Users } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function GroupLeaderboard() {
  const groupLeaderboards = [
    {
      groupId: 1,
      groupName: "CS101 Study Gang",
      avatar: "👨‍💻",
      members: [
        { name: "You (Thet Oo Aung)", points: 850, studyTime: "32h", isYou: true },
        { name: "Sarah Chen", points: 920, studyTime: "36h" },
        { name: "Mike Johnson", points: 780, studyTime: "28h" },
      ],
    },
    {
      groupId: 2,
      groupName: "Morning Grinders",
      avatar: "🌅",
      members: [
        { name: "Sarah Chen", points: 1240, studyTime: "48h" },
        { name: "You (Thet Oo Aung)", points: 1100, studyTime: "41h", isYou: true },
        { name: "Alex Kumar", points: 980, studyTime: "38h" },
      ],
    },
    {
      groupId: 3,
      groupName: "Math Wizards",
      avatar: "🧙",
      members: [
        { name: "Alex Kumar", points: 650, studyTime: "25h" },
        { name: "You (Thet Oo Aung)", points: 590, studyTime: "18h 30m", isYou: true },
        { name: "Emily Davis", points: 520, studyTime: "16h" },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      {groupLeaderboards.map((group) => (
        <Card key={group.groupId} className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{group.avatar}</div>
              <div>
                <h4 className="font-semibold text-foreground">{group.groupName}</h4>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {group.members.length} members ranking
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              View Group
            </Button>
          </div>

          <div className="space-y-2">
            {group.members.map((member, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  member.isYou ? "bg-primary/10 border-primary/30" : "border-border hover:bg-primary/5"
                } transition-colors`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-semibold text-primary">
                    #{idx + 1}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{member.name}</p>
                    {member.isYou && <p className="text-xs text-primary font-semibold">You</p>}
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <p className="text-muted-foreground">{member.studyTime}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{member.points}</p>
                    <p className="text-xs text-muted-foreground">pts</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  )
}
