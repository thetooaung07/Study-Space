"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
	Search,
	Plus,
	Loader2,
	Trash2,
	GitFork,
	BookOpen,
	MoreHorizontal,
	ArrowLeft,
	Compass,
	Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sidebar } from "@/components/common/sidebar";
import { Header } from "@/components/common/header";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { workspacesApi } from "@/lib/workspace-api";
import { WORKSPACE_SPACES_PAGE_SIZE } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { StudentWorkspace, WorkspaceSpace } from "@/types/workspaces";
import { PaginationControls } from "@/components/common/pagination-controls";
import Link from "next/link";

export default function WorkspaceDetailPage() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();
	const { user } = useAuth();
	const [workspace, setWorkspace] = useState<StudentWorkspace | null>(null);
	const [spaces, setSpaces] = useState<WorkspaceSpace[]>([]);
	const [spacesPage, setSpacesPage] = useState(0);
	const [spacesTotalPages, setSpacesTotalPages] = useState(0);
	const [loading, setLoading] = useState(true);
	const [loadingSpaces, setLoadingSpaces] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [inputValue, setInputValue] = useState("");

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		setSearchQuery(inputValue);
		setSpacesPage(0);
	};

	// Create space
	const [showCreate, setShowCreate] = useState(false);
	const [title, setTitle] = useState("");
	const [desc, setDesc] = useState("");
	const [creating, setCreating] = useState(false);

	// Edit space
	const [editSpaceTarget, setEditSpaceTarget] = useState<WorkspaceSpace | null>(null);
	const [editSpaceTitle, setEditSpaceTitle] = useState("");
	const [editSpaceDesc, setEditSpaceDesc] = useState("");
	const [editingSpace, setEditingSpace] = useState(false);

	// Initial load is handled by refresh() which is called in a consolidated effect below

	// Since the workspace DTO only returns spaceCount (not the spaces array),
	// we need a mechanism. Let me create a simpler approach: the workspace detail
	// page creates/forks spaces and navigates to them. We list spaces by
	// re-fetching. For now, I'll track spaces locally.

	// Refresh workspace details
	const refreshWorkspace = async () => {
		if (!user) return;
		try {
			const ws = await workspacesApi.getById(Number(id), user.id);
			if (ws.ownerId !== user.id) {
				router.push("/workspaces");
				return;
			}
			setWorkspace(ws);
		} catch (e: any) {
			console.error("Refresh workspace failed", e);
			router.push("/workspaces");
		} finally {
			setLoading(false);
		}
	};

	// Fetch paginated spaces
	const fetchSpaces = async () => {
		if (!user) return;
		setLoadingSpaces(true);
		try {
			const res = await workspacesApi.getSpaces(
				Number(id),
				user.id,
				spacesPage,
				WORKSPACE_SPACES_PAGE_SIZE,
				searchQuery || undefined,
			);
			setSpaces(res.content);
			setSpacesTotalPages(res.totalPages);
		} catch (e: any) {
			console.error("Fetch spaces failed", e);
		} finally {
			setLoadingSpaces(false);
		}
	};

	useEffect(() => {
		refreshWorkspace();
	}, [id, user]);

	useEffect(() => {
		fetchSpaces();
	}, [id, user, spacesPage, searchQuery]);

	const handleCreateSpace = async () => {
		if (!user || !title.trim()) return;
		setCreating(true);
		try {
			const space = await workspacesApi.createSpace(Number(id), user.id, {
				title: title.trim(),
				description: desc.trim() || undefined,
			});
			setSpaces((prev) => [...prev, space]);
			setWorkspace((prev) => (prev ? { ...prev, spaceCount: prev.spaceCount + 1 } : prev));
			setShowCreate(false);
			setTitle("");
			setDesc("");
		} catch (e: any) {
			alert(e.message);
		} finally {
			setCreating(false);
		}
	};

	const handleEditSpace = async () => {
		if (!user || !editSpaceTarget || !editSpaceTitle.trim()) return;
		setEditingSpace(true);
		try {
			const updatedSpace = await workspacesApi.updateSpace(editSpaceTarget.id, user.id, {
				title: editSpaceTitle.trim(),
				description: editSpaceDesc.trim() || undefined,
			});
			setSpaces((prev) => prev.map((s) => (s.id === updatedSpace.id ? updatedSpace : s)));
			setEditSpaceTarget(null);
		} catch (e: any) {
			alert(e.message);
		} finally {
			setEditingSpace(false);
		}
	};

	const [deleteSpaceTarget, setDeleteSpaceTarget] = useState<number | null>(null);

	const executeDeleteSpace = async () => {
		if (!user || !deleteSpaceTarget) return;
		try {
			await workspacesApi.deleteSpace(deleteSpaceTarget, user.id);
			setSpaces((prev) => prev.filter((s) => s.id !== deleteSpaceTarget));
			setWorkspace((prev) => (prev ? { ...prev, spaceCount: Math.max(0, prev.spaceCount - 1) } : prev));
		} catch (e: any) {
			alert(e.message);
		} finally {
			setDeleteSpaceTarget(null);
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

	if (!workspace || !user) return null;

	return (
		<div className="flex h-screen bg-background">
			<Sidebar />
			<div className="flex flex-col flex-1 overflow-hidden">
				<Header />
				<main className="flex-1 overflow-auto">
					<div className="p-6 max-w-6xl mx-auto space-y-6">
						{/* Back + Title */}
						<div>
							<Button variant="ghost" size="sm" className="mb-2" asChild>
								<Link href="/workspaces">
									<ArrowLeft className="mr-1.5 h-4 w-4" />
									Back to Workspaces
								</Link>
							</Button>
							<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
								<div>
									<h1 className="text-2xl font-bold text-foreground">{workspace.name}</h1>
									{workspace.description && (
										<p className="text-sm text-muted-foreground mt-1">{workspace.description}</p>
									)}
									<p className="text-xs text-muted-foreground mt-1">
										{workspace.spaceCount} {workspace.spaceCount === 1 ? "space" : "spaces"}
									</p>
								</div>
								<form
									onSubmit={handleSearch}
									className="flex gap-2 w-full sm:w-auto flex-col sm:flex-row"
								>
									<div className="relative flex-1 sm:w-64">
										<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
										<Input
											placeholder="Search spaces…"
											value={inputValue}
											onChange={(e) => setInputValue(e.target.value)}
											className="pl-9 bg-input w-full"
										/>
									</div>
									<div className="flex gap-2">
										<Button asChild className="max-h-9" variant="outline">
											<Link href="/courses">
												<Compass className="mr-1.5 h-4 w-4" />
												Explore Courses
											</Link>
										</Button>

										<Dialog open={showCreate} onOpenChange={setShowCreate}>
											<DialogTrigger asChild>
												<Button>
													<Plus className="mr-1.5 h-4 w-4" />
													New Space
												</Button>
											</DialogTrigger>
											<DialogContent>
												<DialogHeader>
													<DialogTitle>Create New Space</DialogTitle>
												</DialogHeader>
												<div className="space-y-4 pt-2">
													<div className="space-y-2">
														<Label>Title</Label>
														<Input
															placeholder="e.g. Operating Systems Notes"
															value={title}
															onChange={(e) => setTitle(e.target.value)}
														/>
													</div>
													<div className="space-y-2">
														<Label>Description (optional)</Label>
														<Textarea
															placeholder="What is this space for?"
															value={desc}
															onChange={(e) => setDesc(e.target.value)}
															rows={3}
														/>
													</div>
													<Button
														onClick={handleCreateSpace}
														disabled={creating || !title.trim()}
														className="w-full"
													>
														{creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
														Create Space
													</Button>
												</div>
											</DialogContent>
										</Dialog>
									</div>
								</form>
							</div>
						</div>

						{/* Spaces Grid */}
						{loadingSpaces ? (
							<div className="flex justify-center items-center py-12">
								<div className="text-sm text-muted-foreground animate-pulse flex items-center gap-2">
									<Loader2 className="h-4 w-4 animate-spin" />
									Loading spaces...
								</div>
							</div>
						) : spaces.length === 0 && workspace.spaceCount === 0 ? (
							<Card className="border-dashed">
								<CardContent className="flex flex-col items-center justify-center py-16 text-center">
									<BookOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
									<h3 className="text-lg font-medium text-foreground">No spaces yet</h3>
									<p className="text-sm text-muted-foreground mt-1 max-w-sm">
										Create a new space from scratch or fork an existing course to get started.
									</p>
								</CardContent>
							</Card>
						) : (
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
								{spaces.map((space) => (
									<Card
										key={space.id}
										className="cursor-pointer hover:border-primary/40 transition-colors group py-2 px-3"
										onClick={() => router.push(`/workspaces/${id}/spaces/${space.id}`)}
									>
										<CardContent className="p-5 space-y-3">
											<div className="flex items-center justify-between gap-2">
												<div className="min-w-0 flex-1">
													<h3
														className="font-semibold text-foreground text-sm truncate"
														title={space.title}
													>
														{space.title}
													</h3>
													<div className="flex flex-wrap items-center gap-1.5 mt-1">
														{space.forkedFromCourseTitle && (
															<Badge variant="secondary" className="text-[10px]">
																<GitFork className="mr-1 h-3 w-3" />
																{space.forkedFromCourseTitle}
															</Badge>
														)}
														<Badge variant="outline" className="text-[10px] shrink-0">
															{space.sections.length} sections
														</Badge>
													</div>
												</div>
												<DropdownMenu>
													<DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
														<Button
															variant="ghost"
															size="icon"
															className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity -mt-0.5 shrink-0"
														>
															<MoreHorizontal className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent
														align="end"
														onClick={(e) => e.stopPropagation()}
													>
														<DropdownMenuItem
															onClick={() => {
																setEditSpaceTitle(space.title);
																setEditSpaceDesc(space.description || "");
																setEditSpaceTarget(space);
															}}
														>
															<Pencil className="mr-2 h-4 w-4" />
															Edit
														</DropdownMenuItem>
														<DropdownMenuItem
															className="text-destructive focus:text-destructive"
															onClick={() => setDeleteSpaceTarget(space.id)}
														>
															<Trash2 className="mr-2 h-4 w-4" />
															Delete
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</div>
											{space.description && (
												<p className="text-xs text-muted-foreground line-clamp-2">
													{space.description}
												</p>
											)}
										</CardContent>
									</Card>
								))}
							</div>
						)}
						<PaginationControls
							currentPage={spacesPage}
							totalPages={spacesTotalPages}
							onPageChange={setSpacesPage}
						/>
					</div>
				</main>
			</div>

			<Dialog
				open={!!editSpaceTarget}
				onOpenChange={(open) => {
					if (!open) setEditSpaceTarget(null);
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Space</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 pt-2">
						<div className="space-y-2">
							<Label htmlFor="edit-space-title">Title</Label>
							<Input
								id="edit-space-title"
								placeholder="e.g. Operating Systems Notes"
								value={editSpaceTitle}
								onChange={(e) => setEditSpaceTitle(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="edit-space-desc">Description (optional)</Label>
							<Textarea
								id="edit-space-desc"
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
								(editSpaceTitle.trim() === editSpaceTarget?.title &&
									editSpaceDesc.trim() === (editSpaceTarget?.description || ""))
							}
							className="w-full"
						>
							{editingSpace && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Save Changes
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		<ConfirmDialog
				open={deleteSpaceTarget !== null}
				onOpenChange={(open) => !open && setDeleteSpaceTarget(null)}
				title="Delete Space"
				description="Are you sure you want to permanently delete this space and all its contents? This action cannot be undone."
				confirmText="Delete"
				variant="destructive"
				onConfirm={executeDeleteSpace}
			/>
		</div>
	);
}
