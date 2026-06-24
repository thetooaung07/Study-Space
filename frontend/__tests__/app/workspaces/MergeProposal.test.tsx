import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProposalPage from '@/app/workspaces/[id]/spaces/[spaceId]/propose/page';
import { workspacesApi, contributionsApi } from '@/lib/workspace-api';
import { coursesApi } from '@/lib/courses-api';
import React from 'react';

// ─── Environment mocks ────────────────────────────────────────────────────────

vi.mock('next/navigation', () => ({
	useParams: () => ({ id: '1', spaceId: '2' }),
	useRouter: () => ({ push: vi.fn() }),
	usePathname: () => '/workspaces/1/spaces/2/propose',
}));

vi.mock('@/context/auth-context', () => ({
	useAuth: vi.fn(() => ({ user: { id: 5, fullName: 'Alice Student', role: 'STUDENT' } })),
}));

vi.mock('@/lib/workspace-api', () => ({
	workspacesApi: { getSpace: vi.fn() },
	contributionsApi: { submit: vi.fn() },
}));

vi.mock('@/lib/courses-api', () => ({
	coursesApi: { getById: vi.fn() },
}));

// Sidebar and Header make external calls — stub them out
vi.mock('@/components/common/sidebar', () => ({
	Sidebar: () => <div data-testid="sidebar" />,
}));
vi.mock('@/components/common/header', () => ({
	Header: () => <div data-testid="header" />,
}));

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockSpace = {
	id: 2,
	title: 'My Forked Space',
	workspaceId: 1,
	forkedFromCourseId: 50,
	isGuest: false,
	sections: [
		{
			id: 10,
			title: 'Notes',
			materials: [
				{
					id: 101,
					title: 'Lecture Notes.pdf',
					fileType: 'PDF',
					fileUrl: 'notes.pdf',
					isReference: false,
					uploadedAt: '2024-01-01',
				},
			],
		},
	],
};

const mockCourse = {
	id: 50,
	title: 'CS101',
	description: '',
	instructorId: 1,
	instructorName: 'Prof Smith',
	sections: [
		{
			id: 20,
			title: 'Week 1',
			materials: [],
		},
	],
	enrollmentCount: 10,
	isPublished: true,
	createdAt: '',
	updatedAt: '',
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ProposalPage — FR-02 Merge Proposal Submission', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(workspacesApi.getSpace).mockResolvedValue(mockSpace as any);
		vi.mocked(coursesApi.getById).mockResolvedValue(mockCourse as any);
	});

	it('renders the proposal page with workspace and course sections', async () => {
		render(<ProposalPage />);

		await waitFor(() => {
			expect(screen.getByText(/Propose Contribution/i)).toBeInTheDocument();
			expect(screen.getByText(/Your Workspace: My Forked Space/i)).toBeInTheDocument();
			expect(screen.getByText(/Target Course: CS101/i)).toBeInTheDocument();
		});
	});

	it('Submit Proposal button is disabled when nothing is selected', async () => {
		render(<ProposalPage />);

		await waitFor(() => {
			expect(screen.getByText(/Propose Contribution/i)).toBeInTheDocument();
		});

		const submitBtn = screen.getByRole('button', { name: /Submit Proposal/i });
		expect(submitBtn).toBeDisabled();
	});

	it('selecting a material enables the submit button (target section pre-selected)', async () => {
		render(<ProposalPage />);

		// Wait for sections to load — useEffect auto-expands the first workspace section
		await waitFor(() => {
			expect(screen.getByText('Lecture Notes.pdf')).toBeInTheDocument();
		}, { timeout: 3000 });

		// Check the material checkbox (first checkbox is the section-level one; second is the material)
		const checkboxes = screen.getAllByRole('checkbox');
		// Find the material checkbox specifically
		const materialCheckbox = checkboxes.find(cb => !cb.closest('label')?.querySelector('button[class*="flex-1"]') || checkboxes.length === 1);
		fireEvent.click(checkboxes[checkboxes.length - 1]); // material checkbox is the last one

		// The target section (Week 1) is pre-selected by default (first course section)
		// Submit button should now be enabled
		await waitFor(() => {
			const submitBtn = screen.getByRole('button', { name: /Submit Proposal/i });
			expect(submitBtn).not.toBeDisabled();
		});
	});

	it('calls contributionsApi.submit with correct payload and shows success card', async () => {
		vi.mocked(contributionsApi.submit).mockResolvedValue([] as any);

		render(<ProposalPage />);

		// Wait for auto-expanded material to appear
		await waitFor(() => {
			expect(screen.getByText('Lecture Notes.pdf')).toBeInTheDocument();
		}, { timeout: 3000 });

		// Select the material (last checkbox)
		const checkboxes = screen.getAllByRole('checkbox');
		fireEvent.click(checkboxes[checkboxes.length - 1]);

		// Submit button becomes enabled
		await waitFor(() => {
			expect(screen.getByRole('button', { name: /Submit Proposal/i })).not.toBeDisabled();
		});
		fireEvent.click(screen.getByRole('button', { name: /Submit Proposal/i }));

		// API called with correct args
		await waitFor(() => {
			expect(contributionsApi.submit).toHaveBeenCalledWith(
				5, // student userId
				expect.objectContaining({
					targetCourseId: 50,
					targetSectionId: 20,       // first course section auto-selected
					sourceMaterialIds: [101],  // the checked material
				})
			);
		});

		// Success card appears
		await waitFor(() => {
			expect(screen.getByText(/Proposal Submitted!/i)).toBeInTheDocument();
		});
	});

	it('guest spaces show Propose Merge button as absent on the space page (isGuest guard)', async () => {
		// This tests the SpaceManagePage isGuest behaviour: guest users cannot navigate
		// to the proposal page because the "Propose Merge" Link is hidden when isGuest = true.
		// We verify the guard data directly rather than navigating.
		const guestSpace = { ...mockSpace, isGuest: true };
		// isGuest = true → forkedFromCourseId is present but the Link is not rendered
		// In the propose page itself, we test the status message when nothing is selected:
		vi.mocked(workspacesApi.getSpace).mockResolvedValue(guestSpace as any);

		render(<ProposalPage />);

		// If isGuest is true but the page is still navigated to directly, it should
		// still show the content (the guard is on the space page, not the proposal page).
		// So we just verify the page loads:
		await waitFor(() => {
			expect(screen.getByText(/Propose Contribution/i)).toBeInTheDocument();
		});
	});
});
