"use client";

import { useState } from "react";
import { Search, BookOpen, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CourseCard } from "./course-card";
import type { CourseSummary } from "@/types/courses";

interface CourseCatalogProps {
	courses: CourseSummary[];
	as?: "student" | "instructor";
	searchQuery?: string;
	onSearchChange?: (query: string) => void;
	isLoading?: boolean;
}

export function CourseCatalog({
	courses,
	as = "student",
	searchQuery,
	onSearchChange,
	isLoading,
}: Readonly<CourseCatalogProps>) {
	const [localQuery, setLocalQuery] = useState("");
	const [inputValue, setInputValue] = useState(searchQuery !== undefined ? searchQuery : "");

	const query = searchQuery !== undefined ? searchQuery : localQuery;

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		if (onSearchChange) {
			onSearchChange(inputValue);
		} else {
			setLocalQuery(inputValue);
		}
	};

	const filtered = onSearchChange
		? courses
		: courses.filter(
				(c) =>
					c.title.toLowerCase().includes(query.toLowerCase()) ||
					c.instructorName?.toLowerCase().includes(query.toLowerCase()) ||
					c.description?.toLowerCase().includes(query.toLowerCase()),
			);

	return (
		<div className="space-y-6">
			{/* Search */}
			<form onSubmit={handleSearch} className="relative">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
				<Input
					placeholder="Search courses by title, instructor, or topic…"
					value={inputValue}
					onChange={(e) => setInputValue(e.target.value)}
					className="pl-9 bg-input"
				/>
			</form>

			{/* Grid */}
			{isLoading ? (
				<div className="flex justify-center items-center py-12">
					<div className="text-sm text-muted-foreground animate-pulse flex items-center gap-2">
						<Loader2 className="h-4 w-4 animate-spin" />
						Loading courses…
					</div>
				</div>
			) : filtered.length > 0 ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{filtered.map((course) => (
						<CourseCard key={course.id} course={course} as={as} />
					))}
				</div>
			) : (
				<div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
					<div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
						<BookOpen className="h-6 w-6 text-muted-foreground" />
					</div>
					<p className="text-sm text-muted-foreground">
						{query ? `No courses matching "${query}"` : "No courses available yet."}
					</p>
				</div>
			)}
		</div>
	);
}
