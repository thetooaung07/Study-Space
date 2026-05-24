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
		Users,
	GraduationCap,
		Loader2,
	GitFork,
	FolderOpen,
	Plus,
	ArrowLeft,
	FolderPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { workspacesApi } from "@/lib/workspace-api";
import { coursesApi } from "@/lib/courses-api";
import type { Course, MaterialType } from "@/types/courses";
import type { StudentWorkspace } from "@/types/workspaces";
import { useRouter } from "next/navigation";

const MaterialIcon = ({ type }: Readonly<{ type: MaterialType }>) => {
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

const CourseSectionItem = ({ section, idx, isExpanded, toggleExpanded }: any) => (
	<div className="border border-border rounded-lg overflow-hidden">
		<button
			className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-accent transition-colors"
			onClick={() => toggleExpanded(section.id)}
		>
			{isExpanded ? (
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

		{isExpanded && (
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
						{section.materials.map((m: any) => (
							<li key={m.id} className="flex items-center gap-2 text-sm py-1">
								<MaterialIcon type={m.fileType} />
								<a
									href={`http://localhost:8080/api/files/download?materialId=${m.id}&type=COURSE&token=${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`}
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
);

interface CourseDetailProps {
	course: Course;
	/** Current user's ID — used for enrollment */
	userId?: number;
	isEnrolled?: boolean;
}

export function CourseDetail({ course, userId, isEnrolled: initialEnrolled = false }: Readonly<CourseDetailProps>) {
	const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set([course.sections[0]?.id]));
	const [enrolled, setEnrolled] = useState(initialEnrolled);
	const [enrolling, setEnrolling] = useState(false);
	const [localCount, setLocalCount] = useState(course.enrollmentCount);
	const [showUnenrollDialog, setShowUnenrollDialog] = useState(false);
	const [unenrollError, setUnenrollError] = useState("");
	const router = useRouter();

	// Fork modal state
	// step: "select" → pick/create workspace | "name" → confirm fork name
	type ForkStep = "select" | "name";
	const [showForkDialog, setShowForkDialog] = useState(false);
	const [forkStep, setForkStep] = useState<ForkStep>("select");
	const [workspaces, setWorkspaces] = useState<StudentWorkspace[]>([]);
	const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
	const [forking, setForking] = useState(false);

	// "Create new workspace" inline form
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [newWsName, setNewWsName] = useState("");
	const [creatingWs, setCreatingWs] = useState(false);
	const [createWsError, setCreateWsError] = useState("");

	// Selected workspace for step 2
	const [selectedWorkspace, setSelectedWorkspace] = useState<StudentWorkspace | null>(null);
	const [forkName, setForkName] = useState(course.title);
	const [forkError, setForkError] = useState("");

	const resetForkModal = () => {
		setForkStep("select");
		setShowCreateForm(false);
		setNewWsName("");
		setCreateWsError("");
		setSelectedWorkspace(null);
		setForkName(course.title);
		setForkError("");
	};

	const loadWorkspaces = async () => {
		if (!userId) return;
		setLoadingWorkspaces(true);
		try {
			const ws = await workspacesApi.getMyWorkspaces(userId);
			setWorkspaces(ws);
		} catch (e) {
			console.error(e);
		} finally {
			setLoadingWorkspaces(false);
		}
	};

	const handleSelectWorkspace = (ws: StudentWorkspace) => {
		setSelectedWorkspace(ws);
		setForkName(course.title);
		setForkError("");
		setForkStep("name");
	};

	const handleCreateWorkspace = async () => {
		if (!userId || !newWsName.trim()) return;
		setCreatingWs(true);
		setCreateWsError("");
		try {
			const ws = await workspacesApi.create(userId, { name: newWsName.trim() });
			setWorkspaces((prev) => [ws, ...prev]);
			setSelectedWorkspace(ws);
			setForkName(course.title);
			setForkError("");
			setForkStep("name");
			setShowCreateForm(false);
			setNewWsName("");
		} catch (e: any) {
			setCreateWsError(e.message ?? "Failed to create workspace.");
		} finally {
			setCreatingWs(false);
		}
	};

	const handleForkConfirm = async () => {
		if (!userId || !selectedWorkspace) return;
		if (!forkName.trim()) {
			setForkError("Please enter a name for the cloned space.");
			return;
		}
		setForking(true);
		setForkError("");
		try {
			const space = await workspacesApi.forkCourse(selectedWorkspace.id, userId, course.id, forkName.trim());
			router.push(`/workspaces/${selectedWorkspace.id}/spaces/${space.id}`);
		} catch (e: any) {
			setForkError(e.message ?? "Cloning failed.");
		} finally {
			setForking(false);
		}
	};

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
			setLocalCount((prev) => prev + 1);
		} catch (e: any) {
			alert(e.message);
		} finally {
			setEnrolling(false);
		}
	};

	const handleUnenroll = async () => {
		if (!userId) return;
		setEnrolling(true);
		setUnenrollError("");
		try {
			await coursesApi.unenroll(course.id, userId);
			setEnrolled(false);
			setLocalCount((prev) => Math.max(0, prev - 1));
			setShowUnenrollDialog(false);
		} catch (e: any) {
			setUnenrollError(e.message ?? "Failed to unenroll.");
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
						) : (
							<div className="flex flex-wrap gap-2 justify-end">
								{/* Fork Button — only visible when enrolled */}
								{enrolled && (
									<Dialog
										open={showForkDialog}
										onOpenChange={(open) => {
											setShowForkDialog(open);
											if (!open) resetForkModal();
										}}
									>
										<DialogTrigger asChild>
											<Button variant="outline" onClick={loadWorkspaces}>
												<GitFork className="mr-1.5 h-4 w-4" />
												Copy to Workspace
											</Button>
										</DialogTrigger>

										<DialogContent className="max-w-md" aria-describedby={undefined}>
											{/* ── Step 1: Select or create a workspace ── */}
											{forkStep === "select" && (
												<>
													<DialogHeader>
														<DialogTitle className="flex items-center gap-2">
															<GitFork className="h-4 w-4" />
															Copy to Workspace
														</DialogTitle>
													</DialogHeader>
													<p className="text-sm text-muted-foreground mt-1">
														Choose an existing workspace or create a new one to clone this
														course into.
													</p>

													{/* Workspace list */}
													<div className="space-y-2 max-h-56 overflow-y-auto mt-3 pr-0.5">
														{loadingWorkspaces ? (
															<div className="flex items-center justify-center py-8">
																<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
															</div>
														) : workspaces.length === 0 ? (
															<p className="text-sm text-center py-4 text-muted-foreground">
																No workspaces yet. Create one below.
															</p>
														) : (
															workspaces.map((ws) => (
																<Card
																	key={ws.id}
																	className="cursor-pointer hover:border-primary/50 transition-colors"
																	onClick={() => handleSelectWorkspace(ws)}
																>
																	<CardContent className="p-3 flex items-center justify-between">
																		<div className="flex items-center gap-2">
																			<FolderOpen className="h-4 w-4 text-primary" />
																			<span className="text-sm font-medium">
																				{ws.name}
																			</span>
																		</div>
																		<Badge
																			variant="secondary"
																			className="text-[10px]"
																		>
																			{ws.spaceCount} spaces
																		</Badge>
																	</CardContent>
																</Card>
															))
														)}
													</div>

													{/* Create new workspace inline */}
													{!showCreateForm ? (
														<Button
															variant="outline"
															className="w-full gap-2"
															onClick={() => setShowCreateForm(true)}
														>
															<FolderPlus className="h-4 w-4" />
															Create new workspace
														</Button>
													) : (
														<div className="rounded-lg border bg-muted/40 p-4 space-y-3">
															<p className="text-sm font-medium flex items-center gap-1.5">
																<FolderPlus className="h-4 w-4 text-primary" />
																New Workspace
															</p>
															<div className="space-y-1.5">
																<Label htmlFor="new-ws-name" className="text-xs">
																	Workspace name
																</Label>
																<Input
																	id="new-ws-name"
																	placeholder="e.g. My Study Group"
																	value={newWsName}
																	onChange={(e) => setNewWsName(e.target.value)}
																	onKeyDown={(e) =>
																		e.key === "Enter" && handleCreateWorkspace()
																	}
																	autoFocus
																/>
																{createWsError && (
																	<p className="text-xs text-destructive">
																		{createWsError}
																	</p>
																)}
															</div>
															<div className="flex gap-2">
																<Button
																	size="sm"
																	className="flex-1"
																	onClick={handleCreateWorkspace}
																	disabled={creatingWs || !newWsName.trim()}
																>
																	{creatingWs ? (
																		<Loader2 className="h-3.5 w-3.5 animate-spin" />
																	) : (
																		<Plus className="h-3.5 w-3.5" />
																	)}
																	Create & Continue
																</Button>
																<Button
																	size="sm"
																	variant="ghost"
																	onClick={() => {
																		setShowCreateForm(false);
																		setNewWsName("");
																		setCreateWsError("");
																	}}
																	disabled={creatingWs}
																>
																	Cancel
																</Button>
															</div>
														</div>
													)}
												</>
											)}

											{/* ── Step 2: Confirm fork name ── */}
											{forkStep === "name" && selectedWorkspace && (
												<>
													<DialogHeader>
														<DialogTitle className="flex items-center gap-2">
															<GitFork className="h-4 w-4" />
															Name your clone
														</DialogTitle>
													</DialogHeader>

													{/* Workspace badge */}
													<div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 mt-2">
														<FolderOpen className="h-4 w-4 text-primary shrink-0" />
														<span className="text-sm font-medium truncate flex-1">
															{selectedWorkspace.name}
														</span>
														<Badge variant="secondary" className="text-[10px] shrink-0">
															{selectedWorkspace.spaceCount} spaces
														</Badge>
													</div>

													<div className="space-y-1.5 mt-4">
														<Label htmlFor="fork-name" className="text-sm">
															Cloned Space Name
														</Label>
														<Input
															id="fork-name"
															value={forkName}
															onChange={(e) => setForkName(e.target.value)}
															onKeyDown={(e) => e.key === "Enter" && handleForkConfirm()}
															placeholder={course.title}
															autoFocus
														/>
														<p className="text-xs text-muted-foreground">
															This will be the name of the cloned space inside the
															workspace.
														</p>
														{forkError && (
															<p className="text-xs text-destructive">{forkError}</p>
														)}
													</div>

													<div className="flex gap-2 mt-4">
														<Button
															variant="outline"
															size="sm"
															className="gap-1.5"
															onClick={() => setForkStep("select")}
															disabled={forking}
														>
															<ArrowLeft className="h-3.5 w-3.5" />
															Back
														</Button>
														<Button
															className="flex-1 gap-2"
															onClick={handleForkConfirm}
															disabled={forking || !forkName.trim()}
														>
															{forking ? (
																<Loader2 className="h-4 w-4 animate-spin" />
															) : (
																<GitFork className="h-4 w-4" />
															)}
															{forking ? "Cloning…" : "Clone course"}
														</Button>
													</div>
												</>
											)}
										</DialogContent>
									</Dialog>
								)}

								{enrolled ? (
									<>
										<Button
											variant="destructive"
											onClick={() => setShowUnenrollDialog(true)}
											disabled={enrolling}
										>
											Unenroll
										</Button>
										<ConfirmDialog
											open={showUnenrollDialog}
											onOpenChange={setShowUnenrollDialog}
											title="Unenroll from course"
											description={`Are you sure you want to unenroll from "${course.title}"? You can re-enroll at any time.`}
											confirmText="Unenroll"
											onConfirm={handleUnenroll}
											loading={enrolling}
											error={unenrollError}
											variant="destructive"
										/>
									</>
								) : (
									<Button onClick={handleEnroll} disabled={enrolling}>
										{enrolling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
										Enroll Now
									</Button>
								)}
							</div>
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
						<CourseSectionItem
							key={section.id}
							section={section}
							idx={idx}
							isExpanded={expandedIds.has(section.id)}
							toggleExpanded={toggleExpanded}
						/>
					))
				)}
			</div>
		</div>
	);
}
