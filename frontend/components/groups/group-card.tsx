"use client"

import { Users, Star, MoreVertical, BarChart3, LogIn, LogOut, Edit, Trash2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { StudyGroupDTO } from "@/types"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface GroupCardProps {
  group: StudyGroupDTO
  isOwned?: boolean
  onJoin?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onLeave?: () => void
}

export function GroupCard({ group, isOwned = false, onJoin, onEdit, onDelete, onLeave }: GroupCardProps) {
 
  const router = useRouter();
  const { user } = useAuth();
  const isCreator = user?.id === group.creatorId;

  const handleOnClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
      router.push(`/groups/${group.id}`)
  } 
           
  return (
    <Card className="p-5 hover:border-primary/50 hover:bg-primary/5 cursor-pointer flex flex-col h-full" onClick={handleOnClick}>
      <div className="flex items-start justify-between mb-4">
          <div className="text-3xl mb-3 bg-secondary w-16 h-16 flex justify-center items-center text-foreground rounded-full">
            {group.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex items-center gap-1 opacity-100">
          {/* <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => {
            e.stopPropagation();
          }}>
            <Star className="h-4 w-4" />
          </Button> */}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
               {isOwned ? (
                 <>
                   <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/groups/${group.id}/analytics`);
                   }}>
                     <BarChart3 className="h-4 w-4 mr-2" />
                     Analytics
                   </DropdownMenuItem>
                   
                   <DropdownMenuSeparator />

                   {isCreator ? (
                     <>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onEdit?.();
                        }}>
                           <Edit className="h-4 w-4 mr-2" />
                           Edit Group
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => {
                          e.stopPropagation();
                          onDelete?.();
                        }}>
                           <Trash2 className="h-4 w-4 mr-2" />
                           Delete Group
                        </DropdownMenuItem>
                     </>
                   ) : (
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => {
                          e.stopPropagation();
                          onLeave?.();
                      }}>
                         <LogOut className="h-4 w-4 mr-2" />
                         Leave Group
                      </DropdownMenuItem>
                   )}
                 </>
               ) : (
                  <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onJoin?.();
                  }}>
                     <LogIn className="h-4 w-4 mr-2" />
                     Join Group
                  </DropdownMenuItem>
               )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <h4 className="font-semibold text-foreground mb-1 line-clamp-2">{group.name}</h4>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-grow">{group.description}</p>

      <div className="space-y-2 mb-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>{group.memberCount} members</span>
          {/* {group.activeMemberCount !== undefined && group.activeMemberCount > 0 && (
            <span className="text-xs bg-status-live-fg text-white px-2 py-0.5 rounded">
              {group.activeMemberCount} active
            </span>
          )} */}
        </div>
        {group.totalSessionsCount !== undefined && group.totalSessionsCount > 0 && (
          <div className="text-xs">{group.totalSessionsCount} study sessions</div>
        )}
      </div>

      <div className="mt-auto">
        {isOwned ? (
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Created:</span> {new Date(group.createdAt).toLocaleDateString()}
            </p>
          </div>
        ) : (
           /* Keeping Join button visible for non-members as a primary CTA */
          <Button className="w-full gap-2" onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onJoin?.();
          }}>
            <LogIn className="h-4 w-4" />
            Join Group
          </Button>
        )}
      </div>
    </Card>
  )
}
