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
	Send,
	Link2,
	Users,
	ArrowLeft,
	Download,
	Pencil,
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
import { API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { WorkspaceSpace, WorkspaceMaterial } from "@/types/workspaces";
import type { MaterialType } from "@/types/courses";
import Link from "next/link";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ContextualChat } from "@/components/workspaces/contextual-chat";
import { ShareSheet } from "@/components/workspaces/share-sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { MemberChat } from "@/components/workspaces/member-chat";
import { GroupMembers } from "@/components/workspaces/group-members";
import { toast } from "sonner";

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
	sections: space.sections.map((s) => (s.id === sectionId ? { ...s, materials: [...s.materials, material] } : s)),
});

const removeMaterialFromSpace = (space: WorkspaceSpace, sectionId: number, materialId: number): WorkspaceSpace => ({
	...space,
	sections: space.sections.map((s) =>
		s.id === sectionId ? { ...s, materials: s.materials.filter((m) => m.id !== materialId) } : s,
	),
});

export default function SpaceManagePage() {
	const { id: workspaceId, spaceId } = useParams<{ id: string; spaceId: string }>();
	const { user } = useAuth();
	const [space, setSpace] = useState<WorkspaceSpace | null>(null);
	const [loading, setLoading] = useState(true);

	// Sharing
	const [showShare, setShowShare] = useState(false);

	// Space Edit
	const [showEditSpace, setShowEditSpace] = useState(false);
	const [editSpaceTitle, setEditSpaceTitle] = useState("");
	const [editSpaceDesc, setEditSpaceDesc] = useState("");
	const [editingSpace, setEditingSpace] = useState(false);

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

	// Guest remove confirm
	const [removeGuestId, setRemoveGuestId] = useState<number | null>(null);
	const [removeGuestError, setRemoveGuestError] = useState("");
	const [removingGuest, setRemovingGuest] = useState(false);

	const fetchSpace = useCallback(async () => {
		if (!user) return;
		try {
			const s = await workspacesApi.getSpace(Number(spaceId), user.id);
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
	}, [spaceId, user]);

	const handleRemoveGuest = async () => {
		if (!space || !user || removeGuestId === null) return;
		setRemovingGuest(true);
		setRemoveGuestError("");
		try {
			await workspacesApi.removeGuest(space.id, removeGuestId, user.id);
			toast.success("Guest removed successfully");
			setRemoveGuestId(null);
			fetchSpace(); // Refresh space to update members
		} catch (error: any) {
			console.error("Failed to remove guest:", error);
			setRemoveGuestError(error.message || "Failed to remove guest");
		} finally {
			setRemovingGuest(false);
		}
	};

	const handleEditSpace = async () => {
		if (!user || !space || !editSpaceTitle.trim()) return;
		setEditingSpace(true);
		try {
			const updatedSpace = await workspacesApi.updateSpace(space.id, user.id, {
				title: editSpaceTitle.trim(),
				description: editSpaceDesc.trim() || undefined,
			});
			setSpace(updatedSpace);
			setShowEditSpace(false);
		} catch (e: any) {
			alert(e.message);
		} finally {
			setEditingSpace(false);
		}
	};

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
				prev
					? removeMaterialFromSpace(prev, deleteMaterialConfig.sectionId, deleteMaterialConfig.materialId)
					: prev,
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
					<ResizablePanelGroup direction="horizontal" className="flex-1">
						<ResizablePanel defaultSize={70} minSize={30}>
							<div className="h-full overflow-auto p-6 max-w-5xl mx-auto space-y-6">
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
											<div className="flex flex-wrap items-center gap-2">
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
												<p className="text-sm text-muted-foreground mt-1">
													{space.description}
												</p>
											)}
											<p className="text-xs text-muted-foreground mt-1">
												{space.sections.length} sections ·{" "}
												{space.sections.reduce((sum, s) => sum + s.materials.length, 0)}{" "}
												materials
											</p>
										</div>
										<div className="flex gap-2">
											{space.forkedFromCourseId && !space.isGuest && (
												<Button size="sm" asChild>
													<Link href={`/workspaces/${workspaceId}/spaces/${spaceId}/propose`}>
														<Send className="mr-1.5 h-4 w-4" />
														Propose Contribution
													</Link>
												</Button>
											)}
											{!space.isGuest && (
												<>
													<Button
														size="sm"
														variant="outline"
														onClick={() => setShowShare(true)}
													>
														<Users className="mr-1.5 h-4 w-4" />
														Share Space
													</Button>
													<Button
														size="sm"
														variant="outline"
														onClick={() => {
															setEditSpaceTitle(space.title);
															setEditSpaceDesc(space.description || "");
															setShowEditSpace(true);
														}}
													>
														<Pencil className="h-6 w-4" />
													</Button>
												</>
											)}
										</div>
									</div>
								</div>

								{showShare && (
									<ShareSheet
										space={space}
										userId={user.id}
										onClose={() => setShowShare(false)}
										onUpdated={(updatedSpace) => setSpace(updatedSpace as any)}
									/>
								)}

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
												<Card
													key={section.id}
													className="overflow-hidden transition-all duration-200 py-0 gap-0"
												>
													<div
														className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
														onClick={() => toggleExpanded(section.id)}
													>
														<div className="flex items-center gap-3">
															<Button variant="ghost" size="icon" className="h-6 w-6">
																{isExpanded ? (
																	<ChevronDown className="h-4 w-4 text-muted-foreground" />
																) : (
																	<ChevronRight className="h-4 w-4 text-muted-foreground" />
																)}
															</Button>
															<div>
																<div className="flex items-center gap-2">
																	<span className="font-semibold text-sm">
																		{idx + 1}. {section.title}
																	</span>
																	<Badge variant="outline" className="text-[10px]">
																		{section.materials.length} item
																		{section.materials.length !== 1 ? "s" : ""}
																	</Badge>
																</div>
																{section.description && (
																	<p className="text-xs text-muted-foreground mt-0.5 ml-1">
																		{section.description}
																	</p>
																)}
															</div>
														</div>
														<div className="flex items-center gap-1">
															{!space.isGuest && (
																<>
																	<Button
																		variant="ghost"
																		size="icon"
																		className="h-7 w-7 text-muted-foreground hover:text-primary"
																		onClick={(e) => {
																			e.stopPropagation();
																			if (uploadSectionId === section.id) {
																				setUploadSectionId(null);
																			} else {
																				setUploadSectionId(section.id);
																				setMaterialTitle("");
																				setSelectedFile(null);
																				setExpandedIds(
																					(prev) =>
																						new Set([...prev, section.id]),
																				);
																			}
																		}}
																	>
																		<Plus className="h-4 w-4" />
																	</Button>
																	<Button
																		variant="ghost"
																		size="icon"
																		className="h-7 w-7 text-muted-foreground hover:text-destructive"
																		onClick={(e) => {
																			e.stopPropagation();
																			setDeleteSectionError("");
																			setDeleteSectionId(section.id);
																		}}
																	>
																		<Trash2 className="h-4 w-4" />
																	</Button>
																</>
															)}
														</div>
													</div>

													{isExpanded && (
														<div className="border-t bg-muted/10 p-3 space-y-2">
															{section.materials.length === 0 ? (
																<p className="text-xs text-muted-foreground italic text-center py-2">
																	This section is empty.
																</p>
															) : (
																section.materials.map((m) => (
																	<div
																		key={m.id}
																		className="flex items-center justify-between p-2 rounded-md hover:bg-background border border-transparent hover:border-border transition-colors group"
																	>
																		<div className="flex items-center gap-3 min-w-0">
																			<div className="p-1.5 rounded-md bg-muted group-hover:bg-background border border-transparent group-hover:border-border">
																				<MaterialIcon type={m.fileType} />
																			</div>
																			<div className="min-w-0 flex-1">
																				<a
																					href={`${API_BASE_URL}/files/download?materialId=${
																						m.id
																					}&type=WORKSPACE&token=${
																						localStorage.getItem("token") ||
																						""
																					}`}
																					target="_blank"
																					rel="noopener noreferrer"
																					className="text-sm font-medium hover:underline hover:text-primary truncate block"
																				>
																					{m.title}
																				</a>
																				<div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
																					<span className="uppercase font-medium">
																						{m.fileType}
																					</span>
																					<span>•</span>
																					<span>
																						Added{" "}
																						{new Date(
																							m.uploadedAt,
																						).toLocaleDateString()}
																					</span>
																				</div>
																			</div>
																		</div>
																		<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
																			<Button
																				variant="outline"
																				size="sm"
																				className="h-7 text-xs"
																				asChild
																			>
																				<a
																					href={`${API_BASE_URL}/files/download?materialId=${
																						m.id
																					}&type=WORKSPACE&token=${
																						localStorage.getItem("token") ||
																						""
																					}`}
																					target="_blank"
																					rel="noopener noreferrer"
																				>
																					<Download className="mr-1.5 h-3 w-3" />
																					Download
																				</a>
																			</Button>
																			{!space.isGuest && (
																				<Button
																					variant="ghost"
																					size="icon"
																					className="h-7 w-7 text-muted-foreground hover:text-destructive"
																					onClick={() => {
																						setDeleteMaterialError("");
																						setDeleteMaterialConfig({
																							sectionId: section.id,
																							materialId: m.id,
																						});
																					}}
																				>
																					<Trash2 className="h-3.5 w-3.5" />
																				</Button>
																			)}
																		</div>
																	</div>
																))
															)}

															{!space.isGuest && uploadSectionId === section.id && (
																<div className="pt-2">
																	<div className="p-3 border border-dashed rounded-md bg-background/50 space-y-3">
																		<div className="flex justify-between items-center mb-1">
																			<Label className="text-xs font-semibold">
																				Upload Material
																			</Label>
																			<Button
																				variant="ghost"
																				size="sm"
																				className="h-5 px-2 text-[10px]"
																				onClick={() => setUploadSectionId(null)}
																			>
																				Cancel
																			</Button>
																		</div>
																		<Input
																			placeholder="Material Title"
																			value={materialTitle}
																			onChange={(e) =>
																				setMaterialTitle(e.target.value)
																			}
																			className="h-8 text-sm"
																		/>
																		<Input
																			type="file"
																			onChange={(e) =>
																				setSelectedFile(
																					e.target.files?.[0] || null,
																				)
																			}
																			className="text-xs file:h-full file:bg-transparent file:border-0"
																		/>
																		<Button
																			size="sm"
																			className="w-full h-8 text-xs"
																			onClick={handleUpload}
																			disabled={
																				uploading ||
																				!selectedFile ||
																				!materialTitle.trim()
																			}
																		>
																			{uploading ? (
																				<Loader2 className="mr-2 h-3 w-3 animate-spin" />
																			) : (
																				<Upload className="mr-2 h-3 w-3" />
																			)}
																			Upload
																		</Button>
																	</div>
																</div>
															)}
														</div>
													)}
												</Card>
											);
										})
									)}
								</div>

								{/* Add Section Button */}
								{!space.isGuest && (
									<div className="pt-2">
										<Dialog open={showEditSpace} onOpenChange={setShowEditSpace}>
											<DialogContent>
												<DialogHeader>
													<DialogTitle>Edit Space</DialogTitle>
												</DialogHeader>
												<div className="space-y-4 pt-2">
													<div className="space-y-2">
														<Label>Title</Label>
														<Input
															placeholder="e.g. Operating Systems Notes"
															value={editSpaceTitle}
															onChange={(e) => setEditSpaceTitle(e.target.value)}
														/>
													</div>
													<div className="space-y-2">
														<Label>Description (optional)</Label>
														<Textarea
															placeholder="What is this space for?"
															value={editSpaceDesc}
															onChange={(e) => setEditSpaceDesc(e.target.value)}
															rows={3}
														/>
													</div>
													<Button
														onClick={handleEditSpace}
														disabled={
															editingSpace ||
															!editSpaceTitle.trim() ||
															(editSpaceTitle.trim() === space.title &&
																editSpaceDesc.trim() === (space.description || ""))
														}
														className="w-full"
													>
														{editingSpace && (
															<Loader2 className="mr-2 h-4 w-4 animate-spin" />
														)}
														Save Changes
													</Button>
												</div>
											</DialogContent>
										</Dialog>

										<Dialog open={showAddSection} onOpenChange={setShowAddSection}>
											<DialogTrigger asChild>
												<Button
													variant="outline"
													className="w-full border-dashed bg-background/50 hover:bg-background"
												>
													<Plus className="mr-2 h-4 w-4 text-muted-foreground" />
													Add New Section
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
															placeholder="e.g. Week 1: Introduction"
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
														{addingSection && (
															<Loader2 className="mr-2 h-4 w-4 animate-spin" />
														)}
														Add Section
													</Button>
												</div>
											</DialogContent>
										</Dialog>
									</div>
								)}

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
								<ConfirmDialog
									open={removeGuestId !== null}
									onOpenChange={(open) => {
										if (!open) {
											setRemoveGuestId(null);
											setRemoveGuestError("");
										}
									}}
									title="Remove guest"
									description="Are you sure you want to remove this guest from the space? They will lose access immediately."
									confirmText="Remove"
									onConfirm={handleRemoveGuest}
									loading={removingGuest}
									error={removeGuestError}
									variant="destructive"
								/>
							</div>
						</ResizablePanel>

						<ResizableHandle withHandle className="hidden md:flex" />

						<ResizablePanel defaultSize={30} minSize={25} maxSize={50} className="hidden md:flex bg-card">
							<Tabs defaultValue="chat" className="flex flex-col h-full w-full">
								<div className="px-4 py-2 border-b border-border bg-muted/20">
									<TabsList className="w-full grid grid-cols-3">
										<TabsTrigger value="members" className="text-xs truncate px-1">
											Members
										</TabsTrigger>
										<TabsTrigger value="chat" className="text-xs truncate px-1">
											Chat
										</TabsTrigger>
										<TabsTrigger value="ai" className="text-xs truncate px-1">
											Ask AI
										</TabsTrigger>
									</TabsList>
								</div>

								<TabsContent
									value="members"
									className="flex-1 overflow-hidden m-0 data-[state=active]:flex flex-col"
								>
									<GroupMembers members={space.members || []} onRemoveGuest={setRemoveGuestId} />
								</TabsContent>

								<TabsContent
									value="chat"
									className="flex-1 overflow-hidden m-0 data-[state=active]:flex flex-col"
								>
									<MemberChat
										spaceId={space.id}
										materials={space.sections.flatMap((s) => s.materials)}
									/>
								</TabsContent>

								<TabsContent
									value="ai"
									className="flex-1 overflow-hidden m-0 data-[state=active]:flex flex-col"
								>
									<ContextualChat materials={space.sections.flatMap((s) => s.materials)} />
								</TabsContent>
							</Tabs>
						</ResizablePanel>
					</ResizablePanelGroup>
				</main>
			</div>
		</div>
	);
}
