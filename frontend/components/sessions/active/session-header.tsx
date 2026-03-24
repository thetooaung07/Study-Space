import { Zap, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StudySessionDTO } from "@/types";

interface SessionHeaderProps {
	session: StudySessionDTO;
	participantCount: number;
	onLeaveSession: () => void;
}

export function SessionHeader({ session, participantCount, onLeaveSession }: SessionHeaderProps) {
	const formatSessionStartTime = (startTime?: string) => {
		if (!startTime) return "Not started";
		const date = new Date(startTime);
		return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
	};

	return (
		<Card className="p-4 lg:p-6 backdrop-blur-md bg-white/60 border-white/20 shrink-0">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<div className="h-10 w-10 lg:h-12 lg:w-12 rounded-lg bg-gradient-to-br from-orange-400/20 to-orange-500/20 flex items-center justify-center backdrop-blur-sm border border-orange-500/30">
						<Zap className="h-5 w-5 lg:h-6 lg:w-6 text-orange-600" />
					</div>
					<div>
						<h1 className="text-lg lg:text-xl font-bold text-gray-900">{session.title}</h1>
						<div className="flex items-center gap-3 mt-1">
							<span className="text-xs lg:text-sm text-gray-600">{session.subject}</span>
							<span className="h-1 w-1 rounded-full bg-gray-400" />
							<span className="text-xs lg:text-sm text-gray-600">
								Started: {formatSessionStartTime(session.startTime)}
							</span>
							<span className="h-1 w-1 rounded-full bg-gray-400" />
							<span className="flex items-center gap-1.5 text-xs lg:text-sm text-green-700">
								<span
									className={`h-2 w-2 rounded-full ${session.status === "ACTIVE" ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}
								/>
								{session.status === "ACTIVE" ? "Live" : "Scheduled"}
							</span>
						</div>
					</div>
				</div>

				<Button
					variant="outline"
					onClick={onLeaveSession}
					className="gap-2 backdrop-blur-sm bg-white/40 border-white/30 hover:bg-red-50/50 hover:border-red-200 hover:text-red-600"
				>
					<LogOut className="h-4 w-4" />
					<span className="hidden lg:inline">
						{participantCount === 1 ? "End Session" : "Leave Session"}
					</span>
				</Button>
			</div>
		</Card>
	);
}
