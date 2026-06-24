import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SpaceManagePage from '@/app/workspaces/[id]/spaces/[spaceId]/page';
import { workspacesApi } from '@/lib/workspace-api';
import { useAuth } from '@/context/auth-context';
import React from 'react';

// Mock Next.js hooks
vi.mock('next/navigation', () => ({
	useParams: () => ({ id: '1', spaceId: '2' }),
	useRouter: () => ({ push: vi.fn() }),
	usePathname: () => '/workspaces/1/spaces/2'
}));

// Mock Auth context
vi.mock('@/context/auth-context', () => ({
	useAuth: vi.fn()
}));

// Mock API
vi.mock('@/lib/workspace-api', () => ({
	workspacesApi: {
		getSpace: vi.fn(),
		uploadMaterial: vi.fn(),
		deleteMaterial: vi.fn(),
	}
}));

// Mock Resizable panels which fail in JSDOM
vi.mock('@/components/ui/resizable', () => ({
	ResizablePanelGroup: ({ children }: any) => <div data-testid="panel-group">{children}</div>,
	ResizablePanel: ({ children }: any) => <div data-testid="panel">{children}</div>,
	ResizableHandle: () => null
}));

const mockUser = { id: 1, role: 'STUDENT' };

const mockSpace = {
	id: 2,
	title: 'My Forked Course',
	workspaceId: 1,
	sections: [
		{
			id: 10,
			title: 'Section 1',
			materials: [
				{
					id: 100,
					title: 'Original Doc',
					fileUrl: 'fake.pdf',
					fileType: 'PDF',
					isReference: true,
					uploadedAt: '2023-01-01T00:00:00Z'
				}
			]
		}
	],
	isGuest: false
};

let consoleSpy: ReturnType<typeof vi.spyOn>;

describe('SpaceManagePage Component - Workspace Content Manager', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(useAuth).mockReturnValue({ user: mockUser } as any);
		window.Element.prototype.scrollIntoView = vi.fn();
		global.ResizeObserver = class ResizeObserver {
			observe() {}
			unobserve() {}
			disconnect() {}
		};
		// member-chat makes a real fetch in useEffect which always fails (no backend).
		// Suppress the expected 401 console.error so the output stays clean.
		consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		consoleSpy.mockRestore();
	});

	it('renders space sections and materials', async () => {
		vi.mocked(workspacesApi.getSpace).mockResolvedValue(mockSpace as any);

		render(<SpaceManagePage />);

		await waitFor(() => {
			expect(screen.getByText('My Forked Course')).toBeInTheDocument();
			expect(screen.getByText('Original Doc')).toBeInTheDocument();
		});
	});

	it('handles removing a material (reference)', async () => {
		vi.mocked(workspacesApi.getSpace).mockResolvedValue(mockSpace as any);

		render(<SpaceManagePage />);

		await waitFor(() => {
			expect(screen.getByText(/Original Doc/)).toBeInTheDocument();
		});

		// Find the delete button for the material
		// The section delete button and material delete button both have hover:text-destructive
		const trashButtons = screen.getAllByRole('button').filter(btn => btn.className.includes('hover:text-destructive'));
		const deleteBtn = trashButtons[1]; // The first is section, the second is material
		
		expect(deleteBtn).toBeDefined();
		fireEvent.click(deleteBtn!);

		// Dialog opens, click confirm
		const confirmBtn = screen.getByRole('button', { name: /Delete/i });
		
		vi.mocked(workspacesApi.deleteMaterial).mockResolvedValueOnce(undefined);
		fireEvent.click(confirmBtn);

		await waitFor(() => {
			expect(workspacesApi.deleteMaterial).toHaveBeenCalledWith(100, 1); // materialId, userId
			// Wait for it to disappear from UI
			expect(screen.queryByText(/Original Doc/)).not.toBeInTheDocument();
		});
	});

	it('handles uploading a new material (or re-referencing identical file)', async () => {
		vi.mocked(workspacesApi.getSpace).mockResolvedValue({
			...mockSpace,
			sections: [
				{
					id: 10,
					title: 'Section 1',
					materials: []
				}
			]
		} as any);

		render(<SpaceManagePage />);

		await waitFor(() => {
			expect(screen.getByText(/Section 1/)).toBeInTheDocument();
		});

		// Click the Add (+) button for the section
		const plusButtons = screen.getAllByRole('button').filter(btn => btn.innerHTML.includes('lucide-plus'));
		const addMaterialBtn = plusButtons[0];
		
		fireEvent.click(addMaterialBtn);

		// Upload form appears
		await waitFor(() => {
			expect(screen.getByPlaceholderText('Material Title')).toBeInTheDocument();
		});

		const titleInput = screen.getByPlaceholderText('Material Title');
		fireEvent.change(titleInput, { target: { value: 'Re-added Doc' } });

		const fileInput = screen.getByDisplayValue(''); // The file input
		const file = new File(['dummy content'], 'doc.pdf', { type: 'application/pdf' });
		Object.defineProperty(fileInput, 'files', { value: [file] });
		fireEvent.change(fileInput);

		// Submit upload
		const uploadBtn = screen.getByRole('button', { name: /Upload/i });

		// Mock the upload API to return a reference material
		const mockResponseMaterial = {
			id: 101,
			title: 'Re-added Doc',
			fileUrl: 'doc.pdf',
			fileType: 'PDF',
			isReference: true, // Simulated backend behavior for identical file
			uploadedAt: '2023-01-02T00:00:00Z'
		};
		vi.mocked(workspacesApi.uploadMaterial).mockResolvedValueOnce(mockResponseMaterial as any);

		fireEvent.click(uploadBtn);

		await waitFor(() => {
			expect(workspacesApi.uploadMaterial).toHaveBeenCalledWith(10, 1, 'Re-added Doc', file);
			expect(screen.getByText('Re-added Doc')).toBeInTheDocument();
		});
	});
});
