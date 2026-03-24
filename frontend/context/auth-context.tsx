"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { UserDTO, UserRole } from "@/types";
import { api } from "@/lib/api";
import { useRouter, usePathname } from "next/navigation";
import { FullPageLoader } from "@/components/auth/full-page-loader";

interface AuthContextType {
	user: UserDTO | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	login: (token: string, user: UserDTO) => void;
	logout: () => void;
	updateUser: (user: UserDTO) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<UserDTO | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const router = useRouter();
	const pathname = usePathname();
	const isAuthRoute = pathname.startsWith("/auth");

	useEffect(() => {
		const initializeAuth = async () => {
			const token = api.getToken();
			if (token) {
				try {
					const fetchedUser = await api.get<UserDTO>("/auth/me");
					setUser(fetchedUser);
					
					if (fetchedUser.role === UserRole.INSTRUCTOR) {
						const restrictedRoutes = ["/dashboard", "/sessions", "/groups"];
						if (restrictedRoutes.some(route => pathname.startsWith(route)) || pathname === "/") {
							router.push("/courses");
						}
					}
				} catch (error: any) {
					console.error("Auth initialization error", error);
					// If the response is 401, 403, or if the backend returned unexpected HTML (503 in api.ts), remove token
					if (error?.status === 401 || error?.status === 403 || error?.status === 503) {
						api.removeToken();
						setUser(null);
						router.push("/auth/login");
					} else {
						// For other critical failures, also kick back to login instead of hanging `null`
						router.push("/auth/login");
					}
				}
			} else if (!pathname.startsWith("/auth")) {
				router.push("/auth/login");
			}
			setIsLoading(false);
		};

		initializeAuth();
	}, [pathname, router]);

	const login = useCallback(
		(token: string, userData: UserDTO) => {
			api.setToken(token);
			setUser(userData);
			if (userData.role === UserRole.INSTRUCTOR) {
				router.push("/courses");
			} else {
				router.push("/dashboard"); // or "/" if that's the default student route, but usually it's /dashboard based on sidebar
			}
		},
		[router],
	);

	const updateUser = useCallback((userData: UserDTO) => {
		setUser(userData);
	}, []);

	const logout = useCallback(() => {
		api.removeToken();
		setUser(null);
		router.push("/auth/login");
	}, [router]);

	const isAuthenticated = !!user;

	return (
		<AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, updateUser }}>
			{isLoading ? <FullPageLoader /> : !isAuthenticated && !isAuthRoute ? null : children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
