"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { User, Send, Link2, FileText, Presentation, Film, FileImage, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { WorkspaceMaterial } from "@/types/workspaces";
import type { MaterialType } from "@/types/courses";
import { useAuth } from "@/context/auth-context";
import { format } from "date-fns";

const MaterialIcon = ({ type }: { type: MaterialType }) => {
	const cls = "h-3.5 w-3.5 shrink-0";
	switch (type) {
		case "PDF":
			return <FileText className={cls + " text-red-500"} />;
		case "SLIDES":
			return <Presentation className={cls + " text-orange-500"} />;
		case "VIDEO":
			return <Film className={cls + " text-purple-500"} />;
		case "IMAGE":
			return <FileImage className={cls + " text-blue-500"} />;
		default:
			return <File className={cls + " text-muted-foreground"} />;
	}
};

interface Message {
	id: string;
	userId: number;
	userName: string;
	text: string;
	timestamp: Date;
}

interface ContextualChatProps {
	materials: WorkspaceMaterial[];
}

export function ContextualChat({ materials }: ContextualChatProps) {
	const { user } = useAuth();
	const [width, setWidth] = useState(384);
	const [messages, setMessages] = useState<Message[]>([
		{
			id: "1",
			userId: 0,
			userName: "System",
			text: "Welcome to the contextual messaging system. You can anchor course materials to your messages by typing @.",
			timestamp: new Date(),
		},
	]);
	const [tagQuery, setTagQuery] = useState<string | null>(null);
	const [selectedTagIndex, setSelectedTagIndex] = useState(0);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLDivElement>(null);

	const handleMouseDown = (e: React.MouseEvent) => {
		e.preventDefault();
		const startX = e.pageX;
		const startWidth = width;

		const onMouseMove = (moveEvent: MouseEvent) => {
			const delta = startX - moveEvent.pageX;
			setWidth(Math.max(280, Math.min(800, startWidth + delta)));
		};

		const onMouseUp = () => {
			document.removeEventListener("mousemove", onMouseMove);
			document.removeEventListener("mouseup", onMouseUp);
		};

		document.addEventListener("mousemove", onMouseMove);
		document.addEventListener("mouseup", onMouseUp);
	};

	// Scroll to bottom on new message
	useEffect(() => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages]);

	// Reset tag selection index on new query
	useEffect(() => {
		setSelectedTagIndex(0);
	}, [tagQuery]);

	const handleInput = () => {
		if (!inputRef.current) return;
		const selection = window.getSelection();
		if (!selection || !selection.focusNode) {
			setTagQuery(null);
			return;
		}

		if (selection.focusNode.nodeType === Node.TEXT_NODE) {
			const text = selection.focusNode.textContent || "";
			const cursorOffset = selection.focusOffset;
			const textBeforeCursor = text.slice(0, cursorOffset);

			const match = textBeforeCursor.match(/(?:^|\s)@([^\s]*)$/);
			if (match) {
				setTagQuery(match[1]);
				return;
			}
		}
		setTagQuery(null);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		if (tagQuery !== null) {
			if (e.key === "ArrowDown") {
				e.preventDefault();
				setSelectedTagIndex((prev) => Math.min(prev + 1, filteredMaterials.length - 1));
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				setSelectedTagIndex((prev) => Math.max(prev - 1, 0));
			} else if (e.key === "Enter") {
				e.preventDefault();
				if (filteredMaterials[selectedTagIndex]) {
					insertTag(filteredMaterials[selectedTagIndex]);
				}
			} else if (e.key === "Escape") {
				e.preventDefault();
				setTagQuery(null);
			}
			return;
		}

		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	const filteredMaterials = useMemo(() => {
		if (tagQuery === null) return [];
		const lowerQuery = tagQuery.toLowerCase();
		return materials.filter((m) => m.title.toLowerCase().includes(lowerQuery)).slice(0, 5);
	}, [tagQuery, materials]);

	const insertTag = (material: WorkspaceMaterial) => {
		if (!inputRef.current) return;
		const selection = window.getSelection();
		if (!selection || !selection.focusNode) return;

		if (selection.focusNode.nodeType === Node.TEXT_NODE) {
			const text = selection.focusNode.textContent || "";
			const cursorOffset = selection.focusOffset;
			const textBeforeCursor = text.slice(0, cursorOffset);

			const match = textBeforeCursor.match(/(?:^|\s)(@([^\s]*))$/);
			if (match) {
				const atString = match[1];
				const matchIndex = cursorOffset - atString.length;

				const range = document.createRange();
				range.setStart(selection.focusNode, matchIndex);
				range.setEnd(selection.focusNode, cursorOffset);
				range.deleteContents();

				const bubble = document.createElement("span");
				bubble.contentEditable = "false";
				bubble.className =
					"inline-flex items-center gap-1 bg-primary text-primary-foreground shadow-sm rounded-full px-2 py-0.5 text-xs font-medium mx-1 align-middle select-none cursor-default";
				bubble.dataset.materialId = String(material.id);
				bubble.dataset.materialTitle = material.title;
				bubble.innerHTML = `<span class="opacity-70 text-[10px]">@</span>${material.title}`;

				range.insertNode(bubble);

				const space = document.createTextNode("\u00A0");
				bubble.after(space);

				range.setStartAfter(space);
				range.setEndAfter(space);
				selection.removeAllRanges();
				selection.addRange(range);
			}
		}

		setTagQuery(null);
		inputRef.current.focus();
	};

	const handleSendMessage = () => {
		if (!inputRef.current || !user) return;

		let textRepresentation = "";
		for (const node of Array.from(inputRef.current.childNodes)) {
			if (node.nodeType === Node.TEXT_NODE) {
				textRepresentation += node.textContent;
			} else if (node.nodeType === Node.ELEMENT_NODE) {
				const el = node as HTMLElement;
				if (el.dataset.materialId) {
					textRepresentation += `@[${el.dataset.materialId}:${el.dataset.materialTitle}]`;
				} else {
					textRepresentation += el.textContent || "";
				}
			}
		}

		if (!textRepresentation.trim()) return;

		const newMessage: Message = {
			id: Date.now().toString(),
			userId: user.id,
			userName: user.fullName,
			text: textRepresentation.trim(),
			timestamp: new Date(),
		};
		setMessages([...messages, newMessage]);

		inputRef.current.innerHTML = "";
		setTagQuery(null);
	};

	// Parse message text to render tags
	const renderMessageText = (text: string) => {
		// regex to match @[id:Title]
		const regex = /@\[(\d+):([^\]]+)\]/g;
		const parts = [];
		let lastIndex = 0;
		let match;

		while ((match = regex.exec(text)) !== null) {
			if (match.index > lastIndex) {
				parts.push(<span key={lastIndex}>{text.slice(lastIndex, match.index)}</span>);
			}

			const matId = parseInt(match[1]);
			const matTitle = match[2];
			const material = materials.find((m) => m.id === matId);

			parts.push(
				<Badge
					key={match.index}
					variant="default"
					className="mx-1 inline-flex items-center gap-1 cursor-pointer hover:bg-primary/80 transition-colors align-middle shadow-sm rounded-full px-2 py-0.5 font-medium"
					onClick={() => {
						if (material) {
							// Open material in new tab
							const url = `http://localhost:8080/api/files/download?materialId=${material.id}&type=WORKSPACE&token=${localStorage.getItem("token") || ""}`;
							window.open(url, "_blank");
						}
					}}
				>
					{material ? <MaterialIcon type={material.fileType} /> : <Link2 className="h-3 w-3" />}
					<span className="truncate max-w-[150px]">{matTitle}</span>
				</Badge>,
			);
			lastIndex = regex.lastIndex;
		}

		if (lastIndex < text.length) {
			parts.push(<span key={lastIndex}>{text.slice(lastIndex)}</span>);
		}

		return parts;
	};

	return (
		<div className="flex flex-col h-full bg-card relative border-l border-border" style={{ width: `${width}px` }}>
			<div
				className="absolute left-[-4px] top-0 bottom-0 w-2 cursor-col-resize hover:bg-primary/50 z-10 transition-colors"
				onMouseDown={handleMouseDown}
			/>
			<div className="p-4 border-b border-border flex items-center justify-between shrink-0">
				<div>
					<h3 className="font-semibold text-sm">Space Chat</h3>
					<p className="text-xs text-muted-foreground">Contextual messaging</p>
				</div>
			</div>

			<div className="pb-0 mb-0 flex-1 p-4 overflow-y-scroll">
				<div className="space-y-4">
					{messages.map((msg) => {
						const isMe = user?.id === msg.userId;
						return (
							<div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
								<div className="flex items-baseline gap-2 mb-1 px-1">
									<span className="text-xs font-medium">{isMe ? "You" : msg.userName}</span>
									<span className="text-[10px] text-muted-foreground">
										{format(msg.timestamp, "HH:mm")}
									</span>
								</div>
								<div
									className={`px-3 py-2 rounded-lg text-sm max-w-[90%] leading-relaxed ${
										isMe
											? "bg-accent text-accent-foreground border border-border shadow-sm rounded-tr-none"
											: "bg-muted text-foreground border border-transparent rounded-tl-none"
									}`}
								>
									{renderMessageText(msg.text)}
								</div>
							</div>
						);
					})}
					<div ref={messagesEndRef} />
				</div>
			</div>

			<div className="p-3 border-t border-border bg-background relative shrink-0 pb-10">
				{/* Tag Menu */}
				{tagQuery !== null && (
					<div className="absolute bottom-full left-0 w-full p-2 pb-0">
						<div className="bg-popover border border-border rounded-md shadow-md overflow-hidden">
							{filteredMaterials.length === 0 ? (
								<div className="p-3 text-xs text-muted-foreground text-center">
									No materials found for "{tagQuery}"
								</div>
							) : (
								<div className="max-h-48 overflow-y-auto">
									<div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 border-b border-border">
										Select a material
									</div>
									{filteredMaterials.map((mat, idx) => (
										<button
											key={mat.id}
											onClick={() => insertTag(mat)}
											onMouseEnter={() => setSelectedTagIndex(idx)}
											className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors text-left ${idx === selectedTagIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"}`}
										>
											<MaterialIcon type={mat.fileType} />
											<span className="truncate flex-1">{mat.title}</span>
										</button>
									))}
								</div>
							)}
						</div>
					</div>
				)}

				<div className="flex items-end gap-2">
					<div
						ref={inputRef}
						contentEditable
						onInput={handleInput}
						onKeyDown={handleKeyDown}
						data-placeholder="Type a message... Use @ to attach files"
						className="flex-1 min-h-[40px] max-h-[120px] overflow-y-auto w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground cursor-text"
					/>
					<Button size="icon" onClick={handleSendMessage} className="shrink-0 mb-0.5">
						<Send className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}
