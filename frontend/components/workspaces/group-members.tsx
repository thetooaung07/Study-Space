import { SpaceMember } from "@/types/workspaces";
import { useAuth } from "@/context/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Users } from "lucide-react";

interface GroupMembersProps {
	members: SpaceMember[];
	onRemoveGuest: (guestId: number) => void;
}

export function GroupMembers({ members, onRemoveGuest }: Readonly<GroupMembersProps>) {
	const { user } = useAuth();
	
	const owner = members.find((m) => m.role === "OWNER");
	const guests = members.filter((m) => m.role === "GUEST");
	const isCurrentUserOwner = owner?.id === user?.id;

	return (
		<div className="flex flex-col h-full bg-card relative rounded-md overflow-hidden">
			{/* Header */}
			<div className="p-4 border-b border-border flex items-center justify-between shrink-0">
				<div>
					<h3 className="font-semibold text-sm flex items-center gap-1.5">
						<Users className="h-3.5 w-3.5 text-primary" />
						Space Members
					</h3>
					<p className="text-xs text-muted-foreground">View and manage members</p>
				</div>
				<Badge variant="secondary" className="text-[10px]">
					{members.length} member{members.length !== 1 ? "s" : ""}
				</Badge>
			</div>

			<div className="flex-1 overflow-y-auto p-4">
				<div className="space-y-4">
					{/* Owner */}
					{owner && (
						<div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
							<div className="flex items-center gap-3">
								<Avatar className="h-8 w-8">
									<AvatarImage src={owner.profilePictureUrl} />
									<AvatarFallback className="bg-primary/10 text-primary text-xs">
										{owner.fullName.charAt(0)}
									</AvatarFallback>
								</Avatar>
								<div className="flex flex-col">
									<span className="text-sm font-medium">{owner.fullName} {owner.id === user?.id && "(You)"}</span>
									<span className="text-xs text-muted-foreground">@{owner.username}</span>
								</div>
							</div>
							<Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary hover:bg-primary/20">Owner</Badge>
						</div>
					)}

					{/* Guests */}
					{guests.map((guest) => (
						<div key={guest.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors group">
							<div className="flex items-center gap-3">
								<Avatar className="h-8 w-8">
									<AvatarImage src={guest.profilePictureUrl} />
									<AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
										{guest.fullName.charAt(0)}
									</AvatarFallback>
								</Avatar>
								<div className="flex flex-col">
									<span className="text-sm font-medium">{guest.fullName} {guest.id === user?.id && "(You)"}</span>
									<span className="text-xs text-muted-foreground">@{guest.username}</span>
								</div>
							</div>
							
							<div className="flex items-center gap-2">
								<Badge variant="outline" className="text-[10px] text-muted-foreground group-hover:hidden lg:flex">Guest</Badge>
								
								{isCurrentUserOwner && guest.id !== user?.id && (
									<Button
										variant="ghost"
										size="icon"
										className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive lg:hidden group-hover:flex"
										onClick={() => onRemoveGuest(guest.id)}
										title="Remove guest"
									>
										<Trash2 className="h-3.5 w-3.5" />
									</Button>
								)}
							</div>
						</div>
					))}
					
					{guests.length === 0 && (
						<p className="text-xs text-muted-foreground text-center py-4">No guests have joined yet.</p>
					)}
				</div>
			</div>
		</div>
	);
}
