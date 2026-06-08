"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen, Plus, Loader2, Trash2, MoreHorizontal, Users, Hash, ArrowRight, Pencil } from "lucide-react";
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
import type { StudentWorkspace, WorkspaceSpace } from "@/types/workspaces";

export default function WorkspacesPage() {
	const { user } = useAuth();
	const router = useRouter();

	const [workspaces, setWorkspaces] = useState<StudentWorkspace[]>([]);
	const [sharedSpaces, setSharedSpaces] = useState<WorkspaceSpace[]>([]);
	const [loading, setLoading] = useState(true);

	// Create workspace
	const [showCreate, setShowCreate] = useState(false);
	const [creating, setCreating] = useState(false);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");

	// Edit workspace
	const [editTarget, setEditTarget] = useState<StudentWorkspace | null>(null);
	const [editing, setEditing] = useState(false);
	const [editName, setEditName] = useState("");
	const [editDescription, setEditDescription] = useState("");

	// Join space
	const [showJoin, setShowJoin] = useState(false);
	const [joining, setJoining] = useState(false);
	const [inviteCode, setInviteCode] = useState("");

	// Delete workspace
	const [deleteTarget, setDeleteTarget] = useState<StudentWorkspace | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [deleteError, setDeleteError] = useState("");

	// Leave space
	const [leaveTarget, setLeaveTarget] = useState<WorkspaceSpace | null>(null);
	const [leaving, setLeaving] = useState(false);

	useEffect(() => {
		if (!user) return;
		Promise.all([workspacesApi.getMyWorkspaces(user.id), workspacesApi.getSharedSpaces(user.id)])
			.then(([wsRes, sharedRes]) => {
				setWorkspaces(wsRes);
				setSharedSpaces(sharedRes);
			})
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

	const handleEdit = async () => {
		if (!user || !editTarget || !editName.trim()) return;
		setEditing(true);
		try {
			const updatedWs = await workspacesApi.update(editTarget.id, user.id, {
				name: editName.trim(),
				description: editDescription.trim() || undefined,
			});
			setWorkspaces((prev) => prev.map((w) => (w.id === updatedWs.id ? updatedWs : w)));
			setEditTarget(null);
		} catch (e: any) {
			alert(e.message);
		} finally {
			setEditing(false);
		}
	};

	const handleJoin = async () => {
		if (!user || !inviteCode.trim()) return;
		setJoining(true);
		try {
			const space = await workspacesApi.joinSpace(user.id, inviteCode.trim());
			setSharedSpaces((prev) => {
				// Don't add if already exists
				if (prev.some((s) => s.id === space.id)) return prev;
				return [...prev, space];
			});
			setShowJoin(false);
			setInviteCode("");
			router.push(`/workspaces/${space.workspaceId}/spaces/${space.id}`); // jump directly into it
		} catch (e: any) {
			alert(e.message);
		} finally {
			setJoining(false);
		}
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

	const handleLeaveConfirm = async () => {
		if (!user || !leaveTarget) return;
		setLeaving(true);
		try {
			await workspacesApi.leaveSpace(leaveTarget.id, user.id);
			setSharedSpaces((prev) => prev.filter((s) => s.id !== leaveTarget.id));
			setLeaveTarget(null);
		} catch (e: any) {
			alert(e.message);
		} finally {
			setLeaving(false);
		}
	};

	return (
		<div className="flex h-screen bg-background">
			<Sidebar />
			<div className="flex flex-col flex-1 overflow-hidden">
				<Header />
				<main className="flex-1 overflow-auto">
					<div className="p-6 max-w-5xl mx-auto space-y-10">
						{/* Header area with actions */}
						<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
							<div>
								<h1 className="text-2xl font-bold text-foreground">Workspaces</h1>
								<p className="text-sm text-muted-foreground mt-1">
									Organize your materials, cloned courses, and collaborate with friends.
								</p>
							</div>
							<div className="flex items-center gap-2">
								<Dialog open={showJoin} onOpenChange={setShowJoin}>
									<DialogTrigger asChild>
										<Button variant="outline" className="gap-2">
											<Hash className="h-4 w-4" />
											Join via Code
										</Button>
									</DialogTrigger>
									<DialogContent>
										<DialogHeader>
											<DialogTitle>Join a Shared Space</DialogTitle>
										</DialogHeader>
										<div className="space-y-4 pt-2">
											<div className="space-y-2">
												<Label htmlFor="invite-code">Invite Code</Label>
												<Input
													id="invite-code"
													placeholder="e.g. SPACE-X1Y2Z3"
													value={inviteCode}
													onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
													className="font-mono uppercase tracking-wider"
												/>
											</div>
											<Button
												onClick={handleJoin}
												disabled={joining || !inviteCode.trim()}
												className="w-full"
											>
												{joining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
												Join Space
											</Button>
										</div>
									</DialogContent>
								</Dialog>

								<Dialog open={showCreate} onOpenChange={setShowCreate}>
									<DialogTrigger asChild>
										<Button className="gap-2">
											<Plus className="h-4 w-4" />
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
						</div>

						{loading ? (
							<div className="flex items-center justify-center py-16">
								<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
							</div>
						) : (
							<>
								{/* Shared Spaces Section */}
								{sharedSpaces.length > 0 && (
									<div className="space-y-4">
										<h2 className="text-lg font-semibold flex items-center gap-2">
											<Users className="h-5 w-5 text-primary" />
											Shared with me
										</h2>
										<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
											{sharedSpaces.map((space) => (
												<Card
													key={space.id}
													className="cursor-pointer hover:border-primary/40 transition-colors group py-2 px-3 bg-primary/5"
													onClick={() =>
														router.push(
															`/workspaces/${space.workspaceId}/spaces/${space.id}`,
														)
													}
												>
													<CardContent className="p-5 space-y-3">
														<div className="flex items-start justify-between">
															<div className="flex items-center gap-3">
																<div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
																	<Users className="h-4.5 w-4.5 text-primary" />
																</div>
																<div>
																	<h3 className="font-semibold text-foreground text-sm leading-tight">
																		{space.title}
																	</h3>
																	<Badge
																		variant="secondary"
																		className="text-[10px] mt-0.5"
																	>
																		{space.sections?.length || 0} sections
																	</Badge>
																</div>
															</div>
															<DropdownMenu>
																<DropdownMenuTrigger
																	asChild
																	onClick={(e) => e.stopPropagation()}
																>
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
																		onClick={() => setLeaveTarget(space)}
																	>
																		<ArrowRight className="mr-2 h-4 w-4" />
																		Leave Space
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
									</div>
								)}

								{/* My Workspaces Section */}
								<div className="space-y-4">
									<h2 className="text-lg font-semibold flex items-center gap-2">
										<FolderOpen className="h-5 w-5 text-muted-foreground" />
										My Workspaces
									</h2>

									{workspaces.length === 0 ? (
										<Card className="border-dashed">
											<CardContent className="flex flex-col items-center justify-center py-12 text-center">
												<FolderOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
												<h3 className="text-base font-medium text-foreground">
													No workspaces yet
												</h3>
												<p className="text-sm text-muted-foreground mt-1 max-w-sm">
													Create your first workspace to start organizing your study
													materials.
												</p>
											</CardContent>
										</Card>
									) : (
										<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
											{workspaces.map((ws) => (
												<Card
													key={ws.id}
													className="cursor-pointer hover:border-primary/40 transition-colors group py-2 px-3"
													onClick={() => router.push(`/workspaces/${ws.id}`)}
												>
													<CardContent className="p-5 space-y-3">
														<div className="flex items-start justify-between">
															<div className="flex items-center gap-3">
																<div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
																	<FolderOpen className="h-4.5 w-4.5 text-muted-foreground" />
																</div>
																<div>
																	<h3 className="font-semibold text-foreground text-sm leading-tight">
																		{ws.name}
																	</h3>
																	<Badge
																		variant="secondary"
																		className="text-[10px] mt-0.5"
																	>
																		{ws.spaceCount}{" "}
																		{ws.spaceCount === 1 ? "space" : "spaces"}
																	</Badge>
																</div>
															</div>
															<DropdownMenu>
																<DropdownMenuTrigger
																	asChild
																	onClick={(e) => e.stopPropagation()}
																>
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
																		onClick={() => {
																			setEditName(ws.name);
																			setEditDescription(ws.description || "");
																			setEditTarget(ws);
																		}}
																	>
																		<Pencil className="mr-2 h-4 w-4" />
																		Edit
																	</DropdownMenuItem>
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
							</>
						)}
					</div>
				</main>
			</div>

			<Dialog
				open={!!editTarget}
				onOpenChange={(open) => {
					if (!open) setEditTarget(null);
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Workspace</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 pt-2">
						<div className="space-y-2">
							<Label htmlFor="edit-ws-name">Name</Label>
							<Input
								id="edit-ws-name"
								placeholder="e.g. My Study Hub"
								value={editName}
								onChange={(e) => setEditName(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="edit-ws-desc">Description (optional)</Label>
							<Textarea
								id="edit-ws-desc"
								placeholder="What is this workspace for?"
								value={editDescription}
								onChange={(e) => setEditDescription(e.target.value)}
								rows={3}
							/>
						</div>
						<Button
							onClick={handleEdit}
							disabled={editing || !editName.trim() || (editName.trim() === editTarget?.name && editDescription.trim() === (editTarget?.description || ""))}
							className="w-full"
						>
							{editing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Save Changes
						</Button>
					</div>
				</DialogContent>
			</Dialog>

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

			<ConfirmDialog
				open={!!leaveTarget}
				onOpenChange={(open) => {
					if (!open) setLeaveTarget(null);
				}}
				title="Leave Shared Space"
				description={
					<>
						Are you sure you want to leave{" "}
						<span className="font-medium text-foreground">{leaveTarget?.title}</span>? You will lose access
						to its contents unless you are invited again.
					</>
				}
				confirmText="Leave Space"
				onConfirm={handleLeaveConfirm}
				loading={leaving}
				variant="destructive"
			/>
		</div>
	);
}
