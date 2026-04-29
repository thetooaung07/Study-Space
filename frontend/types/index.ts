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
    userName?: string;
    userProfilePictureUrl?: string;
}

export interface StudyGroupDTO {
    id: number;
    name: string;
    description: string;
    inviteCode: string;
    createdAt: string;
    updatedAt: string;
    creatorId: number;
    memberCount: number;
    groupType: 'PUBLIC' | 'PERSONAL' | 'INVITE_ONLY';
    activeMemberCount: number;
    totalSessionsCount: number;
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
    visibility: 'PUBLIC' | 'PRIVATE';
    createdAt: string;
    creatorId: number;
    creator?: UserDTO;
    studyGroupId?: number;
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
    createdAt: string;
    updatedAt: string;
    authProvider: 'LOCAL' | 'GOOGLE' | 'GITHUB';
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
    groupId?: number;
    visibility?: 'PUBLIC' | 'PRIVATE';
    isGroupSession?: boolean;
}

export interface CreateGroupRequest {
    name: string;
    description?: string;
    groupType: 'PUBLIC' | 'PERSONAL' | 'INVITE_ONLY';
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

export interface GroupMemberDTO {
    id: number;
    username: string;
    fullName: string;
    profilePictureUrl?: string;
    currentStatus: UserStatus;
    isAdmin: boolean;
    totalStudyMinutesInGroup?: number;
    joinedAt?: string;
}

export interface StudyGroupDetailsDTO {
    group: StudyGroupDTO;
    activeSessions: StudySessionDTO[];
    members: GroupMemberDTO[];
}

// DTO for complex JPQL query results (group member leaderboard)
export interface GroupMemberStatsDTO {
    userId: number;
    fullName: string;
    profilePictureUrl?: string;
    totalMinutes: number;
    sessionCount: number;
}

