"use client";

import { useRef, useState } from "react";
import {
	Plus,
	Pencil,
	Trash2,
	GripVertical,
	Loader2,
	ChevronDown,
	ChevronRight,
	Upload,
	FileText,
	FileImage,
	Film,
	Presentation,
	File,
	ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { coursesApi } from "@/lib/courses-api";
import type { CourseSection, CourseMaterial, MaterialType } from "@/types/courses";

// ─── helpers ──────────────────────────────────────────────────────────────────
function MatIcon({ type }: { type: MaterialType }) {
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
}

// ─── props ────────────────────────────────────────────────────────────────────
interface SectionManagerProps {
	courseId: number;
	userId: number;
	initialSections: CourseSection[];
	onSectionsChange?: (sections: CourseSection[]) => void;
}

export function SectionManager({ courseId, userId, initialSections, onSectionsChange }: SectionManagerProps) {
	const [sections, setSections] = useState<CourseSection[]>(initialSections);
	const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set(initialSections.map((s) => s.id)));
	// title/description edit
	const [editingId, setEditingId] = useState<number | null>(null);
	const [editTitle, setEditTitle] = useState("");
	const [editDesc, setEditDesc] = useState("");
	const [editSaving, setEditSaving] = useState(false);
	// add-new-section form
	const [addingNew, setAddingNew] = useState(false);
	const [newTitle, setNewTitle] = useState("");
	const [newDesc, setNewDesc] = useState("");
	const [newSaving, setNewSaving] = useState(false);
	// per-section upload state (keyed by sectionId)
	const [uploadState, setUploadState] = useState<
		Record<number, { title: string; file: File | null; uploading: boolean; error: string | null }>
	>({});
	const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});

	// ─── helpers ────────────────────────────────────────────────────────────────
	const update = (next: CourseSection[]) => {
		setSections(next);
		onSectionsChange?.(next);
	};

	const getUpload = (sectionId: number) =>
		uploadState[sectionId] ?? { title: "", file: null, uploading: false, error: null };

	const setUpload = (sectionId: number, patch: Partial<(typeof uploadState)[number]>) =>
		setUploadState((prev) => ({
			...prev,
			[sectionId]: { ...getUpload(sectionId), ...patch },
		}));

	const toggleExpand = (id: number) =>
		setExpandedIds((prev) => {
			const next = new Set(prev);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});

	// ─── section title/desc edit ─────────────────────────────────────────────────
	const startEdit = (s: CourseSection) => {
		setEditingId(s.id);
		setEditTitle(s.title);
		setEditDesc(s.description ?? "");
		setExpandedIds((prev) => {
			const next = new Set(prev);
			next.add(s.id);
			return next;
		});
	};

	const cancelEdit = () => setEditingId(null);

	const saveEdit = async (sectionId: number, idx: number) => {
		if (!editTitle.trim()) return;
		setEditSaving(true);
		try {
			const updated = await coursesApi.updateSection(sectionId, userId, {
				title: editTitle,
				description: editDesc,
				orderIndex: idx,
			});
			update(sections.map((s) => (s.id === sectionId ? { ...s, ...updated } : s)));
			setEditingId(null);
		} catch (e: any) {
			alert(e.message);
		} finally {
			setEditSaving(false);
		}
	};

	// ─── add new section ─────────────────────────────────────────────────────────
	const saveNewSection = async () => {
		if (!newTitle.trim()) return;
		setNewSaving(true);
		try {
			const created = await coursesApi.addSection(courseId, userId, {
				title: newTitle,
				description: newDesc,
				orderIndex: sections.length,
			});
			update([...sections, created]);
			setExpandedIds((prev) => new Set([...prev, created.id]));
			setNewTitle("");
			setNewDesc("");
			setAddingNew(false);
		} catch (e: any) {
			alert(e.message);
		} finally {
			setNewSaving(false);
		}
	};

	// ─── delete section ──────────────────────────────────────────────────────────
	const deleteSection = async (sectionId: number) => {
		if (!confirm("Delete this section and all its materials?")) return;
		try {
			await coursesApi.deleteSection(sectionId, userId);
			update(sections.filter((s) => s.id !== sectionId));
		} catch (e: any) {
			alert(e.message);
		}
	};

	// ─── material upload ─────────────────────────────────────────────────────────
	const handleFileChange = (sectionId: number, e: React.ChangeEvent<HTMLInputElement>) => {
		const f = e.target.files?.[0] ?? null;
		const currentTitle = getUpload(sectionId).title;
		setUpload(sectionId, {
			file: f,
			title: currentTitle || (f ? f.name.replace(/\.[^.]+$/, "") : ""),
		});
	};

	const handleUpload = async (sectionId: number) => {
		const up = getUpload(sectionId);
		if (!up.file || !up.title.trim()) return;
		setUpload(sectionId, { uploading: true, error: null });
		try {
			const material = await coursesApi.uploadMaterial(sectionId, userId, up.title, up.file);
			update(sections.map((s) => (s.id === sectionId ? { ...s, materials: [...s.materials, material] } : s)));
			setUpload(sectionId, { title: "", file: null, uploading: false });
			if (fileRefs.current[sectionId]) fileRefs.current[sectionId]!.value = "";
		} catch (e: any) {
			setUpload(sectionId, { uploading: false, error: e.message ?? "Upload failed" });
		}
	};

	// ─── material delete ─────────────────────────────────────────────────────────
	const handleDeleteMaterial = async (sectionId: number, materialId: number) => {
		if (!confirm("Delete this material?")) return;
		try {
			await coursesApi.deleteMaterial(materialId, userId);
			update(
				sections.map((s) =>
					s.id === sectionId ? { ...s, materials: s.materials.filter((m) => m.id !== materialId) } : s,
				),
			);
		} catch (e: any) {
			alert(e.message);
		}
	};

	// ─── render ──────────────────────────────────────────────────────────────────
	return (
		<div className="space-y-3">
			{sections.map((section, idx) => {
				const isEditing = editingId === section.id;
				const isExpanded = expandedIds.has(section.id);
				const up = getUpload(section.id);

				return (
					<Card key={section.id} className="border-border overflow-hidden gap-2 py-0">
						{/* ── Header / Edit row ── */}
						{isEditing ? (
							<CardContent className="px-4 py-3 space-y-2 border-b border-border">
								<Input
									className="font-medium"
									placeholder="Section title *"
									value={editTitle}
									onChange={(e) => setEditTitle(e.target.value)}
									autoFocus
									onKeyDown={(e) => {
										if (e.key === "Enter") saveEdit(section.id, idx);
										if (e.key === "Escape") cancelEdit();
									}}
								/>
								<Textarea
									rows={2}
									placeholder="Description (optional)"
									value={editDesc}
									onChange={(e) => setEditDesc(e.target.value)}
								/>
								<div className="flex gap-2">
									<Button
										size="sm"
										onClick={() => saveEdit(section.id, idx)}
										disabled={editSaving || !editTitle.trim()}
									>
										{editSaving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
										Save
									</Button>
									<Button size="sm" variant="ghost" onClick={cancelEdit}>
										Cancel
									</Button>
								</div>
							</CardContent>
						) : (
							<CardHeader
								className={`px-4 pt-5 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors ${isExpanded ? "pb-1" : "pb-3"}`}
								onClick={() => toggleExpand(section.id)}
							>
								<div className="flex items-start gap-2">
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-1 w-full text-left text-sm font-medium hover:text-primary transition-colors">
											{isExpanded ? (
												<ChevronDown className="h-4 w-4 shrink-0" />
											) : (
												<ChevronRight className="h-4 w-4 shrink-0" />
											)}
											<span className="text-xs text-muted-foreground mr-1">
												{String(idx + 1).padStart(2, "0")}
											</span>
											<span className="truncate">{section.title}</span>
											<span className="ml-2 text-xs text-muted-foreground font-normal shrink-0">
												({section.materials.length}{" "}
												{section.materials.length === 1 ? "file" : "files"})
											</span>
										</div>
										{/* Show description below title when not editing */}
										{section.description && !isEditing && (
											<p
												className={`text-xs text-muted-foreground mt-1.5 ml-5 ${!isExpanded ? "line-clamp-2" : ""}`}
											>
												{section.description}
											</p>
										)}
									</div>
									<Button
										variant="ghost"
										size="icon"
										className="h-7 w-7 shrink-0"
										onClick={(e) => {
											e.stopPropagation();
											startEdit(section);
										}}
										title="Edit title / description"
									>
										<Pencil className="h-3.5 w-3.5" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										className="h-7 w-7 shrink-0"
										onClick={(e) => {
											e.stopPropagation();
											deleteSection(section.id);
										}}
										title="Delete section"
									>
										<Trash2 className="h-3.5 w-3.5 text-destructive" />
									</Button>
								</div>
							</CardHeader>
						)}

						{/* ── Expanded: materials + upload ── */}
						{isExpanded && (
							<CardContent className="px-4 pb-4 pt-1 space-y-2">
								{/* Material rows */}
								{section.materials.length === 0 && isEditing && (
									<p className="text-xs text-muted-foreground italic py-1">
										No materials yet — upload one below.
									</p>
								)}
								{section.materials.length === 0 && !isEditing && (
									<p className="text-xs text-muted-foreground italic py-1">
										No materials in this section.
									</p>
								)}
								{section.materials.map((m) => (
									<div
										key={m.id}
										className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-1.5"
									>
										<MatIcon type={m.fileType} />
										<a
											href={`http://localhost:8080${m.fileUrl}`}
											target="_blank"
											rel="noopener noreferrer"
											title="Open file"
											className="flex-1 truncate text-sm hover:underline hover:text-primary transition-colors"
										>
											{m.title}
										</a>
										<Badge
											variant="secondary"
											className="text-[10px] px-1.5 py-0 hidden sm:inline-flex"
										>
											{m.fileType}
										</Badge>
										{isEditing && (
											<button
												onClick={() => handleDeleteMaterial(section.id, m.id)}
												title="Delete material"
												className="text-muted-foreground hover:text-destructive transition-colors ml-2"
											>
												<Trash2 className="h-3.5 w-3.5" />
											</button>
										)}
									</div>
								))}

								{/* Upload row (only when editing) */}
								{isEditing && (
									<div className="pt-1 space-y-1.5">
										<Label className="text-xs text-muted-foreground">Add material</Label>
										<div className="flex items-center gap-2">
											<Input
												placeholder="Material name…"
												value={up.title}
												onChange={(e) => setUpload(section.id, { title: e.target.value })}
												className="h-8 text-sm flex-1 min-w-0"
											/>
											<Input
												ref={(el) => {
													fileRefs.current[section.id] = el;
												}}
												type="file"
												accept=".pdf,.ppt,.pptx,.mp4,.mov,.jpg,.jpeg,.png,.zip"
												onChange={(e) => handleFileChange(section.id, e)}
												className="h-8 text-sm cursor-pointer flex-1 min-w-0"
											/>
											<Button
												size="sm"
												variant="secondary"
												className="h-8 shrink-0 gap-1"
												onClick={() => handleUpload(section.id)}
												disabled={!up.file || !up.title.trim() || up.uploading}
											>
												{up.uploading ? (
													<Loader2 className="h-3.5 w-3.5 animate-spin" />
												) : (
													<Upload className="h-3.5 w-3.5" />
												)}
												{up.uploading ? "Uploading…" : "Upload"}
											</Button>
										</div>
										{up.error && <p className="text-xs text-destructive">{up.error}</p>}
									</div>
								)}
							</CardContent>
						)}
					</Card>
				);
			})}

			{/* ── Add new section ── */}
			{addingNew ? (
				<Card className="border-dashed border-2 border-border">
					<CardContent className="p-4 space-y-3">
						<Input
							placeholder="Section title *"
							value={newTitle}
							onChange={(e) => setNewTitle(e.target.value)}
							autoFocus
							onKeyDown={(e) => {
								if (e.key === "Escape") setAddingNew(false);
							}}
						/>
						<Textarea
							placeholder="Description (optional)"
							rows={2}
							value={newDesc}
							onChange={(e) => setNewDesc(e.target.value)}
						/>
						<p className="text-xs text-muted-foreground">
							You can upload materials after the section is created.
						</p>
						<div className="flex gap-2">
							<Button size="sm" onClick={saveNewSection} disabled={newSaving || !newTitle.trim()}>
								{newSaving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
								Create Section
							</Button>
							<Button size="sm" variant="ghost" onClick={() => setAddingNew(false)}>
								Cancel
							</Button>
						</div>
					</CardContent>
				</Card>
			) : (
				<Button variant="outline" size="lg" className="w-full" onClick={() => setAddingNew(true)}>
					<Plus className="mr-1.5 h-4 w-4" />
					Add Section
				</Button>
			)}
		</div>
	);
}
