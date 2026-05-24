"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
	ArrowLeft,
	FileText,
	Presentation,
	Film,
	FileImage,
	File,
	Send,
	Loader2,
	ChevronDown,
	ChevronRight,
	ArrowRight,
	Check,
	FolderPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sidebar } from "@/components/common/sidebar";
import { Header } from "@/components/common/header";
import { workspacesApi, contributionsApi } from "@/lib/workspace-api";
import { coursesApi } from "@/lib/courses-api";
import { useAuth } from "@/context/auth-context";
import type { WorkspaceSpace, WorkspaceMaterial, WorkspaceSection } from "@/types/workspaces";
import type { Course, MaterialType } from "@/types/courses";
import Link from "next/link";

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

const WorkspaceSectionCard = ({
	section,
	isChecked,
	isProposed,
	toggleSectionCheck,
	toggleLeft,
	expandedLeft,
	selectedMaterials,
	toggleMaterial,
}: Readonly<any>) => (
	<div
		className={`border rounded-md overflow-hidden transition-colors ${
			isProposed
				? "border-emerald-500 bg-emerald-500/5"
				: isChecked
					? "border-primary/50 bg-primary/5"
					: "border-border"
		}`}
	>
		<label className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent/50 transition-colors">
			<input
				type="checkbox"
				checked={isChecked || isProposed}
				onChange={() => toggleSectionCheck(section)}
				className="rounded border-border shrink-0"
			/>
			<button
				className="flex items-center gap-2 flex-1 text-left"
				onClick={(e) => {
					e.preventDefault();
					toggleLeft(section.id);
				}}
			>
				{expandedLeft.has(section.id) ? (
					<ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
				) : (
					<ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
				)}
				<span className="text-xs font-semibold flex-1">{section.title}</span>
			</button>
			<span className="text-[10px] text-muted-foreground shrink-0">{section.materials.length} files</span>
		</label>

		{expandedLeft.has(section.id) && (
			<div className="border-t bg-muted/20 px-3 py-2 space-y-1">
				{section.materials.length === 0 ? (
					<p className="text-[11px] text-muted-foreground italic">Empty section</p>
				) : (
					section.materials.map((m: any) => (
						<label
							key={m.id}
							className={`flex items-center gap-2 p-1.5 rounded text-sm transition-colors cursor-pointer ${
								selectedMaterials.has(m.id)
									? "bg-primary/10 border border-primary/30"
									: "hover:bg-accent border border-transparent"
							}`}
						>
							<input
								type="checkbox"
								checked={selectedMaterials.has(m.id)}
								onChange={() => toggleMaterial(m.id, section)}
								className="rounded border-border"
							/>
							<MaterialIcon type={m.fileType} />
							<span className="truncate flex-1 text-xs">{m.title}</span>
						</label>
					))
				)}
			</div>
		)}
	</div>
);

