"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Sidebar } from "@/components/common/sidebar";
import { Header } from "@/components/common/header";
import { CourseDetail } from "@/components/courses/course-detail";
import { coursesApi } from "@/lib/courses-api";
import { useAuth } from "@/context/auth-context";
import { UserRole } from "@/types";
import type { Course } from "@/types/courses";

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);

  const fetchCourseDetails = () => {
    coursesApi
      .getById(Number(id))
      .then(async (c) => {
        if (!c.isPublished && user?.role !== UserRole.INSTRUCTOR) {
          setError("This course is currently unavailable.");
          return;
        }
        setCourse(c);
        if (user) {
          const enrollments = await coursesApi.getMyEnrollments(user.id).catch(() => []);
          setIsEnrolled(enrollments.some((e) => e.courseId === c.id && e.status === "ACTIVE"));
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCourseDetails();
  }, [id, user]);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-4xl mx-auto">
            {loading ? (
              <div className="text-sm text-muted-foreground animate-pulse">Loading course…</div>
            ) : error ? (
              <div className="text-sm text-destructive">{error}</div>
            ) : course ? (
              <CourseDetail course={course} userId={user?.id} isEnrolled={isEnrolled} />
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
