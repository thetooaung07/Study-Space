"use client";

import { BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/common/sidebar";
import { Header } from "@/components/common/header";
import { CourseForm } from "@/components/courses/course-form";
import { useAuth } from "@/context/auth-context";

export default function NewCoursePage() {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              Create New Course
            </h1>
            {user ? (
              <CourseForm instructorId={user.id} />
            ) : (
              <p className="text-sm text-muted-foreground">Loading user…</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
