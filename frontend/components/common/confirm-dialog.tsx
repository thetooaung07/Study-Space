import React from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: React.ReactNode;
	confirmText?: string;
	cancelText?: string;
	onConfirm: () => void;
	loading?: boolean;
	error?: string;
	variant?: "default" | "destructive";
}

export function ConfirmDialog({
	open,
	onOpenChange,
	title,
	description,
	confirmText = "Confirm",
	cancelText = "Cancel",
	onConfirm,
	loading = false,
	error,
	variant = "default",
}: Readonly<ConfirmDialogProps>) {
	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => {
				if (!isOpen) onOpenChange(false);
			}}
		>
			<DialogContent className="max-w-sm" aria-describedby={undefined}>
				<DialogHeader>
					<DialogTitle className={variant === "destructive" ? "flex items-center gap-2 text-destructive" : ""}>
						{variant === "destructive" && <AlertTriangle className="h-5 w-5" />}
						{title}
					</DialogTitle>
				</DialogHeader>
				<p className="text-sm text-muted-foreground">{description}</p>
				{error && <p className="text-xs text-destructive">{error}</p>}
				<div className="flex gap-2 mt-2">
					<Button
						variant="outline"
						className="flex-1 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-transparent"
						onClick={() => onOpenChange(false)}
						disabled={loading}
						autoFocus={false}
					>
						{cancelText}
					</Button>
					<Button
						variant={variant === "destructive" ? "destructive" : "default"}
						className="flex-1 gap-2"
						onClick={onConfirm}
						disabled={loading}
						autoFocus
					>
						{loading && <Loader2 className="h-4 w-4 animate-spin" />}
						{confirmText}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}