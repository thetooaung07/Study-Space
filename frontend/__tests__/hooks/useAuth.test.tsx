import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act, renderHook } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';
import { UserRole } from '@/types';
import React, { ReactNode } from 'react';

// Mock Next.js router
const mockPush = vi.fn();
let mockPathname = '/';

vi.mock('next/navigation', () => ({
	useRouter: () => ({ push: mockPush }),
	usePathname: () => mockPathname
}));

// Mock API
vi.mock('@/lib/api', () => ({
	api: {
		getToken: vi.fn(),
		setToken: vi.fn(),
		removeToken: vi.fn(),
		get: vi.fn()
	}
}));

const wrapper = ({ children }: { children: ReactNode }) => (
	<AuthProvider>{children}</AuthProvider>
);

describe('useAuth and AuthProvider', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockPathname = '/auth/login'; // Default to auth route so hook doesn't unmount when unauthenticated
	});

	it('initializes as unauthenticated and redirects to login if no token exists', async () => {
		mockPathname = '/'; // Test the redirect
		vi.mocked(api.getToken).mockReturnValue(null);
		
		const { result } = renderHook(() => useAuth(), { wrapper });

		await waitFor(() => {
			expect(mockPush).toHaveBeenCalledWith('/auth/login');
		});
		// We can't check result.current here because the hook unmounts on non-auth routes
	});

	it('fetches user and initializes as authenticated if token exists', async () => {
		mockPathname = '/'; // It should stay mounted if auth is successful
		vi.mocked(api.getToken).mockReturnValue('valid-token');
		vi.mocked(api.get).mockResolvedValue({
			id: 2,
			role: UserRole.INSTRUCTOR
		});

		const { result } = renderHook(() => useAuth(), { wrapper });

		await waitFor(() => {
			expect(result.current.isAuthenticated).toBe(true);
			expect(result.current.user?.role).toBe(UserRole.INSTRUCTOR);
		});
	});

	it('login correctly updates state and redirects based on STUDENT role', async () => {
		mockPathname = '/auth/login';
		vi.mocked(api.getToken).mockReturnValue(null);
		
		const { result } = renderHook(() => useAuth(), { wrapper });

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		await act(async () => {
			result.current.login('new-token', {
				id: 1,
				username: 'student',
				email: 'student@test.com',
				fullName: 'Student User',
				totalStudyMinutes: 0,
				currentStatus: 'ONLINE',
				role: UserRole.STUDENT,
				createdAt: '',
				updatedAt: '',
				authProvider: 'LOCAL'
			});
		});

		await waitFor(() => {
			expect(api.setToken).toHaveBeenCalledWith('new-token');
			expect(result.current.isAuthenticated).toBe(true);
			expect(result.current.user?.role).toBe(UserRole.STUDENT);
			expect(mockPush).toHaveBeenCalledWith('/dashboard');
		});
	});

	it('logout correctly clears state and redirects to login', async () => {
		mockPathname = '/'; // Start on non-auth route to initialize auth
		vi.mocked(api.getToken).mockReturnValue('valid-token');
		vi.mocked(api.get).mockResolvedValue({
			id: 2,
			role: UserRole.INSTRUCTOR
		});

		const { result } = renderHook(() => useAuth(), { wrapper });

		await waitFor(() => {
			expect(result.current.isAuthenticated).toBe(true);
		});

		await act(async () => {
			result.current.logout();
		});

		// Hook unmounts after logout on a non-auth route, so assert side-effects only
		await waitFor(() => {
			expect(api.removeToken).toHaveBeenCalled();
			expect(mockPush).toHaveBeenCalledWith('/auth/login');
		});
	});
});
