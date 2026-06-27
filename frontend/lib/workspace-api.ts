import { api, API_BASE_URL, DEFAULT_PAGE_SIZE } from "./api";
import type {
	StudentWorkspace,
	WorkspaceSpace,
	WorkspaceSection,
	WorkspaceMaterial,
	ContributionProposal,
	CreateWorkspaceRequest,
	CreateSpaceRequest,
	CreateWorkspaceSectionRequest,
	SubmitProposalRequest,
	ReviewProposalRequest,
} from "@/types/workspaces";

import { PaginatedResponse } from "@/types/pagination";

// ─── Workspace endpoints ────────────────────────────────────────────────────

export const workspacesApi = {
	/** Get my workspaces */
	getMyWorkspaces: (
		userId: number,
		page: number = 0,
		size: number = DEFAULT_PAGE_SIZE,
		search?: string,
	): Promise<PaginatedResponse<StudentWorkspace>> =>
		api.get(
			`/workspaces/my?userId=${userId}&page=${page}&size=${size}${search ? `&search=${encodeURIComponent(search)}` : ""}`,
		),

	/** Get public workspaces (paginated) */
	getPublicWorkspaces: (
		page: number = 0,
		size: number = DEFAULT_PAGE_SIZE,
	): Promise<PaginatedResponse<StudentWorkspace>> => api.get(`/workspaces/public?page=${page}&size=${size}`),

	/** Get workspace detail */
	getById: (id: number, userId: number): Promise<StudentWorkspace> => api.get(`/workspaces/${id}?userId=${userId}`),

	/** Create a workspace */
	create: (userId: number, data: CreateWorkspaceRequest): Promise<StudentWorkspace> =>
		api.post(`/workspaces?userId=${userId}`, data),

	/** Update workspace */
	update: (id: number, userId: number, data: CreateWorkspaceRequest): Promise<StudentWorkspace> =>
		api.put(`/workspaces/${id}?userId=${userId}`, data),

	/** Delete workspace */
	delete: (id: number, userId: number): Promise<void> => api.delete(`/workspaces/${id}?userId=${userId}`),

	/** Join workspace via invite code */
	joinWorkspace: (userId: number, inviteCode: string): Promise<StudentWorkspace> =>
		api.post(`/workspaces/join?userId=${userId}&inviteCode=${inviteCode}`, {}),

	// ─── Spaces ──────────────────────────────────────────────────────────────

	getSpaces: (
		workspaceId: number,
		userId: number,
		page: number = 0,
		size: number = DEFAULT_PAGE_SIZE,
		search?: string,
	): Promise<PaginatedResponse<WorkspaceSpace>> =>
		api.get(
			`/workspaces/${workspaceId}/spaces?userId=${userId}&page=${page}&size=${size}${search ? `&search=${encodeURIComponent(search)}` : ""}`,
		),

	createSpace: (workspaceId: number, userId: number, data: CreateSpaceRequest): Promise<WorkspaceSpace> =>
		api.post(`/workspaces/${workspaceId}/spaces?userId=${userId}`, data),

	forkCourse: async (
		workspaceId: number,
		userId: number,
		courseId: number,
		title?: string,
	): Promise<WorkspaceSpace> => {
		const token = localStorage.getItem("token");
		const url = new URL(`${API_BASE_URL}/workspaces/${workspaceId}/spaces/fork`);
		url.searchParams.append("userId", userId.toString());
		url.searchParams.append("courseId", courseId.toString());
		if (title) url.searchParams.append("title", title);

		const res = await fetch(url.toString(), {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
		});
		if (!res.ok) throw new Error(await res.text());
		return res.json();
	},

	getSpace: (spaceId: number, userId: number): Promise<WorkspaceSpace> =>
		api.get(`/workspaces/spaces/${spaceId}?userId=${userId}`),

	updateSpace: (spaceId: number, userId: number, data: CreateSpaceRequest): Promise<WorkspaceSpace> =>
		api.put(`/workspaces/spaces/${spaceId}?userId=${userId}`, data),

	deleteSpace: (spaceId: number, userId: number): Promise<void> =>
		api.delete(`/workspaces/spaces/${spaceId}?userId=${userId}`),

	joinSpace: (userId: number, inviteCode: string): Promise<WorkspaceSpace> =>
		api.post(`/workspaces/spaces/join?userId=${userId}&code=${encodeURIComponent(inviteCode)}`, {}),

	removeGuest: (spaceId: number, guestUserId: number, userId: number): Promise<void> =>
		api.delete(`/workspaces/spaces/${spaceId}/guests/${guestUserId}?userId=${userId}`),

	getSharedSpaces: (
		userId: number,
		page: number = 0,
		size: number = DEFAULT_PAGE_SIZE,
	): Promise<PaginatedResponse<WorkspaceSpace>> =>
		api.get(`/workspaces/shared?userId=${userId}&page=${page}&size=${size}`),

	leaveSpace: (spaceId: number, userId: number): Promise<void> =>
		api.delete(`/workspaces/spaces/${spaceId}/leave?userId=${userId}`),

	getSpaceMembers: (spaceId: number, userId: number): Promise<any[]> =>
		api.get(`/workspaces/spaces/${spaceId}/members?userId=${userId}`),

	// ─── Sections ────────────────────────────────────────────────────────────

	addSection: (spaceId: number, userId: number, data: CreateWorkspaceSectionRequest): Promise<WorkspaceSection> =>
		api.post(`/workspaces/spaces/${spaceId}/sections?userId=${userId}`, data),

	updateSection: (
		sectionId: number,
		userId: number,
		data: CreateWorkspaceSectionRequest,
	): Promise<WorkspaceSection> => api.put(`/workspaces/sections/${sectionId}?userId=${userId}`, data),

	deleteSection: (sectionId: number, userId: number): Promise<void> =>
		api.delete(`/workspaces/sections/${sectionId}?userId=${userId}`),

	// ─── Materials ───────────────────────────────────────────────────────────

	uploadMaterial: async (
		sectionId: number,
		userId: number,
		title: string,
		file: File,
	): Promise<WorkspaceMaterial> => {
		const token = localStorage.getItem("token");
		const formData = new FormData();
		formData.append("file", file);
		formData.append("title", title);
		const res = await fetch(`${API_BASE_URL}/workspaces/sections/${sectionId}/materials?userId=${userId}`, {
			method: "POST",
			headers: token ? { Authorization: `Bearer ${token}` } : {},
			body: formData,
		});
		if (!res.ok) throw new Error(await res.text());
		return res.json();
	},

	deleteMaterial: (materialId: number, userId: number): Promise<void> =>
		api.delete(`/workspaces/materials/${materialId}?userId=${userId}`),
};