const CourseSectionCard = ({
	section,
	disabled,
	isSelected,
	setTargetSectionId,
	toggleRight,
	expandedRight,
}: Readonly<any>) => (
	<div
		className={`border rounded-md overflow-hidden transition-colors ${
			disabled ? "opacity-50" : ""
		} ${isSelected ? "border-primary bg-primary/5" : "border-border"} ${
			!disabled && !isSelected ? "hover:border-primary/40" : ""
		}`}
	>
		<label
			className={`flex items-center gap-2 px-3 py-2 m-0 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
		>
			<input
				type="radio"
				name="targetSection"
				disabled={disabled}
				checked={isSelected}
				onChange={() => {
					if (!disabled) setTargetSectionId(section.id);
				}}
				className="sr-only"
			/>
			<div
				className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
					isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
				}`}
			>
				{isSelected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
			</div>
			<button
				type="button"
				className="flex-1 flex items-center gap-2 text-left"
				onClick={(e) => {
					e.preventDefault();
					toggleRight(section.id);
				}}
			>
				{expandedRight.has(section.id) ? (
					<ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
				) : (
					<ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
				)}
				<span className="text-xs font-medium flex-1">{section.title}</span>
				<span className="text-[10px] text-muted-foreground">{section.materials.length} files</span>
			</button>
		</label>
		{expandedRight.has(section.id) && (
			<div className="border-t bg-muted/20 px-3 py-2 space-y-1">
				{section.materials.map((m: any) => (
					<div key={m.id} className="flex items-center gap-2 py-0.5 text-xs text-muted-foreground">
						<MaterialIcon type={m.fileType} />
						<span className="truncate">{m.title}</span>
					</div>
				))}
				{section.materials.length === 0 && <p className="text-[11px] text-muted-foreground italic">Empty</p>}
			</div>
		)}
	</div>
);

const ProposalSummary = ({ isWholeSectionMode, proposedSection, selectedItems, targetSection, course }: any) => {
	if (!isWholeSectionMode && selectedItems.length === 0) return null;

	return (
		<div className="rounded-md border border-border bg-muted/30 px-4 py-3 text-xs space-y-2">
			<div className="flex gap-2">
				<span className="text-muted-foreground shrink-0 w-16">
					{isWholeSectionMode ? "Section" : "Merging"}
				</span>
				<div className="flex flex-wrap gap-1">
					{isWholeSectionMode && (
						<span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-400/30 px-1.5 py-0.5 text-[11px] text-emerald-600 dark:text-emerald-400">
							<FolderPlus className="h-3 w-3" />
							{proposedSection!.title} ({proposedSection!.materials.length} files)
						</span>
					)}
					{!isWholeSectionMode && selectedItems.length === 0 && (
						<span className="text-muted-foreground italic">No materials selected</span>
					)}
					{!isWholeSectionMode &&
						selectedItems.length > 0 &&
						selectedItems.map((m: any) => (
							<span
								key={m.id}
								className="inline-flex items-center gap-1 rounded bg-background border border-border px-1.5 py-0.5 text-[11px]"
							>
								<MaterialIcon type={m.fileType} />
								<span className="truncate max-w-[140px]">{m.title}</span>
							</span>
						))}
				</div>
			</div>

			<div className="flex items-center gap-2 text-muted-foreground">
				<div className="flex-1 border-t border-dashed border-border" />
				<ArrowRight className="h-3.5 w-3.5 shrink-0" />
				<div className="flex-1 border-t border-dashed border-border" />
			</div>

			<div className="flex gap-2">
				<span className="text-muted-foreground shrink-0 w-16">Into</span>
				{isWholeSectionMode && (
					<div>
						<p className="font-medium text-emerald-600 dark:text-emerald-400">
							New section in {course.title}
						</p>
						<p className="text-muted-foreground">Will be created upon instructor approval</p>
					</div>
				)}
				{!isWholeSectionMode && targetSection && (
					<div>
						<p className="font-medium text-foreground">{targetSection.title}</p>
						<p className="text-muted-foreground">
							{course.title} · {targetSection.materials.length} existing material
							{targetSection.materials.length !== 1 ? "s" : ""}
						</p>
					</div>
				)}
				{!isWholeSectionMode && !targetSection && (
					<span className="text-muted-foreground italic">No section selected</span>
				)}
			</div>
		</div>
	);
};

// ── Pure helper: derive the status hint shown above the submit button ─────────
function getStatusMessage(
	isWholeSectionMode: boolean,
	proposedSectionMaterialCount: number,
	proposedSectionTitle: string,
	selectedMaterialsSize: number,
	targetSectionId: number | null,
): string {
	if (isWholeSectionMode) {
		if (proposedSectionMaterialCount === 0) return "The selected section is empty — add materials first.";
		return `"${proposedSectionTitle}" with ${proposedSectionMaterialCount} file${proposedSectionMaterialCount !== 1 ? "s" : ""} ready to propose.`;
	}
	if (selectedMaterialsSize === 0) return "Select materials or use Propose as New Section on any section.";
	if (!targetSectionId) return "Pick a target section on the right.";
	return `${selectedMaterialsSize} material${selectedMaterialsSize !== 1 ? "s" : ""} ready to propose.`;
}

export default function ProposalPage() {
	const { id: workspaceId, spaceId } = useParams<{ id: string; spaceId: string }>();
	const { user } = useAuth();

	const [space, setSpace] = useState<WorkspaceSpace | null>(null);
	const [course, setCourse] = useState<Course | null>(null);
	const [loading, setLoading] = useState(true);

	// ── Material-level selection (for targeting an existing section) ──────────
	const [selectedMaterials, setSelectedMaterials] = useState<Set<number>>(new Set());
	const [targetSectionId, setTargetSectionId] = useState<number | null>(null);

	// ── Section-level checkbox: set when ALL materials of a section are selected ─
	const [checkedSectionId, setCheckedSectionId] = useState<number | null>(null);

	// ── Shared ─────────────────────────────────────────────────────────────────
	const [message, setMessage] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	const [expandedLeft, setExpandedLeft] = useState<Set<number>>(new Set());
	const [expandedRight, setExpandedRight] = useState<Set<number>>(new Set());

	useEffect(() => {
		(async () => {
			try {
				const s = await workspacesApi.getSpace(Number(spaceId));
				setSpace(s);
				if (s.forkedFromCourseId) {
					const c = await coursesApi.getById(s.forkedFromCourseId);
					setCourse(c);
					if (s.sections.length > 0) setExpandedLeft(new Set([s.sections[0].id]));
					if (c.sections.length > 0) {
						setExpandedRight(new Set([c.sections[0].id]));
						setTargetSectionId(c.sections[0].id);
					}
				}
			} catch (e: any) {
				alert(e.message);
			} finally {
				setLoading(false);
			}
		})();
	}, [spaceId]);

	// ── Helpers ────────────────────────────────────────────────────────────────

	/** Toggle a single material checkbox; never auto-checks the section header */
	const toggleMaterial = (materialId: number, section: WorkspaceSection) => {
		setSelectedMaterials((prev) => {
			const next = new Set(prev);
			next.has(materialId) ? next.delete(materialId) : next.add(materialId);

			if (checkedSectionId === section.id && !next.has(materialId)) {
				// a child was unchecked → uncheck section header
				setCheckedSectionId(null);
			}
			return next;
		});
	};

	const selectAll = () => {
		if (!space) return;
		const ids = new Set<number>();
		space.sections.forEach((s) => s.materials.forEach((m) => ids.add(m.id)));
		setSelectedMaterials(ids);
	};

	const clearAll = () => {
		setSelectedMaterials(new Set());
		setCheckedSectionId(null);
		if (course?.sections.length) setTargetSectionId(course.sections[0].id);
	};

	const toggleLeft = (id: number) =>
		setExpandedLeft((p) => {
			const n = new Set(p);
			n.has(id) ? n.delete(id) : n.add(id);
			return n;
		});
	const toggleRight = (id: number) =>
		setExpandedRight((p) => {
			const n = new Set(p);
			n.has(id) ? n.delete(id) : n.add(id);
			return n;
		});

	/** Toggle the section header checkbox (selects/deselects all children) */
	const toggleSectionCheck = (section: WorkspaceSection) => {
		if (checkedSectionId === section.id) {
			// uncheck → clear all, restore first course section as target
			setCheckedSectionId(null);
			setSelectedMaterials(new Set());
			if (course?.sections.length) setTargetSectionId(course.sections[0].id);
		} else {
			// check → select all materials, force "New Section" radio
			setCheckedSectionId(section.id);
			setSelectedMaterials(new Set(section.materials.map((m) => m.id)));
			setTargetSectionId(null);
		}
	};

	const isWholeSectionMode = checkedSectionId !== null;
	// The workspace section being proposed (derived, no extra state)
	const proposedSection = space?.sections.find((s) => s.id === checkedSectionId) ?? null;

	const canSubmit = isWholeSectionMode
		? (proposedSection?.materials.length ?? 0) > 0
		: selectedMaterials.size > 0 && targetSectionId !== null;

	// ── Submit ─────────────────────────────────────────────────────────────────
	const handleSubmit = async () => {
		if (!user || !canSubmit || !course) return;
		setSubmitting(true);
		try {
			await contributionsApi.submit(user.id, {
				targetCourseId: course.id,
				...(isWholeSectionMode
					? { proposedSectionTitle: proposedSection!.title }
					: { targetSectionId: targetSectionId! }),
				sourceMaterialIds: isWholeSectionMode
					? proposedSection!.materials.map((m) => m.id)
					: Array.from(selectedMaterials),
				message: message.trim() || undefined,
			});
			setSubmitted(true);
		} catch (e: any) {
			alert(e.message);
		} finally {
			setSubmitting(false);
		}
	};

	// ── Loading ────────────────────────────────────────────────────────────────
	if (loading) {
		return (
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
	}

	if (!space || !course || !user) return null;

	// ── Success ────────────────────────────────────────────────────────────────
	if (submitted) {
		return (
			<div className="flex h-screen bg-background">
				<Sidebar />
				<div className="flex flex-col flex-1 overflow-hidden">
					<Header />
					<main className="flex-1 flex items-center justify-center">
						<Card className="max-w-md">
							<CardContent className="p-8 text-center space-y-4">
								<div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
									<Check className="h-6 w-6 text-green-600 dark:text-green-400" />
								</div>
								<h2 className="text-xl font-bold text-foreground">Proposal Submitted!</h2>
								<p className="text-sm text-muted-foreground">
									{isWholeSectionMode ? (
										<>
											Section <strong>"{proposedSection!.title}"</strong> proposed as a new
											section in <strong>{course.title}</strong>. The instructor will review it.
										</>
									) : (
										<>
											{selectedMaterials.size} material{selectedMaterials.size !== 1 ? "s" : ""}{" "}
											proposed to <strong>{course.title}</strong>. The instructor will review your
											contribution.
										</>
									)}
								</p>
								<div className="flex gap-2 justify-center pt-2">
									<Button variant="outline" asChild>
										<Link href={`/workspaces/${workspaceId}/spaces/${spaceId}`}>Back to Space</Link>
									</Button>
									<Button asChild>
										<Link href="/workspaces">My Workspaces</Link>
									</Button>
								</div>
							</CardContent>
						</Card>
					</main>
				</div>
			</div>
		);
	}

	// ── Collect selected items for summary ─────────────────────────────────────
	const selectedItems: WorkspaceMaterial[] = isWholeSectionMode
		? proposedSection!.materials
		: space.sections.flatMap((s) => s.materials.filter((m) => selectedMaterials.has(m.id)));

	const targetSection = course.sections.find((s) => s.id === targetSectionId);

	const statusMessage = getStatusMessage(
		isWholeSectionMode,
		proposedSection?.materials.length ?? 0,
		proposedSection?.title ?? "",
		selectedMaterials.size,
		targetSectionId,
	);

	// ── Main render ────────────────────────────────────────────────────────────
	return (
		<div className="flex h-screen bg-background">
			<Sidebar />
			<div className="flex flex-col flex-1 overflow-hidden">
				<Header />
				<main className="flex-1 overflow-auto">
					<div className="p-6 max-w-7xl mx-auto space-y-4">
						{/* Page header */}
						<div>
							<Button variant="ghost" size="sm" className="mb-2" asChild>
								<Link href={`/workspaces/${workspaceId}/spaces/${spaceId}`}>
									<ArrowLeft className="mr-1.5 h-4 w-4" />
									Back to Space
								</Link>
							</Button>
							<h1 className="text-2xl font-bold text-foreground">Propose Contribution</h1>
							<p className="text-sm text-muted-foreground mt-1">
								Select individual materials (left) and a target section (right), or use{" "}
								<strong>Propose as New Section</strong> on any workspace section to contribute the whole
								section.
							</p>
						</div>

						{/* Two-panel layout */}
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
							{/* ── LEFT — Student's workspace ─────────────────────────────── */}
							<Card>
								<CardHeader className="pb-3">
									<div className="flex items-center justify-between">
										<CardTitle className="text-sm font-semibold">
											Your Workspace: {space.title}
										</CardTitle>
										<div className="flex gap-1">
											<Button
												variant="ghost"
												size="sm"
												className="text-xs h-7"
												onClick={selectAll}
											>
												Select All {/* NOSONAR */}
											</Button>
											<Button
												variant="ghost"
												size="sm"
												className="text-xs h-7"
												onClick={clearAll}
											>
												Clear
											</Button>
										</div>
									</div>
									<Badge variant="secondary" className="text-xs w-fit">
										{selectedMaterials.size} material{selectedMaterials.size !== 1 ? "s" : ""}{" "}
										selected
									</Badge>
								</CardHeader>

								<CardContent className="space-y-2 max-h-[500px] overflow-auto">
									{space.sections.map((section) => {
										const isChecked = checkedSectionId === section.id;
										const isProposed = isWholeSectionMode && proposedSection?.id === section.id;
										return (
											<WorkspaceSectionCard
												key={section.id}
												section={section}
												isChecked={isChecked}
												isProposed={isProposed}
												toggleSectionCheck={toggleSectionCheck}
												toggleLeft={toggleLeft}
												expandedLeft={expandedLeft}
												selectedMaterials={selectedMaterials}
												toggleMaterial={toggleMaterial}
											/>
										);
									})}
								</CardContent>
							</Card>

							{/* ── RIGHT — Target course ──────────────────────────────────── */}
							<Card>
								<CardHeader className="pb-3">
									<CardTitle className="text-sm font-semibold">
										Target Course: {course.title}
									</CardTitle>
									<p className="text-xs text-muted-foreground">
										Select the section where you want your materials to appear.
									</p>
								</CardHeader>

								<CardContent className="space-y-1 max-h-[500px] overflow-auto">
									{/* Existing sections to target */}
									{course.sections.map((section) => {
										const disabled = isWholeSectionMode;
										const isSelected = targetSectionId === section.id;
										return (
											<CourseSectionCard
												key={section.id}
												section={section}
												disabled={disabled}
												isSelected={isSelected}
												setTargetSectionId={setTargetSectionId}
												toggleRight={toggleRight}
												expandedRight={expandedRight}
											/>
										);
									})}

									{/* When whole section is checked, it forces the "New Section" option (now at bottom) */}
									{isWholeSectionMode && (
										<div
											className={`border rounded-md overflow-hidden transition-colors border-emerald-500 bg-emerald-500/10 mt-1`}
										>
											<div className="flex items-center gap-2 px-3 py-2">
												<div
													className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 border-emerald-500 bg-emerald-500`}
												>
													<Check className="h-2.5 w-2.5 text-primary-foreground" />
												</div>
												<div className="flex-1 flex items-center gap-2 text-left">
													<FolderPlus className="h-4 w-4 text-emerald-500 shrink-0" />
													<span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex-1">
														Propose "{proposedSection!.title}" as new section
													</span>
													<Badge
														variant="outline"
														className="text-[9px] border-emerald-400/50 text-emerald-600 dark:text-emerald-400"
													>
														New
													</Badge>
												</div>
											</div>
											<div className="border-t bg-muted/20 px-3 py-2 space-y-1">
												{proposedSection!.materials.length === 0 ? (
													<p className="text-[11px] text-muted-foreground italic">
														Empty section
													</p>
												) : (
													proposedSection!.materials.map((m) => (
														<div
															key={m.id}
															className="flex items-center gap-2 py-1 text-xs text-foreground"
														>
															<Check className="h-3 w-3 text-emerald-500 shrink-0" />
															<MaterialIcon type={m.fileType} />
															<span className="truncate">{m.title}</span>
														</div>
													))
												)}
												<p className="text-[10px] text-muted-foreground pt-1 border-t border-border/50 mt-1">
													Will be added to <strong>{course.title}</strong> upon approval.
												</p>
											</div>
										</div>
									)}
								</CardContent>
							</Card>
						</div>

						{/* ── Submit card ─────────────────────────────────────────────── */}
						<Card>
							<CardContent className="p-4 space-y-3">
								<div className="space-y-2">
									<Label className="text-sm">Message to instructor (optional)</Label>
									<Textarea
										placeholder="e.g. I found these additional resources helpful..."
										value={message}
										onChange={(e) => setMessage(e.target.value)}
										rows={2}
									/>
								</div>

								{/* Proposal summary */}
								{(selectedItems.length > 0 || isWholeSectionMode) && (
									<ProposalSummary
										isWholeSectionMode={isWholeSectionMode}
										proposedSection={proposedSection}
										selectedItems={selectedItems}
										targetSection={targetSection}
										course={course}
									/>
								)}

								<div className="flex items-center justify-between">
									<p className="text-xs text-muted-foreground">{statusMessage}</p>
									<Button onClick={handleSubmit} disabled={submitting || !canSubmit}>
										{submitting ? (
											<Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
										) : (
											<Send className="mr-1.5 h-4 w-4" />
										)}
										Submit Proposal
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				</main>
			</div>
		</div>
	);
}
