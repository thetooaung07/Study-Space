"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Loader2, Trash2, GitFork, BookOpen, MoreHorizontal, ArrowLeft, Compass } from "lucide-react";
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
import { workspacesApi } from "@/lib/workspace-api";
import { useAuth } from "@/context/auth-context";
import type { StudentWorkspace, WorkspaceSpace } from "@/types/workspaces";
import Link from "next/link";

export default function WorkspaceDetailPage() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();
	const { user } = useAuth();
	const [workspace, setWorkspace] = useState<StudentWorkspace | null>(null);
	const [spaces, setSpaces] = useState<WorkspaceSpace[]>([]);
	const [loading, setLoading] = useState(true);

	// Create space
	const [showCreate, setShowCreate] = useState(false);
	const [title, setTitle] = useState("");
	const [desc, setDesc] = useState("");
	const [creating, setCreating] = useState(false);

	// Initial load is handled by refresh() which is called in a consolidated effect below

	// Since the workspace DTO only returns spaceCount (not the spaces array),
	// we need a mechanism. Let me create a simpler approach: the workspace detail
	// page creates/forks spaces and navigates to them. We list spaces by
	// re-fetching. For now, I'll track spaces locally.

	// Refresh workspace + spaces
	const refresh = async () => {
		if (!user) return;
		setLoading(true);
		try {
			const [ws, ss] = await Promise.all([
				workspacesApi.getById(Number(id)),
				workspacesApi.getSpaces(Number(id)),
			]);
			setWorkspace(ws);
			setSpaces(ss);
		} catch (e: any) {
			console.error("Refresh failed", e);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		refresh();
	}, [id, user]);

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

	const handleDeleteSpace = async (spaceId: number) => {
		if (!user || !confirm("Delete this space and all its contents?")) return;
		try {
			await workspacesApi.deleteSpace(spaceId, user.id);
			setSpaces((prev) => prev.filter((s) => s.id !== spaceId));
			setWorkspace((prev) => (prev ? { ...prev, spaceCount: Math.max(0, prev.spaceCount - 1) } : prev));
		} catch (e: any) {
			alert(e.message);
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
					<div className="p-6 max-w-5xl mx-auto space-y-6">
						{/* Back + Title */}
						<div>
							<Button variant="ghost" size="sm" className="mb-2" asChild>
								<Link href="/workspaces">
									<ArrowLeft className="mr-1.5 h-4 w-4" />
									Back to Workspaces
								</Link>
							</Button>
							<div className="flex items-start justify-between">
								<div>
									<h1 className="text-2xl font-bold text-foreground">{workspace.name}</h1>
									{workspace.description && (
										<p className="text-sm text-muted-foreground mt-1">{workspace.description}</p>
									)}
									<p className="text-xs text-muted-foreground mt-1">
										{workspace.spaceCount} {workspace.spaceCount === 1 ? "space" : "spaces"}
									</p>
								</div>
								<div className="flex gap-2">
									{/* Create from scratch */}
									<Dialog open={showCreate} onOpenChange={setShowCreate}>
										<DialogTrigger asChild>
											<Button variant="outline" size="sm">
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

									<Button size="sm" asChild>
										<Link href="/courses">
											<Compass className="mr-1.5 h-4 w-4" />
											Explore Courses
										</Link>
									</Button>
								</div>
							</div>
						</div>

						{/* Spaces Grid */}
						{spaces.length === 0 && workspace.spaceCount === 0 ? (
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
											<div className="flex items-start justify-between">
												<div>
													<h3 className="font-semibold text-foreground text-sm">
														{space.title}
													</h3>
													<div className="flex items-center gap-1.5 mt-1">
														{space.forkedFromCourseTitle && (
															<Badge variant="secondary" className="text-[10px]">
																<GitFork className="mr-1 h-3 w-3" />
																{space.forkedFromCourseTitle}
															</Badge>
														)}
														<Badge variant="outline" className="text-[10px]">
															{space.sections.length} sections
														</Badge>
													</div>
												</div>
												<DropdownMenu>
													<DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
														<Button
															variant="ghost"
															size="icon"
															className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
														>
															<MoreHorizontal className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent
														align="end"
														onClick={(e) => e.stopPropagation()}
													>
														<DropdownMenuItem
															className="text-destructive"
															onClick={() => handleDeleteSpace(space.id)}
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
					</div>
				</main>
			</div>
		</div>
	);
}
