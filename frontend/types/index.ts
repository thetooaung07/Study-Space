// Backend Enums
export type ActivityType =
	| "SESSION_CREATED"
	| "SESSION_STARTED"
	| "SESSION_ENDED"
	| "JOINED"
	| "LEFT"
	| "MILESTONE_REACHED"
	| "MESSAGE"
	| "HAND_RAISE"
	| "COFFEE_BREAK"
	| "QUESTION"
	| "SESSION_JOIN"
	| "SESSION_LEAVE"
	| "ACHIEVEMENT_UNLOCK"
	| "STUDY_MILESTONE";
export enum UserRole {
	STUDENT = "STUDENT",
	INSTRUCTOR = "INSTRUCTOR"
}

export type SessionStatus = "SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
export type Subject = "MATH" | "SCIENCE" | "HISTORY" | "LITERATURE" | "PROGRAMMING" | "ART" | "MUSIC" | "OTHER";
export type UserStatus = "ONLINE" | "OFFLINE" | "STUDYING" | "AWAY";

// DTOs
export interface ActivityDTO {
	id: number;
	type: ActivityType;
	message: string;
	timestamp: string; // ISO 8601
	sessionId?: number;
	userId?: number;
	userName?: string;
	userProfilePictureUrl?: string;
}

export interface StudySessionDTO {
	id: number;
	title: string;
	description: string;
	subject: Subject;
	startTime: string; // ISO 8601
	endTime?: string;
	durationMinutes?: number;
	roomCode: string;
	status: SessionStatus;
	visibility: "PUBLIC" | "PRIVATE";
	createdAt: string;
	creatorId: number;
	creator?: UserDTO;
	participantCount: number;
	participants?: UserDTO[];
	duration: string;
}

export interface UserDTO {
	id: number;
	username: string;
	email: string;
	fullName: string;
	profilePictureUrl?: string;
	totalStudyMinutes: number;
	currentStreak?: number;
	currentStatus: UserStatus;
	role: UserRole;
	createdAt: string;
	updatedAt: string;
	authProvider: "LOCAL" | "GOOGLE" | "GITHUB";
	joinedAt?: string; // Session context
	lastPausedAt?: string;
	totalPausedSeconds?: number;
	leftAt?: string;
}

export interface CreateSessionRequest {
	title: string;
	description?: string;
	subject: Subject;
	startTime?: string;
	visibility?: "PUBLIC" | "PRIVATE";
}

// ─── Workspace Types ──────────────────────────────────────────────────────────

export interface WorkspaceMaterialDTO {
	id: number;
	title: string;
	fileUrl: string;
	fileType: string;
	originalFileName?: string;
	isReference: boolean;
	isHidden: boolean;
	uploadedAt: string;
	createdBy?: number; // userId of uploader
}

export interface WorkspaceSectionDTO {
	id: number;
	title: string;
	description?: string;
	orderIndex: number;
	createdAt: string;
	createdBy?: number;
	materials: WorkspaceMaterialDTO[];
}

export interface WorkspaceSpaceDTO {
	id: number;
	title: string;
	description?: string;
	workspaceId: number;
	forkedFromCourseId?: number;
	forkedFromCourseTitle?: string;
	isPublished: boolean;
	createdAt: string;
	updatedAt: string;
	sections: WorkspaceSectionDTO[];
	// Sharing
	sharingEnabled?: boolean;
	inviteCode?: string;   // only present when viewer is the owner
	guestCount?: number;
	isGuest?: boolean;
	members?: any[];
}

export interface StudentWorkspaceDTO {
	id: number;
	name: string;
	description?: string;
	ownerId: number;
	ownerName?: string;
	spaceCount: number;
	createdAt: string;
	updatedAt: string;
}

export interface ShareSettingsDTO {
	sharingEnabled: boolean;
	inviteCode: string | null;
	guestCount: number;
}
