"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
	Send,
	Link2,
	FileText,
	Presentation,
	Film,
	FileImage,
	File,
	Loader2,
	Sparkles,
	AlertCircle,
	ChevronDown,
	Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { WorkspaceMaterial } from "@/types/workspaces";
import type { MaterialType } from "@/types/courses";
import { useAuth } from "@/context/auth-context";
import { ChatQueryRequest, ChatQueryResponse, chatApi } from "@/lib/workspace-api";
import { API_BASE_URL } from "@/lib/api";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ─── Material icon helper ────────────────────────────────────────────────────

const MaterialIcon = ({ type }: Readonly<{ type: MaterialType }>) => {
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

// ─── Lightweight Syntax Highlighter (no extra npm dependencies, highly optimized)
const highlightCode = (codeText: string): React.ReactNode[] => {
	const COMMENT = "(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)";
	const STRING = "(\"(?:\\\\.|[^\"\\\\])*\"|'(?:\\\\.|[^'\\\\])*'|`(?:\\\\.|[^`\\\\])*`)";
	const KEYWORD =
		"(\\b(?:public|private|protected|class|interface|enum|extends|implements|void|return|import|package|const|let|var|function|new|if|else|for|while|switch|case|default|try|catch|finally|throw|throws|static|final|volatile|transient|synchronized|abstract|native|strictfp|export|from|as|await|async|yield|debugger|super|this|typeof|instanceof|in|of|delete|null|true|false)\\b)";
	const CLASS_NAME = "(\\b(?:[A-Z]\\w+)\\b)";
	const FUNCTION_CALL = "(\\b\\w+)(?=\\()";
	const NUMBER = "(\\b\\d+(?:\\.\\d+)?\\b)";

	const regex = new RegExp([COMMENT, STRING, KEYWORD, CLASS_NAME, FUNCTION_CALL, NUMBER].join("|"), "g");

	const parts: React.ReactNode[] = [];
	let lastIndex = 0;
	let match;

	while ((match = regex.exec(codeText)) !== null) {
		const matchIndex = match.index;

		// Add plain text before match
		if (matchIndex > lastIndex) {
			parts.push(codeText.slice(lastIndex, matchIndex));
		}

		const [full, comment, string, keyword, className, func, number] = match;

		let classNameSpan = "";
		if (comment) classNameSpan = "text-neutral-450 dark:text-neutral-500 italic";
		else if (string) classNameSpan = "text-[#116329] dark:text-emerald-400 font-medium";
		else if (keyword) classNameSpan = "text-[#CF222E] dark:text-fuchsia-400 font-semibold";
		else if (className) classNameSpan = "text-[#8250DF] dark:text-cyan-400 font-semibold";
		else if (func) classNameSpan = "text-[#0550AE] dark:text-blue-300";
		else if (number) classNameSpan = "text-[#953800] dark:text-amber-400";

		if (classNameSpan) {
			parts.push(
				<span key={matchIndex} className={classNameSpan}>
					{full}
				</span>,
			);
		} else {
			parts.push(full);
		}

		lastIndex = regex.lastIndex;
	}

	if (lastIndex < codeText.length) {
		parts.push(codeText.slice(lastIndex));
	}

	return parts;
};

// ─── Markdown renderer for AI messages ───────────────────────────────────────

import type { Components } from "react-markdown";

const H1 = ({ children }: any) => (
	<h1 className="text-base font-bold mt-3 mb-1.5 first:mt-0 text-neutral-900 dark:text-neutral-50">{children}</h1>
);
const H2 = ({ children }: any) => (
	<h2 className="text-sm font-bold mt-3 mb-1 first:mt-0 text-neutral-900 dark:text-neutral-50">{children}</h2>
);
const H3 = ({ children }: any) => (
	<h3 className="text-sm font-semibold mt-2.5 mb-1 first:mt-0 text-neutral-900 dark:text-neutral-50">{children}</h3>
);
const P = ({ children }: any) => (
	<p className="mb-2 last:mb-0 leading-relaxed text-neutral-850 dark:text-neutral-200">{children}</p>
);
const Strong = ({ children }: any) => (
	<strong className="font-bold text-neutral-950 dark:text-neutral-50">{children}</strong>
);
const Em = ({ children }: any) => <em className="italic text-neutral-600 dark:text-neutral-400">{children}</em>;
const Ul = ({ children }: any) => (
	<ul className="list-disc list-outside pl-4 mb-2 space-y-0.5 text-neutral-850 dark:text-neutral-200">{children}</ul>
);
const Ol = ({ children }: any) => (
	<ol className="list-decimal list-outside pl-4 mb-2 space-y-0.5 text-neutral-850 dark:text-neutral-200">
		{children}
	</ol>
);
const Li = ({ children }: any) => (
	<li className="leading-relaxed text-neutral-850 dark:text-neutral-200">{children}</li>
);

const markdownComponents: Components = {
	// Headings
	h1: H1,
	h2: H2,
	h3: H3,
	// Paragraph
	p: P,
	// Bold / Italic
	strong: Strong,
	em: Em,
	// Unordered list
	ul: Ul,
	// Ordered list
	ol: Ol,
	li: Li,
	// Inline code
	code: ({ children, className }) => {
		const isBlock = className?.startsWith("language-");
		const codeStr = String(children).replace(/\n$/, "");

		if (isBlock) {
			const lang = className?.replace("language-", "") || "";
			return (
				<div className="relative group">
					{lang && (
						<div className="absolute right-3 top-3 text-[9px] font-mono text-neutral-450 dark:text-neutral-600 uppercase select-none group-hover:text-neutral-600 dark:group-hover:text-neutral-350 transition-colors">
							{lang}
						</div>
					)}
					<code className="block w-full overflow-x-auto p-4 text-xs font-mono text-neutral-800 dark:text-neutral-100 leading-relaxed whitespace-pre bg-transparent">
						{highlightCode(codeStr)}
					</code>
				</div>
			);
		}
		return (
			<code className="rounded-md bg-[#FAF2E8] dark:bg-neutral-800 px-1.5 py-0.5 text-[11px] font-mono text-[#9E5700] dark:text-amber-400 border border-[#EADCC9] dark:border-neutral-700 font-semibold shadow-[0_1px_2px_rgba(158,87,0,0.03)] transition-all">
				{children}
			</code>
		);
	},
	// Code block wrapper
	pre: ({ children }) => (
		<pre className="mb-3 last:mb-0 rounded-xl bg-[#FAF9F5] dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden animate-in fade-in duration-200">
			{children}
		</pre>
	),
	// Blockquote
	blockquote: ({ children }) => (
		<blockquote className="border-l-2 border-primary/50 pl-3 my-2 text-muted-foreground italic">
			{children}
		</blockquote>
	),
	// Horizontal rule
	hr: () => <hr className="border-border my-3" />,
	// Links
	a: ({ href, children }) => (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
		>
			{children}
		</a>
	),
	// Table
	table: ({ children }) => (
		<div className="overflow-x-auto mb-2">
			<table className="w-full text-xs border-collapse border border-border rounded-md">{children}</table>
		</div>
	),
	th: ({ children }) => (
		<th className="border border-border bg-muted/50 px-2 py-1 text-left font-semibold">{children}</th>
	),
	td: ({ children }) => <td className="border border-border px-2 py-1">{children}</td>,
};

const MarkdownContent = ({ content }: Readonly<{ content: string }>) => (
	<ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
		{content}
	</ReactMarkdown>
);

// ─── Streaming typewriter (DOM-direct, zero React re-renders per frame) ──────

const CHARS_PER_FRAME = 8; // ~500 chars/sec at 60 fps

function StreamingMessage({ text, onDone }: Readonly<{ text: string; onDone: () => void }>) {
	const [done, setDone] = useState(false);
	const containerRef = useRef<HTMLSpanElement>(null);
	const rafRef = useRef<number>(0);

	useEffect(() => {
		let displayed = 0;
		const tick = () => {
			displayed = Math.min(displayed + CHARS_PER_FRAME, text.length);
			if (containerRef.current) {
				containerRef.current.textContent = text.slice(0, displayed);
			}
			if (displayed < text.length) {
				rafRef.current = requestAnimationFrame(tick);
			} else {
				setDone(true);
				onDone();
			}
		};
		rafRef.current = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(rafRef.current);
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	if (done) return <MarkdownContent content={text} />;

	return (
		<div className="whitespace-pre-wrap leading-relaxed">
			<span ref={containerRef} />
			<span className="inline-block w-[2px] h-[0.9em] bg-primary/70 ml-0.5 align-middle animate-[blink_0.8s_step-end_infinite] rounded-sm" />
		</div>
	);
}

// ─── Types ───────────────────────────────────────────────────────────────────

type MessageRole = "user" | "ai" | "system" | "error";

interface Message {
	id: string;
	role: MessageRole;
	userId?: number;
	userName?: string;
	/** Rendered text including @[id:title] tokens */
	text: string;
	timestamp: Date;
	/** Title of document used for AI context (only for ai messages) */
	contextDocumentTitle?: string | null;
	provider?: "gemini" | "openai";
}

interface ContextualChatProps {
	materials: WorkspaceMaterial[];
}

// ─── Component ───────────────────────────────────────────────────────────────

const getSenderName = (msg: Message, isMe: boolean, isAI: boolean, isError: boolean) => {
	if (isMe) return "You";
	if (isAI) return msg.provider === "openai" ? "GPT-5.4 mini" : "Gemini 3.5 Flash";
	if (isError) return "Error";
	return msg.userName;
};

const getBubbleClass = (isMe: boolean, isAI: boolean, isError: boolean) => {
	const base = "px-3 py-2 rounded-lg text-sm max-w-[90%] ";
	if (isMe)
		return (
			base +
			"bg-accent text-accent-foreground border border-border shadow-sm rounded-tr-none leading-relaxed whitespace-pre-wrap"
		);
	if (isAI)
		return (
			base +
			"bg-primary/5 dark:bg-primary/10 text-neutral-900 dark:text-neutral-50 border border-primary/20 rounded-tl-none shadow-xs"
		);
	if (isError)
		return base + "bg-destructive/10 text-destructive border border-destructive/20 rounded-tl-none leading-relaxed";
	return base + "bg-muted text-muted-foreground border border-transparent text-xs italic leading-relaxed";
};

const ChatMessageItem = ({
	msg,
	streamingId,
	setStreamingId,
	renderMessageText,
}: Readonly<{
	msg: Message;
	streamingId: string | null;
	setStreamingId: (id: string | null) => void;
	renderMessageText: (text: string) => React.ReactNode[];
}>) => {
	const isMe = msg.role === "user";
	const isAI = msg.role === "ai";
	const isSystem = msg.role === "system";
	const isError = msg.role === "error";

	const senderName = getSenderName(msg, isMe, isAI, isError);
	const bubbleClass = getBubbleClass(isMe, isAI, isError);

	let content;
	if (!isAI) {
		content = renderMessageText(msg.text);
	} else if (streamingId === msg.id) {
		content = <StreamingMessage text={msg.text} onDone={() => setStreamingId(null)} />;
	} else {
		content = <MarkdownContent content={msg.text} />;
	}

	return (
		<div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
			{!isSystem && (
				<div className="flex items-center gap-1.5 mb-1 px-1">
					{isAI && <Sparkles className="h-3 w-3 text-primary" />}
					{isError && <AlertCircle className="h-3 w-3 text-destructive" />}
					<span className="text-xs font-medium">{senderName}</span>
					<span className="text-[10px] text-muted-foreground">{format(msg.timestamp, "HH:mm")}</span>
				</div>
			)}

			<div className={bubbleClass}>{content}</div>

			{isAI && msg.contextDocumentTitle && (
				<p className="text-[10px] text-muted-foreground mt-1 px-1 flex items-center gap-1">
					<FileText className="h-3 w-3" />
					Context: <span className="font-medium">{msg.contextDocumentTitle}</span>
				</p>
			)}
		</div>
	);
};

export function ContextualChat({ materials }: Readonly<ContextualChatProps>) {
	const { user } = useAuth();
	const [provider, setProvider] = useState<"gemini" | "openai">("gemini");
	const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);

	/**
	 * Stable session UUID — generated once per component mount.
	 * Sent with every query so the backend can correlate turns into one Conversation.
	 */
	const [conversationId] = useState<string>(() => {
		const id = crypto.randomUUID();
		console.log("[CHAT] New conversation session started — conversationId:", id);
		return id;
	});

	const [messages, setMessages] = useState<Message[]>([
		{
			id: "welcome",
			role: "system",
			text: "Welcome! Ask me anything about your study materials. Tag a file with @ to give me context from a specific document.",
			timestamp: new Date(),
		},
	]);
	const [tagQuery, setTagQuery] = useState<string | null>(null);
	const [selectedTagIndex, setSelectedTagIndex] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	/** ID of the AI message currently being typed out */
	const [streamingId, setStreamingId] = useState<string | null>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLDivElement>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	/** true while the user has scrolled away from the bottom */
	const userScrolledRef = useRef(false);

	// ── Resize handle ────────────────────────────────────────────────────────

	// ── Scroll: respect user position, auto-scroll only when at bottom ────────

	const handleScroll = () => {
		const el = scrollContainerRef.current;
		if (!el) return;
		// consider "at bottom" if within 80px of the scroll bottom
		userScrolledRef.current = el.scrollHeight - el.scrollTop - el.clientHeight > 80;
	};

	useEffect(() => {
		if (!userScrolledRef.current) {
			messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages]);

	// ── Reset selection on new tag query ─────────────────────────────────────

	useEffect(() => {
		setSelectedTagIndex(0);
	}, [tagQuery]);

	// ── @ mention input handling ──────────────────────────────────────────────

	const handleInput = () => {
		if (!inputRef.current) return;

		// Force complete empty state if text is cleared to allow :empty selector to fire
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

		// Collect IDs of materials already tagged in the input area
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

		// Guard against duplicate tags
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
				// store the fileUrl so we can pass it directly to the backend
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

	// ── Serialize DOM → question string + tagged material ────────────────────

	const parseInput = (): { question: string; documentUrl?: string; documentTitle?: string } => {
		if (!inputRef.current) return { question: "" };

		let question = "";
		let documentUrl: string | undefined;
		let documentTitle: string | undefined;

		for (const node of Array.from(inputRef.current.childNodes)) {
			if (node.nodeType === Node.TEXT_NODE) {
				question += node.textContent;
			} else if (node.nodeType === Node.ELEMENT_NODE) {
				const el = node as HTMLElement;
				if (el.dataset.materialId) {
					question += `@[${el.dataset.materialId}:${el.dataset.materialTitle}]`;
					// Use the first tagged material as document context
					if (!documentUrl && el.dataset.materialUrl) {
						documentUrl = el.dataset.materialUrl;
						documentTitle = el.dataset.materialTitle;
					}
				} else {
					question += el.textContent ?? "";
				}
			}
		}

		return { question: question.trim(), documentUrl, documentTitle };
	};

	// ── Send message → call Gemini ────────────────────────────────────────────

	const handleSendMessage = async () => {
		if (!inputRef.current || !user || isLoading) return;

		const { question, documentUrl, documentTitle } = parseInput();
		if (!question) return;

		// Optimistically add user message
		const userMsg: Message = {
			id: Date.now().toString(),
			role: "user",
			userId: user.id,
			userName: user.fullName,
			text: question,
			timestamp: new Date(),
		};
		setMessages((prev) => [...prev, userMsg]);
		inputRef.current.innerHTML = "";
		setTagQuery(null);
		setIsLoading(true);

		// ── Debug log: outgoing request ──────────────────────────────────────
		console.log("[CHAT] Sending query", {
			conversationId,
			questionLength: question.length,
			hasDocument: !!documentUrl,
			documentTitle: documentTitle ?? null,
			provider,
		});

		try {
			const requestPayload = { conversationId, question, documentUrl, documentTitle, provider };
			const res = await chatApi.query(requestPayload);

			// ── Debug log: incoming response ─────────────────────────────────
			console.log("[CHAT] Response received", {
				conversationId,
				answerLength: res.answer?.length ?? 0,
				contextDocumentTitle: res.contextDocumentTitle ?? null,
			});

			const aiMsg: Message = {
				id: (Date.now() + 1).toString(),
				role: "ai",
				text: res.answer,
				timestamp: new Date(),
				contextDocumentTitle: res.contextDocumentTitle,
				provider: provider,
			};
			setStreamingId(aiMsg.id);
			setMessages((prev) => [...prev, aiMsg]);
			// user just got a new reply — snap back to bottom
			userScrolledRef.current = false;
		} catch (err: any) {
			console.error("[CHAT] Query failed", { conversationId, error: err?.message });
			const errMsg: Message = {
				id: (Date.now() + 1).toString(),
				role: "error",
				text: err?.message ?? "The AI assistant is currently unavailable. Please try again.",
				timestamp: new Date(),
			};
			setMessages((prev) => [...prev, errMsg]);
		} finally {
			setIsLoading(false);
		}
	};

	// ── Render @[id:title] tokens inside message text ─────────────────────────

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
							const url = `${API_BASE_URL}/files/download?materialId=${material.id}&type=WORKSPACE&token=${localStorage.getItem("token") || ""}`;
							window.open(url, "_blank");
						}
					}}
				>
					{material ? <MaterialIcon type={material.fileType} /> : <Link2 className="h-3 w-3" />}{" "}
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

	// ── Render ────────────────────────────────────────────────────────────────

	return (
		<div className="flex flex-col h-full bg-card relative">
			{/* Header */}
			<div className="p-4 border-b border-border flex items-center justify-between shrink-0">
				<div>
					<h3 className="font-semibold text-sm flex items-center gap-1.5">
						<Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
						AI Study Assistant
					</h3>
					<p className="text-xs text-muted-foreground">Ask questions · Tag @ files for context</p>
				</div>
			</div>

			{/* Messages */}
			<div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4">
				<div className="space-y-4">
					{messages.map((msg) => (
						<ChatMessageItem
							key={msg.id}
							msg={msg}
							streamingId={streamingId}
							setStreamingId={setStreamingId}
							renderMessageText={renderMessageText}
						/>
					))}

					{/* Loading indicator */}
					{isLoading && (
						<div className="flex flex-col items-start">
							<div className="flex items-center gap-1.5 mb-1 px-1">
								<Sparkles className="h-3 w-3 text-primary animate-pulse" />
								<span className="text-xs font-medium">
									{provider === "openai" ? "GPT-5.4 mini" : "Gemini 3.5 Flash"}
								</span>
							</div>
							<div className="px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 rounded-tl-none flex items-center gap-2 text-sm text-muted-foreground">
								<Loader2 className="h-3.5 w-3.5 animate-spin" />
								Thinking…
							</div>
						</div>
					)}

					<div ref={messagesEndRef} />
				</div>
			</div>

			{/* Input area */}
			<div className="p-3 border-t border-border bg-background relative shrink-0">
				{/* @ mention dropdown */}
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
					{/* Text Input area */}
					<div
						tabIndex={0}
						aria-label="Ask a question"
						aria-multiline="true"
						ref={inputRef}
						contentEditable={!isLoading}
						onInput={handleInput}
						onKeyDown={handleKeyDown}
						data-placeholder="Ask a question… Use @ to attach a file"
						className="w-full min-h-[44px] max-h-[120px] overflow-y-auto bg-transparent px-3 py-2 text-sm focus-visible:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground cursor-text aria-disabled:opacity-50"
					/>

					{/* Footer bar containing model dropdown and send button */}
					<div className="flex items-center justify-between border-t border-border/40 pt-2 pb-1 px-2 mt-1 shrink-0">
						{/* Custom Model Selector Dropdown */}
						<div className="relative">
							<button
								type="button"
								onClick={() => setIsModelMenuOpen((p) => !p)}
								disabled={isLoading}
								className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-muted text-[11px] font-medium text-muted-foreground hover:text-foreground transition-all duration-200 border border-border/60 bg-muted/30 hover:border-border shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
							>
								<Sparkles className="h-3 w-3 text-primary animate-pulse" />
								<span>{provider === "openai" ? "GPT-5.4 mini" : "Gemini 3.5 Flash"}</span>
								<ChevronDown className="h-3 w-3 opacity-60 transition-opacity duration-200" />
							</button>

							{/* Dropdown Menu Overlay & Body */}
							{isModelMenuOpen && (
								<>
									{/* Overlay to handle click-away */}
									<button
										type="button"
										aria-label="Close model menu overlay"
										className="fixed inset-0 z-20 cursor-default w-full h-full bg-transparent border-none p-0 m-0"
										onClick={() => setIsModelMenuOpen(false)}
									/>

									<div className="absolute bottom-full left-0 mb-1.5 w-48 bg-popover border border-border rounded-lg shadow-md p-1 z-30 animate-in fade-in slide-in-from-bottom-2 duration-150">
										<button
											onClick={() => {
												setProvider("gemini");
												setIsModelMenuOpen(false);
											}}
											className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-left transition-colors ${
												provider === "gemini"
													? "bg-primary/10 text-primary"
													: "hover:bg-muted text-muted-foreground hover:text-foreground"
											}`}
										>
											<div className="flex flex-col items-start gap-0.5">
												<span className="text-xs font-semibold flex items-center gap-1">
													<Sparkles className="h-3 w-3" />
													Gemini 3.5 Flash
												</span>
												<span className="text-[10px] opacity-75">Default model</span>
											</div>
											{provider === "gemini" && <Check className="h-3.5 w-3.5 shrink-0" />}
										</button>

										<button
											onClick={() => {
												setProvider("openai");
												setIsModelMenuOpen(false);
											}}
											className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-left transition-colors ${
												provider === "openai"
													? "bg-primary/10 text-primary"
													: "hover:bg-muted text-muted-foreground hover:text-foreground"
											}`}
										>
											<div className="flex flex-col items-start gap-0.5">
												<span className="text-xs font-semibold flex items-center gap-1">
													<Sparkles className="h-3 w-3 text-emerald-500" />
													GPT-5.4 mini
												</span>
												<span className="text-[10px] opacity-75">Swappable OpenAI</span>
											</div>
											{provider === "openai" && (
												<Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
											)}
										</button>
									</div>
								</>
							)}
						</div>

						{/* Send Button */}
						<Button
							size="sm"
							onClick={handleSendMessage}
							disabled={isLoading}
							className="h-7 gap-1.5 shadow-md rounded-lg px-3 font-medium text-xs transition-all hover:shadow-lg active:scale-95"
						>
							{isLoading ? (
								<>
									<Loader2 className="h-3.5 w-3.5 animate-spin" />
									<span>Thinking...</span>
								</>
							) : (
								<>
									<span>Send</span>
									<Send className="h-3.5 w-3.5" />
								</>
							)}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
