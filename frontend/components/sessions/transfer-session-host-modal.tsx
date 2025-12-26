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
import { UserDTO } from "@/types"

interface TransferSessionHostDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionTitle: string
  participants: UserDTO[]
  onTransferAndLeave: (newHostId: number) => void
}

export function TransferSessionHostDialog({
  open,
  onOpenChange,
  sessionTitle,
  participants,
  onTransferAndLeave,
}: TransferSessionHostDialogProps) {
  const [selectedHostId, setSelectedHostId] = useState<number | null>(null)

  const handleTransfer = () => {
    if (selectedHostId) {
      onTransferAndLeave(selectedHostId)
      onOpenChange(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl backdrop-blur-md bg-white/80 border-white/60">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-orange-100">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <AlertDialogTitle className="text-xl">Transfer Session Host</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base">
            You are the host of <span className="font-semibold text-foreground">{sessionTitle}</span>. 
            To leave while others are studying, you must transfer host duties to another participant.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          <h4 className="text-sm font-medium text-foreground mb-3">Select a new host:</h4>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {participants.map((participant) => (
              <Card
                key={participant.id}
                onClick={() => setSelectedHostId(participant.id)}
                className={`p-4 cursor-pointer transition-all ${
                  selectedHostId === participant.id
                    ? "border-primary bg-blue-50/80 shadow-sm"
                    : "border-white/60 bg-white/40 hover:bg-white/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={participant.profilePictureUrl || "/placeholder.svg"} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {participant.fullName
                          ? participant.fullName.charAt(0).toUpperCase()
                          : participant.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground">{participant.fullName}</p>
                        {selectedHostId === participant.id && (
                          <div className="flex items-center gap-1 text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                            <Crown className="h-3 w-3" />
                            <span>New Host</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="capitalize">{participant.currentStatus?.toLowerCase() || 'offline'}</span>
                      </div>
                    </div>
                  </div>
                  {selectedHostId === participant.id && (
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
            disabled={!selectedHostId}
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
