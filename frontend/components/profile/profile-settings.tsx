"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Mail, Lock, Camera, Save, Eye, EyeOff, AlertTriangle, Trash2, Clock, CalendarDays, Activity, Flame } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


export function ProfileSettings() {
  const { user, login, updateUser, logout } = useAuth()
  const router = useRouter()
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

  const getStatusStyles = (status: string) => {
      switch (status) {
          case 'ONLINE':
              return 'bg-green-500/10 text-green-600'
          case 'STUDYING':
              return 'bg-blue-500/10 text-blue-600'
          case 'AWAY':
              return 'bg-yellow-500/10 text-yellow-600'
          case 'OFFLINE':
          default:
              return 'bg-secondary text-secondary-foreground'
      }
  }

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

  const handleDeleteAccount = async () => {
    if (!user) return
    setLoading(true)

    try {
      await api.delete(`/users/${user.id}`)
      toast.success("Account deleted successfully")
      logout()
      router.push("/login")
    } catch (error) {
      console.error("Failed to delete account", error)
      toast.error("Failed to delete account.")
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
      return (
        <div className="flex items-center justify-center p-12">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )
  }

  const joinDate = new Date(user.createdAt).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
  })

  return (
    <div className="p-6 space-y-8 max-w-[1600px]">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account information and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Avatar & Stats */}
        <div className="lg:col-span-4 flex flex-col gap-6 h-full">
            {/* Profile Card */}
            <Card className="overflow-hidden border-border/50 shadow-sm pt-0 shrink-0">
                <div className="h-36 bg-gradient-to-r from-primary/10 to-primary/5"></div>
                <div className="px-6 pb-6">
                    <div className="relative -mt-16 mb-4 flex justify-between items-end">
                         <div className="relative">
                            <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
                                <AvatarImage src={user.profilePictureUrl || "/placeholder.svg"} className="object-cover" />
                                <AvatarFallback className="text-4xl bg-secondary text-primary font-semibold">
                                {user.fullName
                                    ? user.fullName
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                    : user.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <Button size="icon" variant="secondary" className="absolute bottom-0 right-0 rounded-full shadow-md h-8 w-8 border-2 border-background">
                                <Camera className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                   
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold">{user.fullName || user.username}</h2>
                        <p className="text-muted-foreground">@{user.username}</p>
                    </div>

                    <div className="mt-6 flex flex-col gap-2">
                        <div className="flex items-center text-sm text-muted-foreground">
                            <CalendarDays className="w-4 h-4 mr-2 opacity-70" />
                            Joined {joinDate}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                            <Mail className="w-4 h-4 mr-2 opacity-70" />
                            {user.email}
                        </div>
                    </div>
                </div>
            </Card>

             {/* Account Stats */}
            <Card className="border-border/50 shadow-sm flex flex-col flex-1">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        Statistics
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 flex-1">
                     <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                         <div className="flex items-center gap-3">
                             <div className="p-2 bg-blue-500/10 text-blue-500 rounded-md">
                                 <Clock className="w-4 h-4" />
                             </div>
                             <span className="text-sm font-medium">Study Time</span>
                         </div>
                         <span className="font-bold">
                             {Math.floor((user.totalStudyMinutes || 0) / 60)}h {(user.totalStudyMinutes || 0) % 60}m
                         </span>
                     </div>
                     <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                         <div className="flex items-center gap-3">
                             <div className="p-2 bg-orange-500/10 text-orange-500 rounded-md">
                                 <Flame className="w-4 h-4" />
                             </div>
                             <span className="text-sm font-medium">Current Streak</span>
                         </div>
                         <span className="font-bold">
                             {user.currentStreak || 0} days
                         </span>
                     </div>
                     <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                         <div className="flex items-center gap-3">
                             <div className="p-2 bg-green-500/10 text-green-500 rounded-md">
                                 <Activity className="w-4 h-4" />
                             </div>
                             <span className="text-sm font-medium">Status</span>
                         </div>
                         <span className={`font-bold text-xs uppercase tracking-wide ${getStatusStyles(user.currentStatus || "OFFLINE")} px-2 py-1 rounded`}>
                             {user.currentStatus || "OFFLINE"}
                         </span>
                     </div>
                </CardContent>
            </Card>
        </div>

        {/* Right Column: Forms */}
        <div className="lg:col-span-8 flex flex-col gap-6 h-full">
             {/* General Settings */}
             <Card className="border-border/50 shadow-sm">
                 <CardHeader>
                     <CardTitle>Account Information</CardTitle>
                     <CardDescription>Update your profile details</CardDescription>
                 </CardHeader>
                 <CardContent>
                    <form onSubmit={handleUpdateAccount} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Username"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email address"
                                    disabled={user.authProvider !== 'LOCAL'}
                                />
                                {user.authProvider !== 'LOCAL' && (
                                    <p className="text-xs text-muted-foreground">
                                        Managed by {user.authProvider}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end pt-4">
                             <Button type="submit" disabled={loading}>
                                {loading && <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent border-white" />}
                                Save Changes
                             </Button>
                        </div>
                    </form>
                 </CardContent>
             </Card>

             {/* Password Settings */}
             {user.authProvider === 'LOCAL' && (
                 <Card className="border-border/50 shadow-sm">
                     <CardHeader>
                         <CardTitle>Security</CardTitle>
                         <CardDescription>Update your password</CardDescription>
                     </CardHeader>
                     <CardContent>
                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <div className="relative">
                                    <Input
                                        id="current-password"
                                        type={showCurrentPassword ? "text" : "password"}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="new-password">New Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="new-password"
                                            type={showNewPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password">Confirm Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirm-password"
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={loading} variant="outline">
                                    {loading ? "Updating..." : "Update Password"}
                                </Button>
                            </div>
                        </form>
                     </CardContent>
                 </Card>
             )}

            {/* Danger Zone */}
            <Card className="border-red-500/20 bg-red-500/5 shadow-sm mt-auto">
                 <CardHeader>
                     <div className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-5 h-5" />
                        <CardTitle className="text-lg">Danger Zone</CardTitle>
                     </div>
                     <CardDescription className="text-red-600/80">Irreversible account actions</CardDescription>
                 </CardHeader>
                 <CardContent className="flex items-center justify-between">
                     <div className="space-y-1">
                         <p className="font-medium text-foreground">Delete Account</p>
                         <p className="text-sm text-muted-foreground">Permanently delete your account and all data.</p>
                     </div>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">Delete Account</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Delete Account
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                 </CardContent>
            </Card>

        </div>
      </div>
    </div>
  )
}
