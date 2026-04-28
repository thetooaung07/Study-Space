import { api } from "./api";
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

const BASE_URL = "http://localhost:8080/api";

// ─── Workspace endpoints ────────────────────────────────────────────────────

export const workspacesApi = {
	/** Get my workspaces */
	getMyWorkspaces: (userId: number): Promise<StudentWorkspace[]> => api.get(`/workspaces/my?userId=${userId}`),

	/** Get public workspaces (paginated) */
	getPublicWorkspaces: (
		page: number = 0,
		size: number = 10,
	): Promise<{ content: StudentWorkspace[]; totalPages: number; number: number }> =>
		api.get(`/workspaces/public?page=${page}&size=${size}`),

	/** Get workspace detail */
	getById: (id: number): Promise<StudentWorkspace> => api.get(`/workspaces/${id}`),

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

	getSpaces: (workspaceId: number): Promise<WorkspaceSpace[]> => api.get(`/workspaces/${workspaceId}/spaces`),

	createSpace: (workspaceId: number, userId: number, data: CreateSpaceRequest): Promise<WorkspaceSpace> =>
		api.post(`/workspaces/${workspaceId}/spaces?userId=${userId}`, data),

	forkCourse: async (
		workspaceId: number,
		userId: number,
		courseId: number,
		title?: string,
	): Promise<WorkspaceSpace> => {
		const token = localStorage.getItem("token");
		const url = new URL(`${BASE_URL}/workspaces/${workspaceId}/spaces/fork`);
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

	getSpace: (spaceId: number): Promise<WorkspaceSpace> => api.get(`/workspaces/spaces/${spaceId}`),

	updateSpace: (spaceId: number, userId: number, data: CreateSpaceRequest): Promise<WorkspaceSpace> =>
		api.put(`/workspaces/spaces/${spaceId}?userId=${userId}`, data),

	deleteSpace: (spaceId: number, userId: number): Promise<void> =>
		api.delete(`/workspaces/spaces/${spaceId}?userId=${userId}`),

	joinSpace: (userId: number, inviteCode: string): Promise<WorkspaceSpace> =>
		api.post(`/spaces/join?userId=${userId}`, { inviteCode }),

	getSpaceMembers: (spaceId: number, userId: number): Promise<any[]> =>
		api.get(`/spaces/${spaceId}/members?userId=${userId}`),

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
		const res = await fetch(`${BASE_URL}/workspaces/sections/${sectionId}/materials?userId=${userId}`, {
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
		const res = await fetch(`${BASE_URL}/contributions/${proposalId}/review?userId=${userId}`, {
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

// ─── AI Chat endpoints ───────────────────────────────────────────────────────

export interface ChatQueryRequest {
	question: string;
	/** fileUrl from WorkspaceMaterial – local path today, S3/GCS URL later */
	documentUrl?: string;
	documentTitle?: string;
}

export interface ChatQueryResponse {
	answer: string;
	contextDocumentTitle: string | null;
}

export const chatApi = {
	/**
	 * Ask Gemini a question with optional PDF document context.
	 * Passes the material's fileUrl directly – no re-upload required.
	 */
	query: (data: ChatQueryRequest): Promise<ChatQueryResponse> =>
		api.post("/chat/query", data),
};

