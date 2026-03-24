"use client";

import Link from "next/link";
import { BookOpen, Users, GraduationCap, ArrowRight, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import type { CourseSummary } from "@/types/courses";

interface CourseCardProps {
	course: CourseSummary;
	/** userId used for management links (instructor view) */
	as?: "student" | "instructor";
}

export function CourseCard({ course, as = "student" }: CourseCardProps) {
	return (
		<Card className="group flex flex-col h-full hover:shadow-md transition-shadow border-border bg-card">
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between gap-2">
					<div className="flex-1 min-w-0">
						<h3 className="font-semibold text-card-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
							{course.title}
						</h3>
						<p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
							<GraduationCap className="h-3 w-3 flex-shrink-0" />
							{course.instructorName}
						</p>
					</div>
					{!course.isPublished && (
						<Badge variant="secondary" className="text-xs shrink-0 flex items-center gap-1">
							<Lock className="h-2.5 w-2.5" />
							Draft
						</Badge>
					)}
				</div>
			</CardHeader>

			<CardContent className="flex-1 pb-3">
				{course.description && (
					<p className="text-sm text-muted-foreground line-clamp-3">{course.description}</p>
				)}
				<div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
					<span className="flex items-center gap-1">
						<BookOpen className="h-3.5 w-3.5" />
						{course.sectionCount} {course.sectionCount === 1 ? "section" : "sections"}
					</span>
					<span className="flex items-center gap-1">
						<Users className="h-3.5 w-3.5" />
						{course.enrollmentCount} enrolled
					</span>
				</div>
			</CardContent>

			<CardFooter className="pt-0">
				{as === "instructor" ? (
					<div className="flex gap-2 w-full">
						<Button asChild variant="outline" size="sm" className="flex-1">
							<Link href={`/courses/${course.id}`}>View</Link>
						</Button>
						<Button asChild size="sm" className="flex-1">
							<Link href={`/courses/${course.id}/manage`}>
								Manage <ArrowRight className="ml-1 h-3 w-3" />
							</Link>
						</Button>
					</div>
				) : (
					<Button asChild size="sm" className="w-full">
						<Link href={`/courses/${course.id}`}>
							View Course <ArrowRight className="ml-1 h-3 w-3" />
						</Link>
					</Button>
				)}
			</CardFooter>
		</Card>
	);
}
