"use client"

import { useState, useEffect, useCallback } from "react"
import { Clock, Play, Pause, Save, Timer, RotateCcw } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

const PRESETS = [15, 25, 45, 60] as const
const DEFAULT_TIMER_MINUTES = 25

type TimerMode = "stopwatch" | "timer"

interface TimeDisplayProps {
  hours: string
  minutes: string
  seconds: string
}

interface TimerControlsProps {
  isTracking: boolean
  isSessionActive: boolean
  onToggle: () => void
  onReset: () => void
  onFinish: () => void
}

interface TimerPresetsProps {
  customMinutes: string
  onPresetSelect: (minutes: number) => void
  onCustomChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

interface SessionStatsProps {
  subject: string
  focusLevel: string
  mode: string
}

// Helper Functions
const formatTime = (totalSeconds: number) => ({
  hours: String(Math.floor(totalSeconds / 3600)).padStart(2, "0"),
  minutes: String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0"),
  seconds: String(totalSeconds % 60).padStart(2, "0"),
})

const getStatusMessage = (isTracking: boolean, isSessionActive: boolean) => {
  if (isTracking) return "Focus mode active..."
  if (isSessionActive) return "Session paused"
  return "Ready to start"
}

/** Mode Toggle Tabs */
function ModeSelector({ 
  mode, 
  isSessionActive, 
  onModeChange 
}: { 
  mode: TimerMode
  isSessionActive: boolean
  onModeChange: (mode: TimerMode) => void 
}) {
  return (
    <div className="absolute top-4 right-4">
      <Tabs 
        value={mode} 
        onValueChange={(val) => !isSessionActive && onModeChange(val as TimerMode)} 
        className="w-[200px]"
      >
        <TabsList className="grid w-full grid-cols-2 bg-muted/60 border border-border/50">
          <TabsTrigger 
            value="stopwatch" 
            disabled={isSessionActive}
            className="data-[state=active]:bg-secondary data-[state=active]:shadow-sm"
          >
            Stopwatch
          </TabsTrigger>
          <TabsTrigger 
            value="timer" 
            disabled={isSessionActive}
            className="data-[state=active]:bg-secondary data-[state=active]:shadow-sm"
          >
            Timer
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}

/** Time Display with hours:minutes:seconds */
function TimeDisplay({ hours, minutes, seconds }: TimeDisplayProps) {
  return (
    <div className="flex items-baseline justify-center font-mono leading-none">
      <span className="text-8xl font-bold text-primary tracking-tighter tabular-nums">
        {hours}:{minutes}
      </span>
      <span className="text-4xl font-medium text-muted-foreground/50 ml-2 tabular-nums">
        :{seconds}
      </span>
    </div>
  )
}

/** Timer Preset Buttons & Custom Input */
function TimerPresets({ customMinutes, onPresetSelect, onCustomChange }: TimerPresetsProps) {
  return (
    <div className="w-full flex items-center justify-center gap-3">
      <div className="flex gap-2">
        {PRESETS.map((min) => (
          <Button
            key={min}
            variant="outline"
            size="sm"
            onClick={() => onPresetSelect(min)}
            className={cn(  
              "h-8 px-3 text-xs border-secondary hover:border-primary/50",
              customMinutes === min.toString() && "bg-secondary text-primary border-secondary"
            )}
          >
            {min}m
          </Button>
        ))}
      </div>

      <div className="h-4 w-px bg-border" />

      <div className="flex items-center gap-2">
        <Label htmlFor="duration" className="text-xs text-muted-foreground font-bold uppercase">
          Custom
        </Label>
        <Input 
          id="duration"
          type="number" 
          min="1"
          value={customMinutes}
          onChange={onCustomChange}
          className="w-16 text-center h-8 bg-background/50 text-xs focus:ring-2 focus:ring-primary/20"
        />
      </div>
    </div>
  )
}

/** Control Buttons (Reset, Start/Pause, Finish) */
function TimerControls({ isTracking, isSessionActive, onToggle, onReset, onFinish }: TimerControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <Button 
        size="icon" 
        variant="ghost" 
        onClick={onReset}
        disabled={!isSessionActive && !isTracking}
        className="text-muted-foreground hover:text-foreground hover:bg-muted"
        title="Reset Timer"
      >
        <RotateCcw className="h-5 w-5" />
      </Button>

      <Button
        size="lg"
        onClick={onToggle}
        className={cn(
          "w-32 shadow-lg transition-colors",
          isTracking 
            ? "bg-destructive hover:bg-destructive/90 shadow-destructive/20" 
            : "shadow-primary/20"
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
        onClick={onFinish}
        disabled={!isSessionActive}
        className="hover:bg-primary/5"
      >
        <Save className="h-5 w-5 mr-2" />
        Finish
      </Button>
    </div>
  )
}

/** Session Stats Grid */
function SessionStats({ subject, focusLevel, mode }: SessionStatsProps) {
  const stats = [
    { label: "Subject", value: subject },
    { label: "Focus Level", value: focusLevel },
    { label: "Mode", value: mode },
  ]

  return (
    <div className="grid grid-cols-3 gap-4 pt-4">
      {stats.map(({ label, value }) => (
        <div 
          key={label}
          className="bg-background/50 rounded-lg p-4 hover:bg-background/80 border border-transparent hover:border-border/50 transition-colors"
        >
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-semibold text-foreground mt-1">{value}</p>
        </div>
      ))}
    </div>
  )
}

/** Main Timer Card Component */
export function TimerCard() {
  // Timer State
  const [mode, setMode] = useState<TimerMode>("stopwatch")
  const [isTracking, setIsTracking] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIMER_MINUTES * 60)
  const [initialTime, setInitialTime] = useState(DEFAULT_TIMER_MINUTES * 60)
  const [customMinutes, setCustomMinutes] = useState(DEFAULT_TIMER_MINUTES.toString())

  // Derived State
  const isSessionActive = mode === "stopwatch" ? elapsedTime > 0 : timeLeft !== initialTime
  const activeTime = mode === "stopwatch" ? elapsedTime : timeLeft
  const { hours, minutes, seconds } = formatTime(activeTime)

  // Timer Effect
  useEffect(() => {
    if (!isTracking) return

    const interval = setInterval(() => {
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

    return () => clearInterval(interval)
  }, [isTracking, mode])

  // Handlers
  const handleSetDuration = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0
    setCustomMinutes(e.target.value)
    if (!isTracking) {
      setTimeLeft(val * 60)
      setInitialTime(val * 60)
    }
  }, [isTracking])

  const handlePreset = useCallback((minutes: number) => {
    setCustomMinutes(minutes.toString())
    setTimeLeft(minutes * 60)
    setInitialTime(minutes * 60)
  }, [])

  const handleReset = useCallback(() => {
    setIsTracking(false)
    if (mode === "stopwatch") {
      setElapsedTime(0)
    } else {
      setTimeLeft(initialTime)
    }
  }, [mode, initialTime])

  const handleFinish = useCallback(() => {
    setIsTracking(false)
    // TODO: Save session with duration
    
    if (mode === "stopwatch") {
      setElapsedTime(0)
    } else {
      setTimeLeft(initialTime)
    }
  }, [mode, initialTime])

  const handleModeChange = useCallback((newMode: TimerMode) => {
    setMode(newMode)
    setIsTracking(false)
  }, [])

  const handleToggleTracking = useCallback(() => {
    setIsTracking((prev) => !prev)
  }, [])

  return (
    <Card className="relative p-8 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 overflow-hidden">
      <ModeSelector 
        mode={mode} 
        isSessionActive={isSessionActive} 
        onModeChange={handleModeChange} 
      />

      <div className="text-center space-y-6 mt-4">
        {/* Mode Icon & Label */}
        <div className="flex items-center justify-center gap-2 text-muted-foreground/80">
          {mode === "stopwatch" ? <Clock className="h-5 w-5" /> : <Timer className="h-5 w-5" />}
          <h3 className="text-lg font-medium">
            {mode === "stopwatch" ? "Elapsed Time" : "Time Remaining"}
          </h3>
        </div>

        {/* Time Display & Presets */}
        <div className="flex flex-col items-center">
          <TimeDisplay hours={hours} minutes={minutes} seconds={seconds} />
          
          <div className="min-h-[3.5rem] flex flex-col justify-center items-center w-full mt-2">
            {mode === "timer" && !isSessionActive ? (
              <TimerPresets 
                customMinutes={customMinutes}
                onPresetSelect={handlePreset}
                onCustomChange={handleSetDuration}
              />
            ) : (
              <div className="text-muted-foreground/40 text-sm font-medium italic">
                {getStatusMessage(isTracking, isSessionActive)}
              </div>
            )}
          </div>
        </div>

        {/* Control Buttons */}
        <TimerControls 
          isTracking={isTracking}
          isSessionActive={isSessionActive}
          onToggle={handleToggleTracking}
          onReset={handleReset}
          onFinish={handleFinish}
        />

        {/* Session Stats */}
        <SessionStats subject="Mathematics" focusLevel="High" mode="Solo" />
      </div>
    </Card>
  )
}
