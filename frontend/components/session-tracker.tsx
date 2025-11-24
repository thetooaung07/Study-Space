"use client"

import { useState } from "react"
import { Clock, Play, Pause, Save, Plus } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SessionForm } from "@/components/session-form"
import { SessionHistory } from "@/components/session-history"

export function SessionTracker() {
  const [isTracking, setIsTracking] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [showNewSession, setShowNewSession] = useState(false)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Study Sessions</h2>
          <p className="text-muted-foreground mt-1">Track and manage your study sessions</p>
        </div>
        <Button onClick={() => setShowNewSession(!showNewSession)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Session
        </Button>
      </div>

      {/* Session Form - Appears when creating new session */}
      {showNewSession && <SessionForm onClose={() => setShowNewSession(false)} />}

      {/* Active Timer Card */}
      <Card className="p-8 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            <h3 className="text-xl font-semibold text-foreground">Current Session</h3>
          </div>

          <div className="text-6xl font-bold text-primary font-mono">
            {String(Math.floor(elapsedTime / 3600)).padStart(2, "0")}:
            {String(Math.floor((elapsedTime % 3600) / 60)).padStart(2, "0")}:{String(elapsedTime % 60).padStart(2, "0")}
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => setIsTracking(!isTracking)}
              className={isTracking ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              {isTracking ? (
                <>
                  <Pause className="h-5 w-5 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Start
                </>
              )}
            </Button>
            <Button size="lg" variant="outline">
              <Save className="h-5 w-5 mr-2" />
              End Session
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="bg-background/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Subject</p>
              <p className="font-semibold text-foreground mt-1">Mathematics</p>
            </div>
            <div className="bg-background/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Focus Level</p>
              <p className="font-semibold text-foreground mt-1">High</p>
            </div>
            <div className="bg-background/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Mode</p>
              <p className="font-semibold text-foreground mt-1">Solo</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Today's Study Time</p>
          <p className="text-2xl font-bold text-foreground mt-2">3h 45m</p>
          <p className="text-xs text-accent mt-2">+30m from yesterday</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Sessions Today</p>
          <p className="text-2xl font-bold text-foreground mt-2">4</p>
          <p className="text-xs text-muted-foreground mt-2">Avg: 56 minutes</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Current Streak</p>
          <p className="text-2xl font-bold text-foreground mt-2">12 days</p>
          <p className="text-xs text-accent mt-2">Keep it going!</p>
        </Card>
      </div>

      {/* Session History */}
      <SessionHistory />
    </div>
  )
}
