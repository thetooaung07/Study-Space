"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Settings, Users, BookOpen, Eye, EyeOff, Trash2, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sidebar } from "@/components/common/sidebar";
import { Header } from "@/components/common/header";
import { SectionManager } from "@/components/courses/section-manager";
import { EnrollmentTable } from "@/components/courses/enrollment-table";
import { coursesApi } from "@/lib/courses-api";
import { useAuth } from "@/context/auth-context";
import type { Course, CourseEnrollment } from "@/types/courses";
import Link from "next/link";

export default function CourseManagePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      coursesApi.getById(Number(id)),
      coursesApi.getEnrollments(Number(id), user.id).catch(() => []),
    ])
      .then(([c, e]) => {
        setCourse(c);
        setEnrollments(e);
      })
      .finally(() => setLoading(false));
  }, [id, user]);

  const handleTogglePublish = async () => {
    if (!course || !user) return;
    setPublishing(true);
    try {
      const updated = await coursesApi.togglePublish(course.id, user.id);
      setCourse(updated);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!course || !user || !confirm("Permanently delete this course?")) return;
    try {
      await coursesApi.delete(course.id, user.id);
      router.push("/courses");
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </main>
      </div>
    </div>
  );

  if (!course || !user) return null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* Manage header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-foreground">{course.title}</h1>
                  <Badge variant={course.isPublished ? "default" : "secondary"} className="text-xs">
                    {course.isPublished ? "Published" : "Draft"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {course.enrollmentCount} active students · {course.sections.length} sections
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/courses/${course.id}`}>
                    <BookOpen className="mr-1.5 h-4 w-4" />
                    Preview
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/courses/${course.id}/edit`}>
                    <Pencil className="mr-1.5 h-4 w-4" />
                    Edit Details
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={handleTogglePublish} disabled={publishing}>
                  {publishing ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : course.isPublished ? (
                    <EyeOff className="mr-1.5 h-4 w-4" />
                  ) : (
                    <Eye className="mr-1.5 h-4 w-4" />
                  )}
                  {course.isPublished ? "Unpublish" : "Publish"}
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="content">
              <TabsList>
                <TabsTrigger value="content" className="gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  Content
                </TabsTrigger>
                <TabsTrigger value="students" className="gap-1.5">
                  <Users className="h-4 w-4" />
                  Students
                  {enrollments.filter((e) => e.status === "ACTIVE").length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {enrollments.filter((e) => e.status === "ACTIVE").length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="mt-4">
                <SectionManager
                  courseId={course.id}
                  userId={user.id}
                  initialSections={course.sections}
                  onSectionsChange={(sections) =>
                    setCourse((prev) => (prev ? { ...prev, sections } : prev))
                  }
                />
              </TabsContent>

              <TabsContent value="students" className="mt-4">
                <EnrollmentTable
                  courseId={course.id}
                  instructorId={user.id}
                  enrollments={enrollments}
                  onUpdated={(updated) =>
                    setEnrollments((prev) =>
                      prev.map((e) => (e.id === updated.id ? updated : e))
                    )
                  }
                />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
