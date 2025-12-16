"use client"

import { Trophy } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function GlobalLeaderboard() {
  const leaderboardData = [
    {
      rank: 1,
      name: "Alex Kumar",
      points: 3580,
      studyTime: "156h",
      streak: 25,
      avatar: "👨‍💻",
      change: "↑ 2",
    },
    {
      rank: 2,
      name: "Sarah Chen",
      points: 3420,
      studyTime: "148h",
      streak: 18,
      avatar: "👩‍🎓",
      change: "↓ 1",
    },
    {
      rank: 3,
      name: "Mike Johnson",
      points: 3150,
      studyTime: "138h",
      streak: 14,
      avatar: "👨‍🎓",
      change: "↑ 5",
    },
    {
      rank: 4,
      name: "Emily Davis",
      points: 2950,
      studyTime: "124h",
      streak: 10,
      avatar: "👩‍💻",
      change: "→",
    },
    {
      rank: 5,
      name: "James Wilson",
      points: 2840,
      studyTime: "115h",
      streak: 8,
      avatar: "👨‍🎓",
      change: "↓ 2",
    },
    {
      rank: 47,
      name: "You (Thet Oo Aung)",
      points: 1240,
      studyTime: "42h 30m",
      streak: 12,
      avatar: "👨‍🎓",
      change: "↑ 5",
      isYou: true,
    },
    {
      rank: 48,
      name: "Lisa Brown",
      points: 1230,
      studyTime: "41h",
      streak: 9,
      avatar: "👩‍🎓",
      change: "↓ 1",
    },
    {
      rank: 49,
      name: "David Lee",
      points: 1180,
      studyTime: "39h",
      streak: 7,
      avatar: "👨‍💻",
      change: "↑ 3",
    },
  ]

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return "🥇"
    if (rank === 2) return "🥈"
    if (rank === 3) return "🥉"
    return null
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Trophy className="h-5 w-5 text-accent" />
          Global Rankings
        </h3>
        <Button variant="outline" size="sm">
          Filter
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-muted-foreground text-sm">
              <th className="text-left py-3 px-4 font-medium">Rank</th>
              <th className="text-left py-3 px-4 font-medium">User</th>
              <th className="text-right py-3 px-4 font-medium">Points</th>
              <th className="text-right py-3 px-4 font-medium">Study Time</th>
              <th className="text-right py-3 px-4 font-medium">Streak</th>
              <th className="text-center py-3 px-4 font-medium">Change</th>
            </tr>
          </thead>
          <tbody>
            {leaderboardData.map((entry) => (
              <tr
                key={entry.rank}
                className={`border-b border-border hover:bg-primary/5 transition-colors ${
                  entry.isYou ? "bg-primary/10 border-primary/30" : ""
                }`}
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    {getMedalIcon(entry.rank) || <span className="w-6 text-center">{entry.rank}</span>}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{entry.avatar}</div>
                    <div>
                      <p className="font-medium text-foreground">{entry.name}</p>
                      {entry.isYou && <p className="text-xs text-primary font-semibold">You</p>}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <p className="font-semibold text-foreground">{entry.points}</p>
                </td>
                <td className="py-4 px-4 text-right">
                  <p className="text-muted-foreground">{entry.studyTime}</p>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-sm text-muted-foreground">{entry.streak}</span>
                    <span>🔥</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <span
                    className={`text-sm font-semibold ${
                      entry.change.startsWith("↑")
                        ? "text-accent"
                        : entry.change.startsWith("↓")
                          ? "text-destructive"
                          : "text-muted-foreground"
                    }`}
                  >
                    {entry.change}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
