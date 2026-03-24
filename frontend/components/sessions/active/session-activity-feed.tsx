import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ActivityDTO } from "@/types";

interface SessionActivityFeedProps {
	activities: ActivityDTO[];
	message: string;
	onMessageChange: (message: string) => void;
	onSendMessage: (message: string) => void;
}

export function SessionActivityFeed({ 
	activities, 
	message,
	onMessageChange,
	onSendMessage 
}: SessionActivityFeedProps) {

	const handleSendAndClear = () => {
		if (!message.trim()) return;
		onSendMessage(message);
		onMessageChange("");
	};

	return (
		<Card className="flex-1 p-4 lg:p-5 backdrop-blur-md bg-white/60 border-white/20 flex flex-col min-h-0">
			<div className="flex items-center gap-2 mb-4">
				<MessageSquare className="h-4 w-4 lg:h-5 lg:w-5 text-gray-700" />
				<h3 className="font-semibold text-gray-900 text-sm lg:text-base">Activity Feed</h3>
			</div>

			<div className="flex-1 space-y-2 overflow-y-auto mb-4 min-h-0">
				{activities.length === 0 ? (
					<p className="text-xs text-gray-500 text-center">No recent activity</p>
				) : (
					activities.map((activity) => (
						<div
							key={activity.id}
							className="p-3 rounded-lg backdrop-blur-sm bg-white/40 border border-white/30"
						>
							<p className="text-xs lg:text-sm text-gray-900">
								<span className="font-semibold">{activity.userName || "Unknown"}</span>{" "}
								<span className="text-gray-600">{activity.message || activity.type}</span>
							</p>
							<p className="text-[10px] lg:text-xs text-gray-500 mt-1">
								{new Date(activity.timestamp).toLocaleTimeString()}
							</p>
						</div>
					))
				)}
			</div>

			{/* Message Input */}
			<div className="flex gap-2 shrink-0 items-center">
				<input
					type="text"
					value={message}
					onChange={(e) => onMessageChange(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							handleSendAndClear();
						}
					}}
					placeholder="Send a message..."
					className="flex-1 px-3 py-2 rounded-lg backdrop-blur-sm bg-white/40 border border-white/30 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
				/>
				<Button
					size="sm"
					onClick={handleSendAndClear}
					className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shrink-0"
				>
					Send
				</Button>
			</div>
		</Card>
	);
}
