// ─── Courses Types ─────────────────────────────────────────────────────────────

export type MaterialType = "PDF" | "SLIDES" | "VIDEO" | "IMAGE" | "OTHER";
export type EnrollmentStatus = "PENDING" | "ACTIVE" | "DROPPED";

export interface CourseMaterial {
  id: number;
  title: string;
  fileUrl: string;
  fileType: MaterialType;
  originalFileName: string;
  uploadedAt: string;
}

export interface CourseSection {
  id: number;
  title: string;
  description?: string;
  orderIndex: number;
  createdAt: string;
  materials: CourseMaterial[];
}

export interface Course {
  id: number;
  title: string;
  description?: string;
  instructorId: number;
  instructorName: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  sections: CourseSection[];
  enrollmentCount: number;
}

export interface CourseSummary {
  id: number;
  title: string;
  description?: string;
  instructorId: number;
  instructorName: string;
  isPublished: boolean;
  createdAt: string;
  enrollmentCount: number;
  sectionCount: number;
}

export interface CourseEnrollment {
  id: number;
  courseId: number;
  courseTitle: string;
  studentId: number;
  studentName: string;
  studentEmail: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  enrollmentCount: number;
  sectionCount: number;
}

export interface CreateCourseRequest {
  title: string;
  description?: string;
  isPublished?: boolean;
}

export interface CreateSectionRequest {
  title: string;
  description?: string;
  orderIndex?: number;
}
