"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { UserDTO } from "@/types";

export default function AuthCallbackPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { login } = useAuth();
	const processedRef = useRef(false);

	useEffect(() => {
		if (processedRef.current) return;

		const token = searchParams.get("token");

		if (token) {
			processedRef.current = true;

			const fetchUserAndLogin = async () => {
				try {
					api.setToken(token);
					const userData = await api.get<UserDTO>("/auth/me");
					window.history.replaceState(null, "", "/auth/login");
					login(token, userData);
					toast.success("Successfully logged in!");
				} catch (error) {
					console.error("OAuth Callback Error:", error);
					api.removeToken();
					toast.error("Failed to complete login");
					router.push("/auth/login");
				}
			};

			fetchUserAndLogin();
		} else {
			processedRef.current = true;
			router.push("/auth/login?error=oauth_failed");
		}
	}, [searchParams, router, login]);

	return (
		<div className="min-h-screen flex items-center justify-center bg-background">
			<div className="flex flex-col items-center gap-4">
				<div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
				<p className="text-muted-foreground">Completing sign in...</p>
			</div>
		</div>
	);
}