// ─── Contribution endpoints ─────────────────────────────────────────────────

export const contributionsApi = {
	/** Submit contribution proposals (multi-select materials) */
	submit: (studentId: number, data: SubmitProposalRequest): Promise<ContributionProposal[]> =>
		api.post(`/contributions?studentId=${studentId}`, data),

	/** Get student's own proposals */
	getMyProposals: (studentId: number): Promise<ContributionProposal[]> =>
		api.get(`/contributions/my?studentId=${studentId}`),

	/** Get proposals for a course (instructor) */
	getForCourse: (courseId: number, userId: number): Promise<ContributionProposal[]> =>
		api.get(`/contributions/course/${courseId}?userId=${userId}`),

	/** Review a proposal (instructor) */
	review: async (proposalId: number, userId: number, data: ReviewProposalRequest): Promise<ContributionProposal> => {
		const token = localStorage.getItem("token");
		const res = await fetch(`${API_BASE_URL}/contributions/${proposalId}/review?userId=${userId}`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: JSON.stringify(data),
		});
		if (!res.ok) throw new Error(await res.text());
		return res.json();
	},

	/** Get accepted contributions for a course */
	getAccepted: (courseId: number): Promise<ContributionProposal[]> =>
		api.get(`/contributions/course/${courseId}/accepted`),
};

// ─── AI Chat types & endpoints ─────────────────────────────────────────────

export interface ChatQueryRequest {
	/**
	 * Client-generated UUID that identifies this chat session.
	 * Must be stable across all turns in the same conversation.
	 * If omitted, the backend falls back to stateless mode (no memory).
	 */
	conversationId?: string;
	question: string;
	/** fileUrl from WorkspaceMaterial – local path today, S3/GCS URL later */
	documentUrl?: string;
	documentTitle?: string;
	provider?: "gemini" | "openai";
	/** ID of the authenticated user — required for lazy conversation creation. */
	userId?: number;
}

export interface ChatQueryResponse {
	answer: string;
	contextDocumentTitle: string | null;
	/**
	 * LLM-generated conversation title, non-null only on the very first turn
	 * of a new conversation. The frontend uses this to update the History popup.
	 */
	conversationTitle: string | null;
}

/** Lightweight summary entry shown in the History popup list. */
export interface ConversationSummary {
	id: string;
	title: string;
	createdAt: string;
	updatedAt: string;
}

/** A single persisted message turn returned when reloading a past conversation. */
export interface HistoryMessage {
	id: number;
	/** "user" | "assistant" */
	role: string;
	content: string;
	createdAt: string;
}

export const chatApi = {
	/**
	 * Ask the AI a question with optional PDF document context and conversation memory.
	 * Passes the material's fileUrl directly – no re-upload required.
	 * When conversationId is provided the backend maintains rolling memory across turns.
	 * On the very first turn of a new conversation, the response includes conversationTitle.
	 */
	query: (data: ChatQueryRequest): Promise<ChatQueryResponse> => api.post("/chat/query", data),

	/**
	 * Returns the user's conversation list ordered newest-first.
	 * Called on mount to populate the History popup.
	 */
	listConversations: (userId: number): Promise<ConversationSummary[]> =>
		api.get(`/chat/conversations?userId=${userId}`),

	/**
	 * Hard-deletes a conversation and all its messages.
	 * The frontend removes the entry from its local list immediately.
	 */
	deleteConversation: (id: string, userId: number): Promise<void> =>
		api.delete(`/chat/conversations/${id}?userId=${userId}`),

	/**
	 * Returns the full message history for a past conversation.
	 * Called when the user selects an entry from the History popup.
	 */
	getMessages: (id: string, userId: number): Promise<HistoryMessage[]> =>
		api.get(`/chat/conversations/${id}/messages?userId=${userId}`),
};
