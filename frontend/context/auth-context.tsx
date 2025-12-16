"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { UserDTO } from "@/types";
import { api } from "@/lib/api";
import { useRouter, usePathname } from "next/navigation";

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

  useEffect(() => {
    const initializeAuth = async () => {
      const token = api.getToken();
      if (token) {
        try {
          const user = await api.get<UserDTO>("/auth/me");
          setUser(user);
        } catch (error) {
          console.error("Auth initialization error", error);
          api.removeToken();
          setUser(null);
          router.push("/auth/login");
        }
      } else if (!pathname.startsWith("/auth")) {
        router.push("/auth/login");
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, [pathname]); 

  const login = (token: string, userData: UserDTO) => {
    api.setToken(token);
    setUser(userData);
    router.push("/dashboard");
  };

  const updateUser = (userData: UserDTO) => {
    setUser(userData);
  };

  const logout = () => {
    api.removeToken();
    setUser(null);
    router.push("/auth/login");
  };

  const isAuthenticated = !!user;


  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, updateUser }}>
      {children}
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
