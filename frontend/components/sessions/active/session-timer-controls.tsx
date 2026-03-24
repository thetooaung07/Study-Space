import { Coffee, Play, Hand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserDTO } from "@/types";

interface SessionTimerControlsProps {
	elapsedTime: number;
	isPlaying: boolean;
	participantsList: UserDTO[];
	onPauseToggle: () => void;
	onRaiseHand: () => void;
}

export function SessionTimerControls({
	elapsedTime,
	isPlaying,
	participantsList,
	onPauseToggle,
	onRaiseHand,
}: SessionTimerControlsProps) {
	const formatTime = (seconds: number) => {
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = seconds % 60;
		return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
	};

	const studyingCount = participantsList.filter(
		(p) => !p.currentStatus || p.currentStatus === "STUDYING" || p.currentStatus === "ONLINE",
	).length;

	const onBreakCount = participantsList.filter((p) => p.currentStatus === "AWAY").length;

	return (
		<Card className="flex-1 p-6 lg:p-8 backdrop-blur-md bg-white/60 border-white/20 flex flex-col items-center justify-center min-h-0">
			<div className="text-center space-y-6 lg:space-y-8 w-full max-w-2xl">
				{/* Large Timer Display */}
				<div>
					<div className="text-5xl sm:text-6xl lg:text-8xl font-bold text-gray-900 font-mono tracking-tight">
						{formatTime(elapsedTime)}
					</div>
					<p className="text-sm lg:text-base text-gray-600 mt-3 lg:mt-4">
						Your study time {isPlaying ? "(studying)" : "(on break)"}
					</p>
				</div>

				{/* Session Controls */}
				<div className="flex items-center justify-center gap-3 lg:gap-4">
					<Button
						size="lg"
						variant="outline"
						onClick={onPauseToggle}
						className={`w-36 h-12 lg:h-14 px-6 lg:px-8 gap-2 ${
							!isPlaying
								? "text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:text-white border-transparent"
								: "backdrop-blur-sm bg-white/40 border-white/30 hover:bg-white/60"
						}`}
					>
						{isPlaying ? (
							<>
								<Coffee className="h-5 w-5" />
								<span className="hidden sm:inline">Take a Break</span>
							</>
						) : (
							<>
								<Play className="h-5 w-5" />
								<span className="hidden sm:inline">Resume</span>
							</>
						)}
					</Button>

					<Button
						size="lg"
						variant="outline"
						onClick={onRaiseHand}
						className="h-12 lg:h-14 px-6 lg:px-8 gap-2 backdrop-blur-sm bg-white/40 border-white/30 hover:bg-white/60"
					>
						<Hand className="h-5 w-5" />
						<span className="hidden sm:inline">Raise Hand</span>
					</Button>
				</div>

				{/* Quick Stats */}
				<div className="grid grid-cols-3 gap-3 lg:gap-4 pt-4 lg:pt-6">
					<div className="p-3 lg:p-4 rounded-lg backdrop-blur-sm bg-white/40 border border-white/30">
						<p className="text-xs lg:text-sm text-gray-600">Participants</p>
						<p className="text-xl lg:text-2xl font-bold text-gray-900 mt-1">
							{participantsList.length}
						</p>
					</div>
					<div className="p-3 lg:p-4 rounded-lg backdrop-blur-sm bg-white/40 border border-white/30">
						<p className="text-xs lg:text-sm text-gray-600">Studying</p>
						<p className="text-xl lg:text-2xl font-bold text-gray-900 mt-1">{studyingCount}</p>
					</div>
					<div className="p-3 lg:p-4 rounded-lg backdrop-blur-sm bg-white/40 border border-white/30">
						<p className="text-xs lg:text-sm text-gray-600">On Break</p>
						<p className="text-xl lg:text-2xl font-bold text-gray-900 mt-1">{onBreakCount}</p>
					</div>
				</div>
			</div>
		</Card>
	);
}
