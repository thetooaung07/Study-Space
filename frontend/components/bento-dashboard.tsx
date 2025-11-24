"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings, Clock, Briefcase, ChevronRight } from "lucide-react"

interface RecentSession {
  id: number
  subject: string
  duration: number
  time: string
  participants?: number
}

const mockRecentSessions: RecentSession[] = [
  { id: 1, subject: "Math", duration: 45, time: "2 hours ago" },
  { id: 2, subject: "Physics", duration: 60, time: "5 hours ago" },
  { id: 3, subject: "Chemistry", duration: 30, time: "1 day ago" },
  { id: 4, subject: "Math", duration: 45, time: "2 hours ago" },
  { id: 5, subject: "Physics", duration: 60, time: "5 hours ago" },
  { id: 6, subject: "Chemistry", duration: 30, time: "1 day ago" },
  { id: 7, subject: "Math", duration: 45, time: "2 hours ago" },
  { id: 8, subject: "Physics", duration: 60, time: "5 hours ago" },
  { id: 9, subject: "Chemistry", duration: 30, time: "1 day ago" },
]


export function BentoDashboard() {
  return (
    <div className="w-full p-6">
      <div className="grid grid-cols-3 gap-4 mb-8 auto-rows-[200px]">
        {/* Profile Card - Top Left */}
        <Card className="col-span-1 row-span-1 p-6 flex flex-col justify-between bg-white border-gray-200 hover:shadow-md transition-all">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                <Settings className="w-6 h-6 text-gray-900" />
              </div>
              <h3 className="font-semibold text-gray-900">Profile</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">TODO: Some Icons or Info and onClick Card</p>
          </div>

        </Card>

        {/* Recent Sessions - Right (2 rows, 2 columns) */}
        <Card className="col-span-2 row-span-2 p-6 flex flex-col justify-between bg-white border-gray-200 hover:shadow-md transition-all">
          <div className="w-full">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-gray-900" />
                </div>
                <h3 className="font-semibold text-gray-900">Recent Sessions</h3>
              </div>
              <Button variant="ghost" className="justify-between bg-transparent" size="sm">
                <span>View All</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-3 h-[300px] overflow-y-scroll">
              {mockRecentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{session.subject}</p>
                      <p className="text-xs text-gray-600">{session.time}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-gray-600">{session.duration}m</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Workspace Card - Bottom Left */}
        <Card className="col-span-1 row-span-1 p-6 flex flex-col justify-between bg-white border-gray-200 hover:shadow-md transition-all">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-gray-900" />
              </div>
              <h3 className="font-semibold text-gray-900">Workspace</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">TODO: Add some visuals and onClick Card</p>
          </div>

        </Card>


      </div>
    </div>
  )
}
