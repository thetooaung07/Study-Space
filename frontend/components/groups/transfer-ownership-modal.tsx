import { useState } from "react"
import { Crown, ArrowRight, AlertTriangle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface TransferOwnershipDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupName: string
  groupId: string
  members: Array<{
    id: number
    name: string
    avatar: string
    studyTime: number
    sessionsCount: number
    joinedDate: string
  }>
  onTransferAndLeave: (newOwnerId: number) => void
}

export function TransferOwnershipDialog({
  open,
  onOpenChange,
  groupName,
  groupId,
  members,
  onTransferAndLeave,
}: TransferOwnershipDialogProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)

  const handleTransfer = () => {
    if (selectedMemberId) {
      onTransferAndLeave(selectedMemberId)
      onOpenChange(false)
    }
  }

  const formatStudyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}m`
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl backdrop-blur-md bg-white/80 border-white/60">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-orange-100">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <AlertDialogTitle className="text-xl">Transfer Group Ownership</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base">
            You cannot delete <span className="font-semibold text-foreground">{groupName}</span> while it has active
            members. To leave this group, you must first transfer ownership to another member.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          <h4 className="text-sm font-medium text-foreground mb-3">Select a new owner:</h4>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {members.map((member) => (
              <Card
                key={member.id}
                onClick={() => setSelectedMemberId(member.id)}
                className={`p-4 cursor-pointer transition-all ${
                  selectedMemberId === member.id
                    ? "border-primary bg-blue-50/80 shadow-sm"
                    : "border-white/60 bg-white/40 hover:bg-white/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {member.name ? member.name.charAt(0).toUpperCase() : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground">{member.name}</p>
                        {selectedMemberId === member.id && (
                          <div className="flex items-center gap-1 text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                            <Crown className="h-3 w-3" />
                            <span>New Owner</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{formatStudyTime(member.studyTime)} studied</span>
                        <span>•</span>
                        <span>{member.sessionsCount} sessions</span>
                        <span>•</span>
                        <span>Joined {member.joinedDate}</span>
                      </div>
                    </div>
                  </div>
                  {selectedMemberId === member.id && (
                    <div className="ml-4">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-white/60 border-white/60">
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={!selectedMemberId}
            className="gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          >
            Transfer & Leave
            <ArrowRight className="h-4 w-4" />
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
