import { api } from "./api";
import type {
  Course,
  CourseSummary,
  CourseSection,
  CourseMaterial,
  CourseEnrollment,
  CreateCourseRequest,
  CreateSectionRequest,
  EnrollmentStatus,
} from "@/types/courses";

const BASE_URL = "http://localhost:8080/api";

// ─── Course endpoints ──────────────────────────────────────────────────────────

export const coursesApi = {
  /** Get all published courses (catalog) */
  getAll: (): Promise<CourseSummary[]> => api.get("/courses"),

  /** Get instructor's own courses */
  getMyCourses: (userId: number): Promise<CourseSummary[]> =>
    api.get(`/courses/my?userId=${userId}`),

  /** Get full course detail */
  getById: (id: number): Promise<Course> => api.get(`/courses/${id}`),

  /** Create a new course */
  create: (instructorId: number, data: CreateCourseRequest): Promise<Course> =>
    api.post(`/courses?instructorId=${instructorId}`, data),

  /** Update course */
  update: (id: number, userId: number, data: CreateCourseRequest): Promise<Course> =>
    api.put(`/courses/${id}?userId=${userId}`, data),

  /** Toggle publish/unpublish */
  togglePublish: async (id: number, userId: number): Promise<Course> => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${BASE_URL}/courses/${id}/publish?userId=${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  /** Delete a course */
  delete: (id: number, userId: number): Promise<void> =>
    api.delete(`/courses/${id}?userId=${userId}`),

  // ─── Sections ──────────────────────────────────────────────────────────────

  addSection: (courseId: number, userId: number, data: CreateSectionRequest): Promise<CourseSection> =>
    api.post(`/courses/${courseId}/sections?userId=${userId}`, data),

  updateSection: (sectionId: number, userId: number, data: CreateSectionRequest): Promise<CourseSection> =>
    api.put(`/courses/sections/${sectionId}?userId=${userId}`, data),

  deleteSection: (sectionId: number, userId: number): Promise<void> =>
    api.delete(`/courses/sections/${sectionId}?userId=${userId}`),

  // ─── Materials ─────────────────────────────────────────────────────────────

  uploadMaterial: async (
    sectionId: number,
    userId: number,
    title: string,
    file: File
  ): Promise<CourseMaterial> => {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    const res = await fetch(
      `${BASE_URL}/courses/sections/${sectionId}/materials?userId=${userId}`,
      {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      }
    );
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  deleteMaterial: (materialId: number, userId: number): Promise<void> =>
    api.delete(`/courses/materials/${materialId}?userId=${userId}`),

  // ─── Enrollments ───────────────────────────────────────────────────────────

  enroll: async (courseId: number, studentId: number): Promise<CourseEnrollment> => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${BASE_URL}/courses/${courseId}/enroll?studentId=${studentId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  unenroll: (courseId: number, studentId: number): Promise<void> =>
    api.delete(`/courses/${courseId}/enroll?studentId=${studentId}`),

  getEnrollments: (courseId: number, userId: number): Promise<CourseEnrollment[]> =>
    api.get(`/courses/${courseId}/enrollments?userId=${userId}`),

  getMyEnrollments: (studentId: number): Promise<CourseEnrollment[]> =>
    api.get(`/courses/my-enrollments?studentId=${studentId}`),

  updateEnrollmentStatus: async (
    enrollmentId: number,
    userId: number,
    status: EnrollmentStatus
  ): Promise<CourseEnrollment> => {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${BASE_URL}/courses/enrollments/${enrollmentId}?userId=${userId}&status=${status}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
