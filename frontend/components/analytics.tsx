"use client"

import { BarChart3, PieChart, TrendingUp, Calendar } from "lucide-react"
import { Card } from "@/components/ui/card"

export function Analytics() {
  const studyStats = [
    { day: "Mon", hours: 2.5 },
    { day: "Tue", hours: 3.2 },
    { day: "Wed", hours: 2.8 },
    { day: "Thu", hours: 4.1 },
    { day: "Fri", hours: 3.5 },
    { day: "Sat", hours: 5.2 },
    { day: "Sun", hours: 2.3 },
  ]

  const maxHours = Math.max(...studyStats.map((s) => s.hours))

  const subjectBreakdown = [
    { subject: "Mathematics", hours: 16.5, percentage: 38, color: "bg-orange-500" },
    { subject: "Programming", hours: 12.3, percentage: 28, color: "bg-purple-500" },
    { subject: "Science", hours: 10.2, percentage: 23, color: "bg-blue-500" },
    { subject: "Languages", hours: 5.5, percentage: 11, color: "bg-green-500" },
  ]

  const achievements = [
    { name: "First Steps", description: "Complete first study session", unlocked: true },
    { name: "7-Day Streak", description: "Study 7 days in a row", unlocked: true },
    { name: "Hundred Hours", description: "Reach 100 total study hours", unlocked: false },
    { name: "Group Master", description: "Join 5 study groups", unlocked: true },
    { name: "Night Owl", description: "Study after 10 PM", unlocked: true },
    { name: "Marathon", description: "Study 4+ hours in one day", unlocked: false },
  ]

  return (
    <div className="space-y-6">
      {/* Weekly Study Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-secondary" />
          Weekly Study Time
        </h3>

        <div className="flex items-end justify-around h-64 gap-2 px-4">
          {studyStats.map((stat) => (
            <div key={stat.day} className="flex flex-col items-center gap-2 flex-1">
              <div className="w-full bg-gradient-to-t from-primary to-secondary rounded-t-lg overflow-hidden relative group">
                <div
                  style={{ height: `${(stat.hours / maxHours) * 200}px` }}
                  className="w-full bg-gradient-to-t from-primary to-secondary group-hover:opacity-80 transition-opacity"
                />
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-primary-foreground px-2 py-1 rounded text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {stat.hours}h
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{stat.day}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Subject Breakdown */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
          <PieChart className="h-5 w-5 text-secondary" />
          Study Time by Subject
        </h3>

        <div className="space-y-4">
          {subjectBreakdown.map((item) => (
            <div key={item.subject}>
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-foreground">{item.subject}</p>
                <p className="text-sm text-muted-foreground">
                  {item.hours}h ({item.percentage}%)
                </p>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div style={{ width: `${item.percentage}%` }} className={`h-full ${item.color}`} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Goals & Milestones */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-accent" />
          Goals & Milestones
        </h3>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-foreground">Monthly Study Goal</p>
              <p className="text-sm text-muted-foreground">42.5 / 60 hours</p>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div className="h-full w-[71%] bg-gradient-to-r from-primary to-secondary" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-foreground">Streak Goal</p>
              <p className="text-sm text-muted-foreground">12 / 30 days</p>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div className="h-full w-[40%] bg-gradient-to-r from-secondary to-accent" />
            </div>
          </div>
        </div>
      </Card>

      {/* Achievements */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-accent" />
          Achievements
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {achievements.map((achievement, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border text-center transition-all ${
                achievement.unlocked ? "border-primary/50 bg-primary/10" : "border-border bg-muted/30 opacity-50"
              }`}
            >
              <div className="text-3xl mb-2">{achievement.unlocked ? "🏆" : "🔒"}</div>
              <p className="font-semibold text-foreground text-sm">{achievement.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
