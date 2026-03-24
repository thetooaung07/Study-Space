import { Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserDTO } from "@/types";

interface SessionParticipantsPanelProps {
	participantsList: UserDTO[];
	creatorId?: number;
	handRaisedUsers: Set<number>;
}

export function SessionParticipantsPanel({
	participantsList,
	creatorId,
	handRaisedUsers,
}: SessionParticipantsPanelProps) {
	return (
		<Card className="p-4 lg:p-5 backdrop-blur-md bg-white/60 border-white/20 shrink-0">
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-2">
					<Users className="h-4 w-4 lg:h-5 lg:w-5 text-gray-700" />
					<h3 className="font-semibold text-gray-900 text-sm lg:text-base">
						Participants ({participantsList.length})
					</h3>
				</div>
			</div>

			<div className="space-y-2 max-h-48 overflow-y-auto">
				{participantsList.map((participant: UserDTO) => (
					<div
						key={participant.id}
						className="flex items-center gap-3 p-2 lg:p-2.5 rounded-lg backdrop-blur-sm bg-white/40 hover:bg-white/50 transition-colors"
					>
						<div className="relative">
							<Avatar className="h-8 w-8 lg:h-9 lg:w-9 shrink-0">
								<AvatarImage
									src={participant.profilePictureUrl || ""}
									alt={participant.fullName}
								/>
								<AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-400 text-white text-xs font-semibold">
									{participant.fullName
										? participant.fullName
												.split(" ")
												.map((n) => n[0])
												.join("")
										: participant.username?.charAt(0).toUpperCase() || "?"}
								</AvatarFallback>
							</Avatar>
							{handRaisedUsers.has(participant.id) && (
								<span className="absolute -top-1 -right-1 text-sm animate-bounce" title="Hand raised">
									✋
								</span>
							)}
						</div>
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-2">
								<p className="font-medium text-gray-900 text-xs lg:text-sm truncate">
									{participant.fullName}
								</p>
								{participant.id === creatorId && (
									<span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-700 border border-blue-500/20 shrink-0">
										Host
									</span>
								)}
							</div>
							<p className="text-[10px] lg:text-xs text-gray-600 capitalize">
								{participant.currentStatus?.toLowerCase() || "offline"}
							</p>
						</div>
						<div
							className={`h-2 w-2 rounded-full shrink-0 ${participant.currentStatus === "STUDYING" || participant.currentStatus === "ONLINE" ? "bg-green-500" : "bg-yellow-500"}`}
						/>
					</div>
				))}
			</div>
		</Card>
	);
}
