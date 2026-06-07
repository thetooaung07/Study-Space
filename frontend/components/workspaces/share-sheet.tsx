"use client";

import { useState } from "react";
import { X, Copy, Check, RefreshCw, Trash2, ToggleLeft, ToggleRight, Users } from "lucide-react";
import { api } from "@/lib/api";
import { ShareSettingsDTO, WorkspaceSpaceDTO } from "@/types";

interface SpaceGuestEntry {
	id: number;
	username: string;
	fullName: string;
	profilePictureUrl?: string;
}

interface ShareSheetProps {
	space: WorkspaceSpaceDTO;
	userId: number;
	onClose: () => void;
	onUpdated: (updated: WorkspaceSpaceDTO) => void;
}

export function ShareSheet({ space, userId, onClose, onUpdated }: ShareSheetProps) {
	const [settings, setSettings] = useState<ShareSettingsDTO>({
		sharingEnabled: space.sharingEnabled ?? false,
		inviteCode: space.inviteCode ?? null,
		guestCount: space.guestCount ?? 0,
	});
	const [copied, setCopied] = useState(false);
	const [loading, setLoading] = useState(false);
	const [guests, setGuests] = useState<SpaceGuestEntry[]>([]);
	const [guestsLoaded, setGuestsLoaded] = useState(false);

	async function toggleSharing() {
		setLoading(true);
		try {
			if (settings.sharingEnabled) {
				await api.post(`/workspaces/spaces/${space.id}/sharing/disable?userId=${userId}`, {});
				setSettings((s) => ({ ...s, sharingEnabled: false }));
			} else {
				const result = await api.post<ShareSettingsDTO>(
					`/workspaces/spaces/${space.id}/sharing/enable?userId=${userId}`,
					{}
				);
				setSettings(result);
			}
			onUpdated({ ...space, sharingEnabled: !settings.sharingEnabled });
		} finally {
			setLoading(false);
		}
	}

	async function regenerate() {
		setLoading(true);
		try {
			const result = await api.post<ShareSettingsDTO>(
				`/workspaces/spaces/${space.id}/sharing/regenerate?userId=${userId}`,
				{}
			);
			setSettings(result);
		} finally {
			setLoading(false);
		}
	}

	async function copyCode() {
		if (!settings.inviteCode) return;
		await navigator.clipboard.writeText(settings.inviteCode);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}

	async function removeGuest(guestUserId: number) {
		await api.delete(`/workspaces/spaces/${space.id}/guests/${guestUserId}?userId=${userId}`);
		setGuests((g) => g.filter((gg) => gg.id !== guestUserId));
		setSettings((s) => ({ ...s, guestCount: s.guestCount - 1 }));
	}

	return (
		<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
			{/* Backdrop */}
			<div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

			{/* Sheet */}
			<div className="relative z-10 bg-background border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
				{/* Header */}
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-semibold text-foreground">Share Space</h2>
					<button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
						<X className="h-4 w-4 text-muted-foreground" />
					</button>
				</div>

				{/* Sharing toggle */}
				<div className="flex items-center justify-between py-3 border-b border-border">
					<div>
						<p className="font-medium text-foreground">Enable sharing</p>
						<p className="text-sm text-muted-foreground">Allow others to join with an invite code</p>
					</div>
					<button
						onClick={toggleSharing}
						disabled={loading}
						className="text-primary transition-colors disabled:opacity-50"
						aria-label="Toggle sharing"
					>
						{settings.sharingEnabled ? (
							<ToggleRight className="h-8 w-8" />
						) : (
							<ToggleLeft className="h-8 w-8 text-muted-foreground" />
						)}
					</button>
				</div>

				{/* Invite code */}
				{settings.sharingEnabled && (
					<div className="space-y-2">
						<p className="text-sm font-medium text-foreground">Invite Code</p>
						<div className="flex items-center gap-2">
							<div className="flex-1 font-mono bg-muted px-4 py-2.5 rounded-lg text-foreground tracking-widest text-sm select-all">
								{settings.inviteCode ?? "—"}
							</div>
							<button
								onClick={copyCode}
								className="p-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
								title="Copy code"
							>
								{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
							</button>
							<button
								onClick={regenerate}
								disabled={loading}
								className="p-2.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition-colors disabled:opacity-50"
								title="Regenerate code"
							>
								<RefreshCw className="h-4 w-4" />
							</button>
						</div>
						<p className="text-xs text-muted-foreground">
							Share this code with friends. They can join from the Workspaces page.
						</p>
					</div>
				)}

				{/* Guest list */}
				{settings.sharingEnabled && (
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<p className="text-sm font-medium text-foreground flex items-center gap-1.5">
								<Users className="h-4 w-4" />
								Guests ({settings.guestCount})
							</p>
						</div>
						{settings.guestCount === 0 && (
							<p className="text-sm text-muted-foreground">No guests yet.</p>
						)}
						{guests.map((g) => (
							<div key={g.id} className="flex items-center justify-between py-1.5">
								<div className="flex items-center gap-2">
									{g.profilePictureUrl ? (
										<img src={g.profilePictureUrl} alt={g.fullName} className="w-7 h-7 rounded-full" />
									) : (
										<div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-semibold">
											{g.fullName.charAt(0)}
										</div>
									)}
									<span className="text-sm text-foreground">{g.fullName}</span>
								</div>
								<button
									onClick={() => removeGuest(g.id)}
									className="p-1.5 rounded hover:bg-destructive/10 text-destructive/70 hover:text-destructive transition-colors"
									title="Remove guest"
								>
									<Trash2 className="h-4 w-4" />
								</button>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
