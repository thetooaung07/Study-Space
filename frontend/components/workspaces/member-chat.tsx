import { useState, useRef, useEffect, useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Link2, FileText, AlertCircle, Sparkles, MessageSquare } from "lucide-react";
import { SpaceMessage, WorkspaceMaterial } from "@/types/workspaces";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useSpaceSocket } from "@/hooks/useSpaceSocket";
import { MaterialType } from "@/types/courses";

const MaterialIcon = ({ type }: Readonly<{ type: MaterialType }>) => {
	const cls = "h-4 w-4 shrink-0";
	switch (type) {
		case "PDF":
			return <FileText className={`${cls} text-red-500`} />;
		case "VIDEO":
			return <FileText className={`${cls} text-blue-500`} />;
		case "SLIDES":
			return <FileText className={`${cls} text-orange-500`} />;
		case "IMAGE":
			return <FileText className={`${cls} text-green-500`} />;
		default:
			return <FileText className={`${cls} text-gray-500`} />;
	}
};

interface MemberChatProps {
	spaceId: number;
	materials: WorkspaceMaterial[];
}

export function MemberChat({ spaceId, materials }: Readonly<MemberChatProps>) {
	const { user } = useAuth();
	const [messages, setMessages] = useState<SpaceMessage[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [tagQuery, setTagQuery] = useState<string | null>(null);
	const [selectedTagIndex, setSelectedTagIndex] = useState(0);

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLDivElement>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const userScrolledRef = useRef(false);

	useEffect(() => {
		const fetchHistory = async () => {
			try {
				const history = await api.get<SpaceMessage[]>(`/workspaces/spaces/${spaceId}/messages`);
				setMessages(history);
			} catch (e) {
				console.error("Failed to fetch chat history", e);
			}
		};
		fetchHistory();
	}, [spaceId]);

	const handleNewMessage = (msg: SpaceMessage) => {
		setMessages((prev) => {
			if (prev.some((m) => m.id === msg.id)) return prev;
			return [...prev, msg];
		});
		userScrolledRef.current = false;
	};

	useSpaceSocket({
		spaceId: spaceId.toString(),
		onNewMessage: handleNewMessage,
	});

	const handleScroll = () => {
		const el = scrollContainerRef.current;
		if (!el) return;
		userScrolledRef.current = el.scrollHeight - el.scrollTop - el.clientHeight > 80;
	};

	useEffect(() => {
		if (!userScrolledRef.current) {
			messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages]);

	useEffect(() => {
		setSelectedTagIndex(0);
	}, [tagQuery]);

	const handleInput = () => {
		if (!inputRef.current) return;

		const textVal = inputRef.current.textContent || "";
		const hasTags = inputRef.current.querySelector("[data-material-id]");
		if (textVal.trim() === "" && !hasTags) {
			inputRef.current.innerHTML = "";
		}

		const selection = window.getSelection();
		if (!selection?.focusNode) {
			setTagQuery(null);
			return;
		}

		if (selection.focusNode.nodeType === Node.TEXT_NODE) {
			const text = selection.focusNode.textContent ?? "";
			const textBeforeCursor = text.slice(0, selection.focusOffset);
			const regex = /(?:^|\s)@([^\s]*)$/;
			const match = regex.exec(textBeforeCursor);
			if (match) {
				setTagQuery(match[1]);
				return;
			}
		}
		setTagQuery(null);
	};

	const filteredMaterials = useMemo(() => {
		if (tagQuery === null) return [];
		const q = tagQuery.toLowerCase();

		const taggedIds = new Set<number>();
		if (inputRef.current) {
			const existingTags = inputRef.current.querySelectorAll("[data-material-id]");
			existingTags.forEach((tag) => {
				const idStr = (tag as HTMLElement).dataset.materialId;
				if (idStr) taggedIds.add(Number(idStr));
			});
		}

		return materials.filter((m) => m.title.toLowerCase().includes(q) && !taggedIds.has(m.id)).slice(0, 5);
	}, [tagQuery, materials]);

	const insertTag = (material: WorkspaceMaterial) => {
		if (!inputRef.current) return;
		const selection = window.getSelection();
		if (!selection?.focusNode) return;

		const existingTags = inputRef.current.querySelectorAll("[data-material-id]");
		let isDuplicate = false;
		existingTags.forEach((tag) => {
			if ((tag as HTMLElement).dataset.materialId === String(material.id)) {
				isDuplicate = true;
			}
		});

		if (isDuplicate) {
			setTagQuery(null);
			inputRef.current.focus();
			return;
		}

		if (selection.focusNode.nodeType === Node.TEXT_NODE) {
			const text = selection.focusNode.textContent ?? "";
			const cursorOffset = selection.focusOffset;
			const regex = /(?:^|\s)(@([^\s]*))$/;
			const match = regex.exec(text.slice(0, cursorOffset));
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
				bubble.dataset.materialUrl = material.fileUrl;
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

	const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		if (tagQuery !== null) {
			if (e.key === "ArrowDown") {
				e.preventDefault();
				setSelectedTagIndex((p) => Math.min(p + 1, filteredMaterials.length - 1));
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				setSelectedTagIndex((p) => Math.max(p - 1, 0));
			} else if (e.key === "Enter") {
				e.preventDefault();
				if (filteredMaterials[selectedTagIndex]) insertTag(filteredMaterials[selectedTagIndex]);
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

	const parseInput = (): string => {
		if (!inputRef.current) return "";
		let question = "";
		for (const node of Array.from(inputRef.current.childNodes)) {
			if (node.nodeType === Node.TEXT_NODE) {
				question += node.textContent;
			} else if (node.nodeType === Node.ELEMENT_NODE) {
				const el = node as HTMLElement;
				if (el.dataset.materialId) {
					question += `@[${el.dataset.materialId}:${el.dataset.materialTitle}]`;
				} else {
					question += el.textContent ?? "";
				}
			}
		}
		return question.trim();
	};

	const handleSendMessage = async () => {
		if (!inputRef.current || !user || isLoading) return;
		const text = parseInput();
		if (!text) return;

		setIsLoading(true);
		try {
			await api.post(`/workspaces/spaces/${spaceId}/messages`, {
				userId: user.id,
				content: text,
			});
			inputRef.current.innerHTML = "";
			setTagQuery(null);
			userScrolledRef.current = false;
		} catch (err: any) {
			console.error("Failed to send space message", err);
			toast.error("Failed to send message");
		} finally {
			setIsLoading(false);
		}
	};

	const renderMessageText = (text: string) => {
		const regex = /@\[(\d+):([^\]]+)\]/g;
		const parts: React.ReactNode[] = [];
		let lastIndex = 0;
		let match: RegExpExecArray | null;

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
		<div className="flex flex-col h-full bg-card relative rounded-md overflow-hidden">
			{/* Header */}
			<div className="p-4 border-b border-border flex items-center justify-between shrink-0">
				<div>
					<h3 className="font-semibold text-sm flex items-center gap-1.5">
						<MessageSquare className="h-3.5 w-3.5 text-primary" />
						Member Chat
					</h3>
					<p className="text-xs text-muted-foreground">Chat with peers · Tag @ files for context</p>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto p-4" ref={scrollContainerRef} onScroll={handleScroll}>
				<div className="space-y-4 flex flex-col">
					{messages.length === 0 ? (
						<p className="text-sm text-muted-foreground text-center my-8">No messages yet. Say hi!</p>
					) : (
						messages.map((msg) => {
							const isMe = user?.id === msg.userId;
							return (
								<div
									key={msg.id}
									className={`flex flex-col ${isMe ? "self-end items-end" : "self-start items-start"}`}
								>
									<div className="flex items-center gap-1.5 mb-1 px-1">
										<span className="text-xs font-medium">{isMe ? "You" : msg.userFullName}</span>
										<span className="text-[10px] text-muted-foreground">
											{format(new Date(msg.createdAt), "HH:mm")}
										</span>
									</div>
									<div
										className={`px-3 py-2 rounded-lg text-sm max-w-[90%] leading-relaxed whitespace-pre-wrap ${
											isMe
												? "bg-accent text-accent-foreground border border-border shadow-sm rounded-tr-none"
												: "bg-primary/5 dark:bg-primary/10 text-neutral-900 dark:text-neutral-50 border border-primary/20 rounded-tl-none shadow-xs"
										}`}
									>
										{renderMessageText(msg.content)}
									</div>
								</div>
							);
						})
					)}
					<div ref={messagesEndRef} />
				</div>
			</div>

			<div className="p-3 border-t border-border bg-background relative shrink-0">
				{tagQuery !== null && (
					<div className="absolute bottom-full left-0 w-full p-2 pb-0">
						<div className="bg-popover border border-border rounded-md shadow-md overflow-hidden">
							{filteredMaterials.length === 0 ? (
								<div className="p-3 text-xs text-muted-foreground text-center">
									No materials found for &ldquo;{tagQuery}&rdquo;
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
											className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors text-left ${
												idx === selectedTagIndex
													? "bg-accent text-accent-foreground"
													: "hover:bg-accent/50"
											}`}
										>
											<MaterialIcon type={mat.fileType} />
											<span className="truncate flex-1">{mat.title}</span>
											<span className="text-[10px] text-muted-foreground shrink-0">
												{mat.fileType}
											</span>
										</button>
									))}
								</div>
							)}
						</div>
					</div>
				)}

				<div className="flex flex-col border border-input rounded-xl p-1 bg-background focus-within:ring-3/50 focus-within:ring-ring/50 focus-within:border-ring/50 shadow-xs">
					<div
						tabIndex={0}
						aria-label="Send a message"
						aria-multiline="true"
						ref={inputRef}
						contentEditable={!isLoading}
						onInput={handleInput}
						onKeyDown={handleKeyDown}
						data-placeholder="Send a message... Use @ to attach a file"
						className="w-full min-h-[44px] max-h-[120px] overflow-y-auto bg-transparent px-3 py-2 text-sm focus-visible:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground cursor-text aria-disabled:opacity-50"
					/>
					<div className="flex items-center justify-end border-t border-border/40 pt-2 pb-1 px-2 mt-1 shrink-0">
						<Button
							size="sm"
							onClick={handleSendMessage}
							disabled={isLoading}
							className="h-7 gap-1.5 shadow-md rounded-lg px-3 font-medium text-xs transition-all hover:shadow-lg active:scale-95"
						>
							<span>Send</span>
							<Send className="h-3.5 w-3.5" />
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
