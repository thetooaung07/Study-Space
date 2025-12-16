"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Mail, Lock, Camera, Save, CloudCog, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { api } from "@/lib/api"
import { toast } from "sonner"


export function ProfileSettings() {
  const { user, login, updateUser } = useAuth()
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    if (user) {
        setUsername(user.username)
        setEmail(user.email)
    }
  }, [user])

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    if (!user) return



    try {
      const response = await api.put<any>(`/users/${user.id}`, {
        username,
        email,
        fullName: user.fullName, // Preserve existing fullName
        profilePictureUrl: user.profilePictureUrl
      })

      
   
      if (response.token) {
          api.setToken(response.token)
          updateUser(response.user)
      } else {
          updateUser(response) 
      }
      
      toast.success("Profile updated successfully")
    } catch (error) {
      console.error("Failed to update profile", error)
      toast.error("Failed to update profile. Username or email might be taken.")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match")
      return
    }
    
    if (!user) return
    
    setLoading(true)

    try {
      await api.put(`/users/${user.id}/password`, {
        currentPassword,
        newPassword
      })
      toast.success("Password updated successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      console.error("Failed to update password", error)
      toast.error("Failed to update password. Check your current password.")
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
      return <div>Loading profile...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account information and preferences</p>
      </div>

      {/* Profile Picture Card */}
      <Card className="p-6 bg-card/60 backdrop-blur-md border border-border/40 hover:bg-card/70 transition-all">
        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="w-24 h-24">
              <AvatarImage src={user.profilePictureUrl || "/placeholder.svg"} />
              <AvatarFallback className="bg-pale-blue/60 text-2xl text-foreground">
                {user.fullName
                  ? user.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                  : user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center transition-colors">
              <Camera className="w-4 h-4 text-white" />
            </button>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">{user.fullName || user.username}</h3>
            <p className="text-muted-foreground text-sm">@{user.username}</p>
            <p className="text-muted-foreground text-xs mt-1">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </Card>

      {/* Account Information Card */}
      <Card className="p-6 bg-pale-blue/60 backdrop-blur-md border border-border/40 hover:bg-pale-blue/70 transition-all">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-background/30 backdrop-blur-sm flex items-center justify-center">
            <User className="w-5 h-5 text-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Account Information</h2>
        </div>

        <form onSubmit={handleUpdateAccount} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-foreground">
              Username
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10 bg-background/80 backdrop-blur-sm border-border/50 focus:border-primary/60 transition-all"
                placeholder="Enter username"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-background/80 backdrop-blur-sm border-border/50 focus:border-primary/60 transition-all"
                placeholder="Enter email"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-primary/90 to-secondary/90 hover:from-primary hover:to-secondary text-primary-foreground backdrop-blur-sm"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Password Update Card */}
      <Card className="p-6 bg-pale-purple/60 backdrop-blur-md border border-border/40 hover:bg-pale-purple/70 transition-all">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-background/30 backdrop-blur-sm flex items-center justify-center">
            <Lock className="w-5 h-5 text-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Update Password</h2>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password" className="text-foreground">
              Current Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="current-password"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="pl-10 pr-10 bg-background/80 backdrop-blur-sm border-border/50 focus:border-primary/60 transition-all"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
              >
                {showCurrentPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-foreground">
              New Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pl-10 pr-10 bg-background/80 backdrop-blur-sm border-border/50 focus:border-primary/60 transition-all"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
              >
                {showNewPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-foreground">
              Confirm New Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 pr-10 bg-background/80 backdrop-blur-sm border-border/50 focus:border-primary/60 transition-all"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-secondary/90 to-primary/90 hover:from-secondary hover:to-primary backdrop-blur-sm"
            >
              <Lock className="w-4 h-4 mr-2" />
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Account Stats Card */}
      <Card className="p-6 bg-pale-green/60 backdrop-blur-md border border-border/40 hover:bg-pale-green/70 transition-all">
        <h2 className="text-xl font-semibold text-foreground mb-4">Account Statistics</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-background/30 backdrop-blur-sm">
            <p className="text-2xl font-bold text-foreground">
              {Math.floor((user.totalStudyMinutes || 0) / 60)}h {(user.totalStudyMinutes || 0) % 60}m
            </p>
            <p className="text-sm text-muted-foreground">Total Study Time</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-background/30 backdrop-blur-sm">
            <p className="text-2xl font-bold text-foreground capitalize">{user.currentStatus || "OFFLINE"}</p>
            <p className="text-sm text-muted-foreground">Current Status</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-background/30 backdrop-blur-sm">
            <p className="text-2xl font-bold text-foreground">
              {Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days
            </p>
            <p className="text-sm text-muted-foreground">Member Duration</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
