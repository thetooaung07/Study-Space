"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen, Plus, Loader2, Trash2, MoreHorizontal } from "lucide-react";
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
import { useAuth } from "@/context/auth-context";
import type { StudentWorkspace } from "@/types/workspaces";

export default function WorkspacesPage() {
	const { user } = useAuth();
	const router = useRouter();
	const [workspaces, setWorkspaces] = useState<StudentWorkspace[]>([]);
	const [loading, setLoading] = useState(true);
	const [showCreate, setShowCreate] = useState(false);
	const [creating, setCreating] = useState(false);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");

	// Delete confirmation
	const [deleteTarget, setDeleteTarget] = useState<StudentWorkspace | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [deleteError, setDeleteError] = useState("");

	useEffect(() => {
		if (!user) return;
		workspacesApi
			.getMyWorkspaces(user.id)
			.then(setWorkspaces)
			.finally(() => setLoading(false));
	}, [user]);

	const handleCreate = async () => {
		if (!user || !name.trim()) return;
		setCreating(true);
		try {
			const ws = await workspacesApi.create(user.id, {
				name: name.trim(),
				description: description.trim() || undefined,
			});
			setWorkspaces((prev) => [...prev, ws]);
			setShowCreate(false);
			setName("");
			setDescription("");
		} catch (e: any) {
			alert(e.message);
		} finally {
			setCreating(false);
		}
	};

	const handleWorkspaceClick = (ws: StudentWorkspace) => {
		router.push(`/workspaces/${ws.id}`);
	};

	const handleDeleteConfirm = async () => {
		if (!user || !deleteTarget) return;
		setDeleting(true);
		setDeleteError("");
		try {
			await workspacesApi.delete(deleteTarget.id, user.id);
			setWorkspaces((prev) => prev.filter((w) => w.id !== deleteTarget.id));
			setDeleteTarget(null);
		} catch (e: any) {
			setDeleteError(e.message ?? "Failed to delete workspace.");
		} finally {
			setDeleting(false);
		}
	};

	return (
		<div className="flex h-screen bg-background">
			<Sidebar />
			<div className="flex flex-col flex-1 overflow-hidden">
				<Header />
				<main className="flex-1 overflow-auto">
					<div className="p-6 max-w-5xl mx-auto space-y-6">
						{/* Header */}
						<div className="flex items-center justify-between">
							<div>
								<h1 className="text-2xl font-bold text-foreground">My Workspaces</h1>
								<p className="text-sm text-muted-foreground mt-1">
									Create personal workspaces to organize notes, fork courses, and collaborate.
								</p>
							</div>
							<Dialog open={showCreate} onOpenChange={setShowCreate}>
								<DialogTrigger asChild>
									<Button>
										<Plus className="mr-1.5 h-4 w-4" />
										New Workspace
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>Create Workspace</DialogTitle>
									</DialogHeader>
									<div className="space-y-4 pt-2">
										<div className="space-y-2">
											<Label htmlFor="ws-name">Name</Label>
											<Input
												id="ws-name"
												placeholder="e.g. My Study Hub"
												value={name}
												onChange={(e) => setName(e.target.value)}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="ws-desc">Description (optional)</Label>
											<Textarea
												id="ws-desc"
												placeholder="What is this workspace for?"
												value={description}
												onChange={(e) => setDescription(e.target.value)}
												rows={3}
											/>
										</div>
										<Button
											onClick={handleCreate}
											disabled={creating || !name.trim()}
											className="w-full"
										>
											{creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
											Create Workspace
										</Button>
									</div>
								</DialogContent>
							</Dialog>
						</div>

						{/* Content */}
						{loading ? (
							<div className="flex items-center justify-center py-16">
								<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
							</div>
						) : workspaces.length === 0 ? (
							<Card className="border-dashed">
								<CardContent className="flex flex-col items-center justify-center py-16 text-center">
									<FolderOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
									<h3 className="text-lg font-medium text-foreground">No workspaces yet</h3>
									<p className="text-sm text-muted-foreground mt-1 max-w-sm">
										Create your first workspace to start organizing your study materials or fork a
										course to build on top of existing content.
									</p>
								</CardContent>
							</Card>
						) : (
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
								{workspaces.map((ws) => (
									<Card
										key={ws.id}
										className="cursor-pointer hover:border-primary/40 transition-colors group py-2 px-3"
										onClick={() => handleWorkspaceClick(ws)}
									>
										<CardContent className="p-5 space-y-3">
											<div className="flex items-start justify-between">
												<div className="flex items-center gap-2">
													<div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
														<FolderOpen className="h-4.5 w-4.5 text-primary" />
													</div>
													<div>
														<h3 className="font-semibold text-foreground text-sm leading-tight">
															{ws.name}
														</h3>
														<Badge variant="secondary" className="text-[10px] mt-0.5">
															{ws.spaceCount} {ws.spaceCount === 1 ? "space" : "spaces"}
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
															onClick={() => {
																setDeleteError("");
																setDeleteTarget(ws);
															}}
														>
															<Trash2 className="mr-2 h-4 w-4" />
															Delete
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</div>
											{ws.description && (
												<p className="text-xs text-muted-foreground line-clamp-2">
													{ws.description}
												</p>
											)}
											<p className="text-[11px] text-muted-foreground tabular-nums">
												Created{" "}
												{new Intl.DateTimeFormat("en-US", {
													month: "short",
													day: "numeric",
													year: "numeric",
												}).format(new Date(ws.createdAt))}
											</p>
										</CardContent>
									</Card>
								))}
							</div>
						)}
					</div>
				</main>
			</div>
			<ConfirmDialog
				open={!!deleteTarget}
				onOpenChange={(open) => {
					if (!open) {
						setDeleteTarget(null);
						setDeleteError("");
					}
				}}
				title="Delete Workspace"
				description={
					<>
						Are you sure you want to delete{" "}
						<span className="font-medium text-foreground">{deleteTarget?.name}</span>? This will permanently
						remove the workspace and all its spaces and contents.
					</>
				}
				confirmText="Delete workspace"
				onConfirm={handleDeleteConfirm}
				loading={deleting}
				error={deleteError}
				variant="destructive"
			/>
		</div>
	);
}
