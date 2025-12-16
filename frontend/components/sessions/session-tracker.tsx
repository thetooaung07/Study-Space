"use client"

import { useState, useEffect } from "react"
import { Clock, Play, Pause, Save, Plus, Timer, RotateCcw } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SessionForm } from "@/components/sessions/session-form"
import { SessionHistory } from "@/components/sessions/session-history"
import { cn } from "@/lib/utils"

const PRESETS = [15, 25, 45, 60]

export function SessionTracker() {
  const [isTracking, setIsTracking] = useState(false)
  const [showNewSession, setShowNewSession] = useState(false)
  
  // Timer State
  const [mode, setMode] = useState<"stopwatch" | "timer">("stopwatch")
  const [elapsedTime, setElapsedTime] = useState(0)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [initialTime, setInitialTime] = useState(25 * 60)
  const [customMinutes, setCustomMinutes] = useState("25")

  // Determine if a session is currently "active" (running or paused with progress)
  const isSessionActive = mode === "stopwatch" ? elapsedTime > 0 : timeLeft !== initialTime

  // Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isTracking) {
      interval = setInterval(() => {
        if (mode === "stopwatch") {
          setElapsedTime((prev) => prev + 1)
        } else {
          setTimeLeft((prev) => {
            if (prev <= 0) {
              setIsTracking(false)
              return 0
            }
            return prev - 1
          })
        }
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isTracking, mode])

  const handleSetDuration = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0
    setCustomMinutes(e.target.value)
    if (!isTracking) {
        setTimeLeft(val * 60)
        setInitialTime(val * 60)
    }
  }

  const handlePreset = (minutes: number) => {
    setCustomMinutes(minutes.toString())
    setTimeLeft(minutes * 60)
    setInitialTime(minutes * 60)
  }

  const resetTimer = () => {
    setIsTracking(false)
    if (mode === "stopwatch") {
      setElapsedTime(0)
    } else {
      setTimeLeft(initialTime)
    }
  }

  // New Finish Function
  const handleFinish = () => {
    setIsTracking(false)
    
    // Calculate total duration for saving
    const duration = mode === "stopwatch" ? elapsedTime : (initialTime - timeLeft)
    
    
    // Reset states after saving
    if (mode === "stopwatch") {
        setElapsedTime(0)
    } else {
        setTimeLeft(initialTime)
    }
  }

  const activeTime = mode === "stopwatch" ? elapsedTime : timeLeft
  const hours = String(Math.floor(activeTime / 3600)).padStart(2, "0")
  const minutes = String(Math.floor((activeTime % 3600) / 60)).padStart(2, "0")
  const seconds = String(activeTime % 60).padStart(2, "0")

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Study Sessions</h2>
          <p className="text-muted-foreground mt-1">Track and manage your study sessions</p>
        </div>
        <Button onClick={() => setShowNewSession(!showNewSession)} className="gap-2 transition-all">
          <Plus className="h-4 w-4" />
          New Session
        </Button>
      </div>

      {showNewSession && <SessionForm onClose={() => setShowNewSession(false)} />}

      <Card className="relative p-8 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 overflow-hidden transition-all duration-300">
        
        {/* Tabs with Background and Disable Logic */}
        <div className="absolute top-4 right-4">
            <Tabs 
                value={mode} 
                onValueChange={(val) => {
                    if (!isSessionActive) {
                        setMode(val as "stopwatch" | "timer")
                        setIsTracking(false)
                    }
                }} 
                className="w-[200px] transition-all"
            >
                {/* Added bg-muted/60 and border for better visibility */}
                <TabsList className="grid w-full grid-cols-2 bg-muted/60 border border-border/50">
                    <TabsTrigger 
                        value="stopwatch" 
                        disabled={isSessionActive}
                        className="transition-all  data-[state=active]:bg-secondary data-[state=active]:shadow-sm"
                    >
                        Stopwatch
                    </TabsTrigger>
                    <TabsTrigger 
                        value="timer" 
                        disabled={isSessionActive}
                        className="transition-all data-[state=active]:bg-secondary data-[state=active]:shadow-sm"
                    >
                        Timer
                    </TabsTrigger>
                </TabsList>
            </Tabs>
        </div>

        <div className="text-center space-y-6 mt-4 ">
          <div className="flex items-center justify-center gap-2 text-muted-foreground/80">
            {mode === "stopwatch" ? (
                <Clock className="h-5 w-5 transition-all" />
            ) : (
                <Timer className="h-5 w-5 transition-all" />
            )}
            <h3 className="text-lg font-medium transition-all">
                {mode === "stopwatch" ? "Elapsed Time" : "Time Remaining"}
            </h3>
          </div>

          <div className="flex flex-col items-center">
            {/* Time Display */}
            <div className="flex items-baseline justify-center font-mono leading-none">
                <span className="text-8xl font-bold text-primary tracking-tighter transition-all tabular-nums">
                {hours}:{minutes}
                </span>
                <span className="text-4xl font-medium text-muted-foreground/50 ml-2 transition-all tabular-nums">
                :{seconds}
                </span>
            </div>
            
            {/* HEIGHT STABILIZER CONTAINER */}
            <div className="min-h-[3.5rem] flex flex-col justify-center items-center w-full mt-2 transition-all duration-300 ease-in-out">
                {mode === "timer" && !isSessionActive ? (
                    <div className="w-full flex items-center justify-center gap-3 transition-all duration-300 ease-in-out opacity-100">
                        {/* Presets */}
                        <div className="flex gap-2">
                            {PRESETS.map((min) => (
                                <Button
                                    key={min}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePreset(min)}
                                    className={cn(  
                                        "not-italic h-8 px-3 text-xs transition-all duration-200 border-secondary hover:border-primary/50",
                                        customMinutes === min.toString() ? "bg-secondary text-primary border-secondary" : ""
                                    )}
                                >
                                    {min}m
                                </Button>
                            ))}
                        </div>

                        {/* Divider */}
                        <div className="h-4 w-px bg-border" />

                        {/* Custom Input */}
                        <div className="flex items-center gap-2 not-italic">
                            <Label htmlFor="duration" className="text-xs text-muted-foreground font-bold uppercase">Custom</Label>
                            <Input 
                                id="duration"
                                type="number" 
                                min="1"
                                value={customMinutes}
                                onChange={handleSetDuration}
                                className="w-16 text-center h-8 bg-background/50 text-xs transition-all focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground/40 text-sm font-medium italic transition-all duration-300">
                        {isTracking 
                            ? "Focus mode active..." 
                            : (mode === "stopwatch" && elapsedTime > 0) || (mode === "timer" && timeLeft !== initialTime)
                                ? "Session paused"
                                : "Ready to start"
                        }
                    </div>
                )}
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button 
                size="icon" 
                variant="ghost" 
                onClick={resetTimer}
                disabled={!isSessionActive && !isTracking} // Disable reset if nothing happened yet
                className="text-muted-foreground hover:text-foreground transition-all hover:bg-muted"
                title="Reset Timer"
            >
                <RotateCcw className="h-5 w-5" />
            </Button>

            <Button
              size="lg"
              onClick={() => setIsTracking(!isTracking)}
              className={cn(
                  "w-32 transition-all duration-300 shadow-lg",
                  isTracking ? "bg-destructive hover:bg-destructive/90 shadow-destructive/20" : "shadow-primary/20"
              )}
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
            
            <Button 
                size="lg" 
                variant="outline" 
                onClick={handleFinish}
                disabled={!isSessionActive} // Disable finish if session hasn't started
                className="transition-all hover:bg-primary/5"
            >
              <Save className="h-5 w-5 mr-2" />
              Finish
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="bg-background/50 rounded-lg p-4 transition-all hover:bg-background/80 border border-transparent hover:border-border/50">
              <p className="text-sm text-muted-foreground">Subject</p>
              <p className="font-semibold text-foreground mt-1">Mathematics</p>
            </div>
            <div className="bg-background/50 rounded-lg p-4 transition-all hover:bg-background/80 border border-transparent hover:border-border/50">
              <p className="text-sm text-muted-foreground">Focus Level</p>
              <p className="font-semibold text-foreground mt-1">High</p>
            </div>
            <div className="bg-background/50 rounded-lg p-4 transition-all hover:bg-background/80 border border-transparent hover:border-border/50">
              <p className="text-sm text-muted-foreground">Mode</p>
              <p className="font-semibold text-foreground mt-1">Solo</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Today's Study Time</p>
          <p className="text-2xl font-bold text-foreground mt-2">3h 45m</p>
          <p className="text-xs text-secondary mt-2">+30m from yesterday</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Sessions Today</p>
          <p className="text-2xl font-bold text-foreground mt-2">4</p>
          <p className="text-xs text-muted-foreground mt-2">Avg: 56 minutes</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Current Streak</p>
          <p className="text-2xl font-bold text-foreground mt-2">12 days</p>
          <p className="text-xs text-secondary mt-2">Keep it going!</p>
        </Card>
      </div>

      <SessionHistory />
    </div>
  )
}