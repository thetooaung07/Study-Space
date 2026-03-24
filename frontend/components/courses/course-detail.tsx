"use client";

import Link from "next/link";
import { useState } from "react";
import {
	ChevronDown,
	ChevronRight,
	FileText,
	Film,
	Presentation,
	FileImage,
	File,
	ExternalLink,
	Users,
	GraduationCap,
	CheckCircle2,
	Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { coursesApi } from "@/lib/courses-api";
import type { Course, CourseSection, CourseMaterial, MaterialType } from "@/types/courses";

const MaterialIcon = ({ type }: { type: MaterialType }) => {
	const cls = "h-4 w-4 shrink-0";
	switch (type) {
		case "PDF":
			return <FileText className={cls + " text-red-500"} />;
		case "SLIDES":
			return <Presentation className={cls + " text-orange-500"} />;
		case "VIDEO":
			return <Film className={cls + " text-purple-500"} />;
		case "IMAGE":
			return <FileImage className={cls + " text-blue-500"} />;
		default:
			return <File className={cls + " text-muted-foreground"} />;
	}
};

interface CourseDetailProps {
	course: Course;
	/** Current user's ID — used for enrollment */
	userId?: number;
	isEnrolled?: boolean;
}

export function CourseDetail({
	course,
	userId,
	isEnrolled: initialEnrolled = false,
}: CourseDetailProps) {
	const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set([course.sections[0]?.id]));
	const [enrolled, setEnrolled] = useState(initialEnrolled);
	const [enrolling, setEnrolling] = useState(false);
	const [localCount, setLocalCount] = useState(course.enrollmentCount);

	const toggleExpanded = (id: number) =>
		setExpandedIds((prev) => {
			const next = new Set(prev);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});

	const handleEnroll = async () => {
		if (!userId) return;
		setEnrolling(true);
		try {
			await coursesApi.enroll(course.id, userId);
			setEnrolled(true);
			setLocalCount(prev => prev + 1);
		} catch (e: any) {
			alert(e.message);
		} finally {
			setEnrolling(false);
		}
	};

	const handleUnenroll = async () => {
		if (!userId || !confirm("Unenroll from this course?")) return;
		setEnrolling(true);
		try {
			await coursesApi.unenroll(course.id, userId);
			setEnrolled(false);
			setLocalCount(prev => Math.max(0, prev - 1));
		} catch (e: any) {
			alert(e.message);
		} finally {
			setEnrolling(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
				<div className="space-y-1">
					<h1 className="text-2xl font-bold text-foreground">{course.title}</h1>
					<p className="text-sm text-muted-foreground flex items-center gap-1">
						<GraduationCap className="h-4 w-4" />
						{course.instructorName}
					</p>
					<div className="flex items-center gap-3 text-xs text-muted-foreground">
						<span className="flex items-center gap-1">
							<Users className="h-3.5 w-3.5" />
							{localCount} enrolled
						</span>
						<span>{course.sections.length} sections</span>
						{!course.isPublished && (
							<Badge variant="secondary" className="text-xs">
								Draft
							</Badge>
						)}
					</div>
				</div>

				{userId && (
					<div className="shrink-0">
						{userId === course.instructorId ? (
							<Button asChild>
								<Link href={`/courses/${course.id}/manage`}>Manage Course</Link>
							</Button>
						) : enrolled ? (
							<Button variant="destructive" onClick={handleUnenroll} disabled={enrolling}>
								{enrolling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								Unenroll
							</Button>
						) : (
							<Button onClick={handleEnroll} disabled={enrolling}>
								{enrolling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								Enroll Now
							</Button>
						)}
					</div>
				)}
			</div>

			{/* Description */}
			{course.description && (
				<p className="text-base sm:text-lg text-muted-foreground leading-relaxed my-4">{course.description}</p>
			)}

			{/* Sections */}
			<div className="space-y-2">
				<h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Course Content</h2>
				{course.sections.length === 0 ? (
					<p className="text-sm text-muted-foreground py-4">No sections added yet.</p>
				) : (
					course.sections.map((section, idx) => (
						<div key={section.id} className="border border-border rounded-lg overflow-hidden">
							<button
								className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-accent transition-colors"
								onClick={() => toggleExpanded(section.id)}
							>
								{expandedIds.has(section.id) ? (
									<ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
								) : (
									<ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
								)}
								<span className="text-xs text-muted-foreground w-5 text-right shrink-0">
									{idx + 1}.
								</span>
								<span className="font-medium text-sm flex-1">{section.title}</span>
								<span className="text-xs text-muted-foreground shrink-0">
									{section.materials.length} {section.materials.length === 1 ? "file" : "files"}
								</span>
							</button>

							{expandedIds.has(section.id) && (
								<div className="border-t border-border bg-muted/20 px-4 py-3 space-y-2">
									{section.description && (
										<p className="text-xs text-muted-foreground">{section.description}</p>
									)}
									{section.materials.length === 0 ? (
										<p className="text-xs text-muted-foreground italic">
											No materials in this section.
										</p>
									) : (
										<ul className="space-y-1">
											{section.materials.map((m) => (
												<li key={m.id} className="flex items-center gap-2 text-sm py-1">
													<MaterialIcon type={m.fileType} />
													<a
														href={`http://localhost:8080${m.fileUrl}`}
														target="_blank"
														rel="noopener noreferrer"
														className="flex-1 truncate text-card-foreground hover:text-primary hover:underline transition-colors"
														title={m.title}
													>
														{m.title}
													</a>
													{m.uploadedAt && (
														<span className="text-xs text-muted-foreground shrink-0 tabular-nums">
															{new Intl.DateTimeFormat("en-US", {
																month: "short",
																day: "numeric",
																year: "numeric",
																hour: "numeric",
																minute: "2-digit",
															}).format(new Date(m.uploadedAt))}
														</span>
													)}
												</li>
											))}
										</ul>
									)}
								</div>
							)}
						</div>
					))
				)}
			</div>
		</div>
	);
}
