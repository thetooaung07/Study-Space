"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
	Plus,
	Loader2,
	Trash2,
	ChevronDown,
	ChevronRight,
	Upload,
	FileText,
	Presentation,
	Film,
	FileImage,
	File,
	ArrowLeft,
	Send,
	Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sidebar } from "@/components/common/sidebar";
import { Header } from "@/components/common/header";
import { workspacesApi } from "@/lib/workspace-api";
import { useAuth } from "@/context/auth-context";
import type { WorkspaceSpace } from "@/types/workspaces";
import type { MaterialType } from "@/types/courses";
import Link from "next/link";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ContextualChat } from "@/components/workspaces/contextual-chat";

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

const addMaterialToSpace = (space: WorkspaceSpace, sectionId: number, material: WorkspaceMaterial): WorkspaceSpace => ({
	...space,
	sections: space.sections.map(s => 
		s.id === sectionId 
			? { ...s, materials: [...s.materials, material] } 
			: s
	)
});

const removeMaterialFromSpace = (space: WorkspaceSpace, sectionId: number, materialId: number): WorkspaceSpace => ({
	...space,
	sections: space.sections.map(s => 
		s.id === sectionId 
			? { ...s, materials: s.materials.filter(m => m.id !== materialId) } 
			: s
	)
});

export default function SpaceManagePage() {
	const { id: workspaceId, spaceId } = useParams<{ id: string; spaceId: string }>();
	const { user } = useAuth();
	const [space, setSpace] = useState<WorkspaceSpace | null>(null);
	const [loading, setLoading] = useState(true);

	// Section creation
	const [showAddSection, setShowAddSection] = useState(false);
	const [sectionTitle, setSectionTitle] = useState("");
	const [sectionDesc, setSectionDesc] = useState("");
	const [addingSection, setAddingSection] = useState(false);

	// Material upload
	const [uploadSectionId, setUploadSectionId] = useState<number | null>(null);
	const [materialTitle, setMaterialTitle] = useState("");
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [uploading, setUploading] = useState(false);

	// Expanded sections
	const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

	// Section delete confirm
	const [deleteSectionId, setDeleteSectionId] = useState<number | null>(null);
	const [deleteSectionError, setDeleteSectionError] = useState("");
	const [deletingSection, setDeletingSection] = useState(false);

	// Material delete confirm
	const [deleteMaterialConfig, setDeleteMaterialConfig] = useState<{ materialId: number; sectionId: number } | null>(
		null,
	);
	const [deleteMaterialError, setDeleteMaterialError] = useState("");
	const [deletingMaterial, setDeletingMaterial] = useState(false);

	const fetchSpace = useCallback(async () => {
		try {
			const s = await workspacesApi.getSpace(Number(spaceId));
			setSpace(s);
			// Expand all sections that have materials to avoid confusion
			const idsWithMaterials = s.sections.filter((sec) => sec.materials.length > 0).map((sec) => sec.id);
			setExpandedIds(
				new Set(idsWithMaterials.length > 0 ? idsWithMaterials : [s.sections[0]?.id].filter(Boolean)),
			);
		} catch (e: any) {
			alert(e.message);
		} finally {
			setLoading(false);
		}
	}, [spaceId]);

	useEffect(() => {
		fetchSpace();
	}, [fetchSpace]);

	const toggleExpanded = (id: number) =>
		setExpandedIds((prev) => {
			const next = new Set(prev);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});

	const handleAddSection = async () => {
		if (!user || !sectionTitle.trim()) return;
		setAddingSection(true);
		try {
			const section = await workspacesApi.addSection(Number(spaceId), user.id, {
				title: sectionTitle.trim(),
				description: sectionDesc.trim() || undefined,
			});
			setSpace((prev) =>
				prev
					? { ...prev, sections: [...prev.sections, { ...section, materials: section.materials || [] }] }
					: prev,
			);
			setShowAddSection(false);
			setSectionTitle("");
			setSectionDesc("");
			setExpandedIds((prev) => new Set([...prev, section.id]));
		} catch (e: any) {
			alert(e.message);
		} finally {
			setAddingSection(false);
		}
	};

	const handleDeleteSection = async () => {
		if (!user || !deleteSectionId) return;
		setDeletingSection(true);
		setDeleteSectionError("");
		try {
			await workspacesApi.deleteSection(deleteSectionId, user.id);
			setSpace((prev) =>
				prev ? { ...prev, sections: prev.sections.filter((s) => s.id !== deleteSectionId) } : prev,
			);
			setDeleteSectionId(null);
		} catch (e: any) {
			setDeleteSectionError(e.message ?? "Failed to delete section.");
		} finally {
			setDeletingSection(false);
		}
	};

	const handleUpload = async () => {
		if (!user || !uploadSectionId || !selectedFile || !materialTitle.trim()) return;
		setUploading(true);
		try {
			const material = await workspacesApi.uploadMaterial(
				uploadSectionId,
				user.id,
				materialTitle.trim(),
				selectedFile,
			);
			setSpace((prev) => (prev ? addMaterialToSpace(prev, uploadSectionId, material) : prev));
			setUploadSectionId(null);
			setMaterialTitle("");
			setSelectedFile(null);
		} catch (e: any) {
			alert(e.message);
		} finally {
			setUploading(false);
		}
	};

	const handleDeleteMaterial = async () => {
		if (!user || !deleteMaterialConfig) return;
		setDeletingMaterial(true);
		setDeleteMaterialError("");
		try {
			await workspacesApi.deleteMaterial(deleteMaterialConfig.materialId, user.id);
			setSpace((prev) =>
				prev ? removeMaterialFromSpace(prev, deleteMaterialConfig.sectionId, deleteMaterialConfig.materialId) : prev
			);
			setDeleteMaterialConfig(null);
		} catch (e: any) {
			setDeleteMaterialError(e.message ?? "Failed to delete material.");
		} finally {
			setDeletingMaterial(false);
		}
	};

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

	if (!space || !user) return null;

	return (
		<div className="flex h-screen bg-background">
			<Sidebar />
			<div className="flex flex-col flex-1 overflow-hidden">
				<Header />
				<main className="flex-1 flex overflow-hidden">
					<div className="flex-1 overflow-auto p-6 max-w-5xl mx-auto space-y-6">
						{/* Header */}
						<div>
							<Button variant="ghost" size="sm" className="mb-2" asChild>
								<Link href={`/workspaces/${workspaceId}`}>
									<ArrowLeft className="mr-1.5 h-4 w-4" />
									Back to Workspace
								</Link>
							</Button>
							<div className="flex items-start justify-between">
								<div>
									<div className="flex items-center gap-2">
										<h1 className="text-2xl font-bold text-foreground">{space.title}</h1>
										{space.forkedFromCourseTitle && space.forkedFromCourseId && (
											<Link href={`/courses/${space.forkedFromCourseId}`}>
												<Badge
													variant="secondary"
													className="text-xs hover:bg-secondary/80 transition-colors cursor-pointer hover:underline"
												>
													<Link2 className="mr-1 h-3 w-3" />
													Cloned from {space.forkedFromCourseTitle}
												</Badge>
											</Link>
										)}
									</div>
									{space.description && (
										<p className="text-sm text-muted-foreground mt-1">{space.description}</p>
									)}
									<p className="text-xs text-muted-foreground mt-1">
										{space.sections.length} sections ·{" "}
										{space.sections.reduce((sum, s) => sum + s.materials.length, 0)} materials
									</p>
								</div>
								<div className="flex gap-2">
									{space.forkedFromCourseId && (
										<Button size="sm" asChild>
											<Link href={`/workspaces/${workspaceId}/spaces/${spaceId}/propose`}>
												<Send className="mr-1.5 h-4 w-4" />
												Propose Contribution
											</Link>
										</Button>
									)}
								</div>
							</div>
						</div>

						{/* Sections */}
						<div className="space-y-2 mb-3">
							{space.sections.length === 0 ? (
								<p className="text-sm text-muted-foreground py-4">
									No sections yet. Add one to get started.
								</p>
							) : (
								space.sections.map((section, idx) => {
									const isExpanded = expandedIds.has(section.id);
									return (
										<Card key={section.id} className="border-border overflow-hidden gap-0 py-0">
											{/* Section Header */}
											<CardHeader
												className={`px-4 pt-5 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors ${isExpanded ? "pb-1" : "pb-3"}`}
												onClick={() => toggleExpanded(section.id)}
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
														{/* Show description below title */}
														{section.description && (
															<p
																className={`text-xs text-muted-foreground mt-1.5 ml-5 ${!isExpanded ? "line-clamp-2" : ""}`}
															>
																{section.description}
															</p>
														)}
													</div>
													<div className="flex items-center gap-1 px-2 shrink-0">
														<Button
															variant="ghost"
															size="icon"
															className="h-7 w-7"
															onClick={(e) => {
																e.stopPropagation();
																setUploadSectionId(section.id);
																setExpandedIds(
																	(prev) => new Set([...prev, section.id]),
																);
															}}
														>
															<Upload className="h-3.5 w-3.5" />
														</Button>
														<Button
															variant="ghost"
															size="icon"
															className="h-7 w-7 hover:text-destructive transition-all"
															onClick={(e) => {
																e.stopPropagation();
																setDeleteSectionId(section.id);
															}}
														>
															<Trash2 className="h-3.5 w-3.5 text-destructive" />
														</Button>
													</div>
												</div>
											</CardHeader>

											{/* Section Content */}
											{isExpanded && (
												<CardContent className="px-4 pb-4 pt-1 space-y-2 border-t border-border bg-muted/20">
													{/* Upload form inline */}
													{uploadSectionId === section.id && (
														<Card className="bg-card mt-2 mb-3">
															<CardContent className="p-3 space-y-3">
																<div className="space-y-2">
																	<Label className="text-xs">Material Title</Label>
																	<Input
																		placeholder="e.g. Lecture Slides Week 1"
																		value={materialTitle}
																		onChange={(e) =>
																			setMaterialTitle(e.target.value)
																		}
																		className="h-8 text-sm"
																	/>
																</div>
																<div className="space-y-2">
																	<Label className="text-xs">File</Label>
																	<Input
																		type="file"
																		onChange={(e) =>
																			setSelectedFile(e.target.files?.[0] || null)
																		}
																		className="h-8 text-sm"
																	/>
																</div>
																<div className="flex gap-2">
																	<Button
																		size="sm"
																		onClick={handleUpload}
																		disabled={
																			uploading ||
																			!selectedFile ||
																			!materialTitle.trim()
																		}
																	>
																		{uploading && (
																			<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
																		)}
																		Upload
																	</Button>
																	<Button
																		size="sm"
																		variant="ghost"
																		onClick={() => {
																			setUploadSectionId(null);
																			setMaterialTitle("");
																			setSelectedFile(null);
																		}}
																	>
																		Cancel
																	</Button>
																</div>
															</CardContent>
														</Card>
													)}

													{/* Materials list */}
													{section.materials.length === 0 ? (
														<p className="text-xs text-muted-foreground italic py-1">
															No materials in this section.
														</p>
													) : (
														<div className="space-y-1 mt-2">
															{section.materials.map((m) => (
																<div
																	key={m.id}
																	className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-1.5"
																>
																	<MaterialIcon type={m.fileType} />
																	<a
																		href={`http://localhost:8080/api/files/download?materialId=${m.id}&type=WORKSPACE&token=${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`}
																		target="_blank"
																		rel="noopener noreferrer"
																		className="flex-1 truncate text-sm hover:underline hover:text-primary transition-colors"
																		title={m.title}
																	>
																		{m.title}
																	</a>
																	{m.isReference && (
																		<Badge
																			variant="outline"
																			className="text-[10px] px-1.5 py-0 hidden sm:inline-flex bg-background"
																		>
																			<Link2 className="mr-1 h-2.5 w-2.5" />
																			ref
																		</Badge>
																	)}
																	<button
																		onClick={() =>
																			setDeleteMaterialConfig({
																				materialId: m.id,
																				sectionId: section.id,
																			})
																		}
																		title="Delete material"
																		className="text-destructive  transition-colors ml-2"
																	>
																		<Trash2 className="h-3.5 w-3.5" />
																	</button>
																</div>
															))}
														</div>
													)}
												</CardContent>
											)}
										</Card>
									);
								})
							)}
						</div>

						{/* Add Section */}
						<div className="flex items-center gap-2 w-full">
							<Dialog open={showAddSection} onOpenChange={setShowAddSection}>
								<DialogTrigger asChild>
									<Button variant="outline" className="w-full h-10">
										<Plus className="mr-1.5 h-4 w-4" />
										Add Section
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>Add Section</DialogTitle>
									</DialogHeader>
									<div className="space-y-4 pt-2">
										<div className="space-y-2">
											<Label>Title</Label>
											<Input
												placeholder="e.g. Week 1 - Introduction"
												value={sectionTitle}
												onChange={(e) => setSectionTitle(e.target.value)}
											/>
										</div>
										<div className="space-y-2">
											<Label>Description (optional)</Label>
											<Textarea
												value={sectionDesc}
												onChange={(e) => setSectionDesc(e.target.value)}
												rows={2}
											/>
										</div>
										<Button
											onClick={handleAddSection}
											disabled={addingSection || !sectionTitle.trim()}
											className="w-full"
										>
											{addingSection && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
											Add Section
										</Button>
									</div>
								</DialogContent>
							</Dialog>
						</div>
					</div>

					<ConfirmDialog
						open={deleteSectionId !== null}
						onOpenChange={(open) => {
							if (!open) {
								setDeleteSectionId(null);
								setDeleteSectionError("");
							}
						}}
						title="Delete section"
						description="This will permanently delete the section and all its materials. This action cannot be undone."
						confirmText="Delete"
						onConfirm={handleDeleteSection}
						loading={deletingSection}
						error={deleteSectionError}
						variant="destructive"
					/>
					<ConfirmDialog
						open={deleteMaterialConfig !== null}
						onOpenChange={(open) => {
							if (!open) {
								setDeleteMaterialConfig(null);
								setDeleteMaterialError("");
							}
						}}
						title="Delete material"
						description="This will permanently delete the material. This action cannot be undone."
						confirmText="Delete"
						onConfirm={handleDeleteMaterial}
						loading={deletingMaterial}
						error={deleteMaterialError}
						variant="destructive"
					/>

					<div className="shrink-0 hidden md:flex flex-col">
						<ContextualChat materials={space.sections.flatMap(s => s.materials)} />
					</div>
				</main>
			</div>
		</div>
	);
}
