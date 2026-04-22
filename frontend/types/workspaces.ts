// ─── Workspace Types ──────────────────────────────────────────────────────────

import type { MaterialType } from "./courses";

export type ProposalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface WorkspaceMaterial {
  id: number;
  title: string;
  fileUrl: string;
  fileType: MaterialType;
  originalFileName: string;
  isReference: boolean;
  isHidden: boolean;
  uploadedAt: string;
}

export interface WorkspaceSection {
  id: number;
  title: string;
  description?: string;
  orderIndex: number;
  createdAt: string;
  materials: WorkspaceMaterial[];
}

export interface WorkspaceSpace {
  id: number;
  title: string;
  description?: string;
  workspaceId: number;
  forkedFromCourseId?: number;
  forkedFromCourseTitle?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  sections: WorkspaceSection[];
}

export interface StudentWorkspace {
  id: number;
  name: string;
  description?: string;
  ownerId: number;
  ownerName: string;
  spaceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContributionProposal {
  id: number;
  status: ProposalStatus;
  message?: string;
  reviewMessage?: string;
  studentId: number;
  studentName: string;
  targetCourseId: number;
  targetCourseTitle: string;
  targetSectionId?: number;
  targetSectionTitle?: string;
  proposedSectionTitle?: string;
  sourceMaterialId?: number;
  sourceMaterialTitle?: string;
  sourceMaterialUrl?: string;
  sourceMaterialType?: "PDF" | "SLIDES" | "VIDEO" | "IMAGE" | "OTHER";
  contributorDisplayName: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
}

export interface CreateSpaceRequest {
  title: string;
  description?: string;
}

export interface CreateWorkspaceSectionRequest {
  title: string;
  description?: string;
  orderIndex?: number;
}

export interface SubmitProposalRequest {
  message?: string;
  targetCourseId: number;
  /** ID of an existing course section. Mutually exclusive with proposedSectionTitle. */
  targetSectionId?: number;
  /** Title for a new section to be added to the course. Mutually exclusive with targetSectionId. */
  proposedSectionTitle?: string;
  sourceMaterialIds: number[];
}

export interface ReviewProposalRequest {
  status: "APPROVED" | "REJECTED";
  reviewMessage?: string;
}
