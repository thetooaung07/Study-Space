"use client";

import { useEffect, useState } from "react";
import { BookOpen, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sidebar } from "@/components/common/sidebar";
import { Header } from "@/components/common/header";
import { CourseCatalog } from "@/components/courses/course-catalog";
import { coursesApi } from "@/lib/courses-api";
import { DEFAULT_PAGE_SIZE } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { UserRole } from "@/types";
import type { CourseSummary } from "@/types/courses";
import { PaginationControls } from "@/components/common/pagination-controls";
import Link from "next/link";

export default function CoursesPage() {
	const { user } = useAuth();
	const [activeTab, setActiveTab] = useState<"all" | "my">("all");
	const [courses, setCourses] = useState<CourseSummary[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [page, setPage] = useState(0);
	const [totalPages, setTotalPages] = useState(0);
	const [searchQuery, setSearchQuery] = useState("");

	useEffect(() => {
		setLoading(true);
		setError(null);

		if (activeTab === "my") {
			if (!user) {
				setLoading(false);
				return;
			}
			if (user.role === UserRole.INSTRUCTOR) {
				coursesApi
					.getMyCourses(user.id, page, DEFAULT_PAGE_SIZE, searchQuery || undefined)
					.then((res) => {
						setCourses(res.content);
						setTotalPages(res.totalPages);
					})
					.catch((e) => setError(e.message))
					.finally(() => setLoading(false));
			} else {
				coursesApi
					.getMyEnrollments(user.id, page, DEFAULT_PAGE_SIZE, searchQuery || undefined)
					.then((res) => {
						setCourses(
							res.content
								.map((e) => ({
									id: e.courseId,
									title: e.courseTitle,
									description: e.courseDescription || "",
									instructorId: e.instructorId,
									instructorName: e.instructorName,
									isPublished: true,
									createdAt: e.enrolledAt,
									enrollmentCount: e.enrollmentCount,
									sectionCount: e.sectionCount,
								})),
						);
						setTotalPages(res.totalPages);
					})
					.catch((e) => setError(e.message))
					.finally(() => setLoading(false));
			}
		} else {
			coursesApi
				.getAll(page, DEFAULT_PAGE_SIZE, searchQuery || undefined)
				.then((res) => {
					setCourses(res.content);
					setTotalPages(res.totalPages);
				})
				.catch((e) => setError(e.message))
				.finally(() => setLoading(false));
		}
	}, [activeTab, user, page, searchQuery]);

	const handleTabChange = (val: "all" | "my") => {
		setActiveTab(val);
		setPage(0);
		setSearchQuery("");
	};

	const renderContent = () => {
		if (loading && !courses.length && activeTab === "all" && !searchQuery) {
			// Only show full page loader on initial very first load
			return (
				<div className="flex justify-center items-center py-12">
					<div className="text-sm text-muted-foreground animate-pulse flex items-center gap-2">
						<Loader2 className="h-4 w-4 animate-spin" />
						Loading courses…
					</div>
				</div>
			);
		}
		if (error) {
			return <div className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-md mt-4">{error}</div>;
		}
		return (
			<>
				<TabsContent value="all" className="m-0 mt-4">
					<CourseCatalog 
						courses={courses} 
						as="student" 
						searchQuery={searchQuery}
						onSearchChange={(q) => {
							setSearchQuery(q);
							setPage(0);
						}}
						isLoading={loading}
					/>
					<PaginationControls currentPage={page} totalPages={totalPages} onPageChange={setPage} />
				</TabsContent>
				<TabsContent value="my" className="m-0 mt-4">
					<CourseCatalog
						courses={courses}
						as={user?.role === UserRole.INSTRUCTOR ? "instructor" : "student"}
						searchQuery={searchQuery}
						onSearchChange={(q) => {
							setSearchQuery(q);
							setPage(0);
						}}
						isLoading={loading}
					/>
					<PaginationControls currentPage={page} totalPages={totalPages} onPageChange={setPage} />
				</TabsContent>
			</>
		);
	};

	return (
		<div className="flex h-screen bg-background">
			<Sidebar />
			<div className="flex flex-col flex-1 overflow-hidden">
				<Header />
				<main className="flex-1 overflow-auto">
					<div className="p-6 max-w-6xl mx-auto space-y-6">
						{/* Page header */}
						<div className="flex items-start justify-between">
							<div>
								<h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
									<BookOpen className="h-6 w-6 text-primary" />
									Course Catalog
								</h1>
								<p className="text-sm text-muted-foreground mt-1">
									{user?.role === UserRole.INSTRUCTOR
										? "Browse available courses or manage your own."
										: "Browse available courses."}
								</p>
							</div>
							{user?.role === UserRole.INSTRUCTOR && (
								<Button asChild size="sm">
									<Link href="/courses/new">
										<Plus className="mr-1.5 h-4 w-4" />
										Create Course
									</Link>
								</Button>
							)}
						</div>

						<Tabs value={activeTab} onValueChange={(val) => handleTabChange(val as "all" | "my")} className="w-full">
							<TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
								<TabsTrigger value="all">All Courses</TabsTrigger>
								<TabsTrigger value="my">
									{user?.role === UserRole.INSTRUCTOR
										? "My Courses (Instructor)"
										: "Enrolled Courses"}{" "}
								</TabsTrigger>
							</TabsList>

							{renderContent()}
						</Tabs>
					</div>
				</main>
			</div>
		</div>
	);
}
