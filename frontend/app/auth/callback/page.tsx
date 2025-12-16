"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { api } from "@/lib/api"
import { toast } from "sonner"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()

  useEffect(() => {
    const token = searchParams.get("token")

    if (token) {
      // We have a token, now let's fetch the user details
      // Ideally, the backend could pass user info in query params too, or we just fetch "me"
      // Since our login function takes (token, user), we need the user object.
      // Let's manually set the token first to allow the API call
      
      const fetchUserAndLogin = async () => {
        try {
            // Temporarily set token for this request
            api.setToken(token) 
            // Assuming we have an endpoint to get current user, or we decode the token
            // For now, let's use the profile endpoint if it exists, or just use the token claims if we had a decoder
            // In our current setup, let's try to fetch user profile
            // If we don't have a specific "me" endpoint, we can user /users/username if we knew it...
            // Let's assume the backend might not be fully ready for a "get me" without ID.
            // Wait, we do not have a "get me" endpoint in the plan?
            // Let's check `AuthController.java` or `UserController.java`.
            
            // Actually, `login` context function usually sets the user. 
            // If we look at `auth-context.tsx`, `login` takes `(token, userDTO)`.
            // We need to fetch the user.
            
            // NOTE: We might need to add a "me" endpoint or decoding logic.
            // For now, let's try to decode if possible, or assume the backend provided enough info.
            // But wait, the `token` is all we have.
            
            // Let's try to query a secured endpoint to check validity and get ID? 
            // `AuthController` might verify token.
            
            // Hack for now: Decode token to get username, then fetch user?
            // "sub" in JWT is username.
            
            const payload = JSON.parse(atob(token.split('.')[1]));
            const username = payload.sub;
            
            // Now fetch user details
            // We need an endpoint for this. `UserController` likely has `getUserByUsername` or similar?
            // `UserController` has `/{id}` but maybe not `by-username` exposed easily?
            // Actually `UserController` has `getUserProfile(@PathVariable Long id)`.
            // We might be blocked here without a "me" endpoint.
            
            // Let's verify existing endpoints.
            // If needed, I will add an endpoint in execute mode.
             const userRes = await api.get<any>("/users"); 
             // This returns ALL users. Not efficient/secure but might work for finding "me" by username.
             
             // Better: Let's assume we can add a `/auth/me` endpoint quickly.
             // Or trust the user context to re-fetch if we just persist the token?
             // `AuthProvider` has `checkAuth`. It verifies token and sets user?
             
             // login(token, null); // Pass null user, let AuthContext try to re-hydrate?
             
             // Instead of trying to satisfy the strict login() type without user data,
             // we persist the token and force a navigation that will trigger the AuthProvider
             // to re-verify the token and fetch the user on mount.
             api.setToken(token);
             window.location.href = "/dashboard";
             return; 
             
        } catch (error) {
            console.error("OAuth Callback Error", error);
            toast.error("Failed to complete login");
            router.push("/auth/login");
        }
      }

      // Actually, looking at `auth-context.tsx`:
      // `checkAuth` validates the token and sets user.
      // So calling `login(token, null)` might be weird if `login` expects user.
      // But `login` sets state.
      
      // Let's simply set the token in localStorage and redirect to dashboard, letting `AuthProvider` doing the work?
      // `AuthProvider` runs `checkAuth` on mount.
      
      api.setToken(token); // This saves to localStorage
      router.push("/dashboard");
      toast.success("Successfully logged in!");
      
    } else {
      router.push("/auth/login?error=oauth_failed")
    }
  }, [searchParams, router, login])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  )
}
