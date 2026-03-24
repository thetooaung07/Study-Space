"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Sidebar } from "@/components/common/sidebar";
import { Header } from "@/components/common/header";
import { CourseForm } from "@/components/courses/course-form";
import { coursesApi } from "@/lib/courses-api";
import { useAuth } from "@/context/auth-context";
import type { Course } from "@/types/courses";

export default function EditCoursePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    coursesApi
      .getById(Number(id))
      .then(setCourse)
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-foreground mb-6">Edit Course</h1>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : course && user ? (
              <CourseForm course={course} instructorId={user.id} />
            ) : (
              <p className="text-sm text-destructive">Course not found or not authorized.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
