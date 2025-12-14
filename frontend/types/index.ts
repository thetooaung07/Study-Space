// Backend Enums
export type ActivityType = 'SESSION_JOIN' | 'SESSION_LEAVE' | 'GROUP_JOIN' | 'ACHIEVEMENT_UNLOCK' | 'STUDY_MILESTONE';
export type SessionStatus = 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type Subject = 'MATH' | 'SCIENCE' | 'HISTORY' | 'LITERATURE' | 'PROGRAMMING' | 'ART' | 'MUSIC' | 'OTHER';
export type UserStatus = 'ONLINE' | 'OFFLINE' | 'STUDYING' | 'AWAY';

// DTOs
export interface ActivityDTO {
    id: number;
    type: ActivityType;
    message: string;
    timestamp: string; // ISO 8601
    sessionId?: number;
    userId?: number;
}

export interface StudyGroupDTO {
    id: number;
    name: string;
    description: string;
    inviteCode: string;
    isPrivate: boolean;
    createdAt: string;
    updatedAt: string;
    creatorId: number;
    memberCount: number;
}

export interface StudySessionDTO {
    id: number;
    title: string;
    description: string;
    subject: Subject;
    startTime: string; // ISO 8601
    endTime?: string;
    durationMinutes?: number;
    isGroupSession: boolean;
    roomCode: string;
    status: SessionStatus;
    createdAt: string;
    creatorId: number;
    studyGroupId?: number;
}

export interface UserDTO {
    id: number;
    username: string;
    email: string;
    fullName: string;
    profilePictureUrl?: string;
    totalStudyMinutes: number;
    currentStatus: UserStatus;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSessionRequest {
    title: string;
    description?: string;
    subject: Subject;
    startTime?: string;
    groupId?: number;
}

export interface CreateGroupRequest {
    name: string;
    description?: string;
    isPrivate?: boolean;
}

export interface GroupStatsDTO {
    groupId: number;
    groupName: string;
    sessionCount: number;
    totalStudyMinutes: number;
    averageSessionDuration: number;
    activeMemberCount: number;
}

export interface AnalyticsOverviewDTO {
    activeUsersNow: number;
    totalStudyMinutes: number;
    hotSessionsCount: number;
    newGroupsToday: number;
}
