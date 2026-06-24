import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContextualChat } from '@/components/workspaces/contextual-chat';
import React from 'react';

// ─── Environment mocks ────────────────────────────────────────────────────────

window.Element.prototype.scrollIntoView = vi.fn();

vi.mock('next/navigation', () => ({
	useParams: () => ({ spaceId: '1' }),
}));

vi.mock('@/context/auth-context', () => ({
	useAuth: vi.fn(() => ({
		user: { id: 3, fullName: 'Bob Student', role: 'STUDENT' },
	})),
}));

vi.mock('@/lib/workspace-api', () => ({
	chatApi: { 
		query: vi.fn(),
		listConversations: vi.fn().mockResolvedValue([])
	},
}));
import { chatApi } from '@/lib/workspace-api';

const mockWindowOpen = vi.fn();
Object.defineProperty(window, 'open', { value: mockWindowOpen, writable: true });

// ─── Mock materials ───────────────────────────────────────────────────────────

const mockMaterials = [
	{
		id: 200,
		title: 'Algorithms Slides',
		fileType: 'SLIDES',
		fileUrl: 'algo.pptx',
		isReference: false,
		uploadedAt: '2024-01-01T00:00:00Z',
	},
];

// ─── Helper: render chat, type a plain question, and send it ─────────────────

function renderAndSend(answer: string, contextDocumentTitle: string | null = null) {
	(chatApi.query as any).mockResolvedValueOnce({ answer, contextDocumentTitle });

	render(<ContextualChat materials={mockMaterials as any} />);

	const input = screen.getByLabelText(/Ask a question/i);
	// Directly inject a text node so parseInput() reads a non-empty question
	input.appendChild(document.createTextNode('Explain Big-O notation'));
	fireEvent.input(input);

	fireEvent.click(screen.getByRole('button', { name: /Send/i }));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ContextualChat — FR-04 AI-Based Content Querying', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.setItem('token', 'mock-token');
	});

	// ── 4.1 – chatApi.query called with correct payload ───────────────────────
	it('sends the correct payload to chatApi.query when the user submits a question', async () => {
		(chatApi.query as any).mockResolvedValueOnce({ answer: 'Big-O measures complexity.', contextDocumentTitle: null });

		render(<ContextualChat materials={mockMaterials as any} />);

		const input = screen.getByLabelText(/Ask a question/i);
		input.appendChild(document.createTextNode('Explain Big-O notation'));
		fireEvent.input(input);
		fireEvent.click(screen.getByRole('button', { name: /Send/i }));

		await waitFor(() => {
			expect(chatApi.query).toHaveBeenCalledWith(
				expect.objectContaining({
					question: 'Explain Big-O notation',
					provider: 'gemini',
					// conversationId is a UUID generated each mount — just assert it exists
					conversationId: expect.any(String),
				})
			);
		});
	});

	// ── 4.2 – AI response text is displayed after API resolves ───────────────
	it('displays the AI response as a new message after chatApi.query resolves', async () => {
		renderAndSend('Big-O measures algorithm complexity.');

		// User message first
		await waitFor(() => {
			expect(screen.getByText('Explain Big-O notation')).toBeInTheDocument();
		});

		// AI response renders (streaming → plain text first, then markdown)
		await waitFor(() => {
			expect(screen.getByText(/Big-O measures algorithm complexity/i)).toBeInTheDocument();
		}, { timeout: 3000 });
	});

	// ── 4.3 – Error state shown when chatApi.query rejects ───────────────────
	it('shows an error message when chatApi.query rejects', async () => {
		// Suppress expected console.error output from the component's catch block
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		(chatApi.query as any).mockRejectedValueOnce(new Error('Service unavailable'));

		render(<ContextualChat materials={mockMaterials as any} />);

		const input = screen.getByLabelText(/Ask a question/i);
		input.appendChild(document.createTextNode('What is recursion?'));
		fireEvent.input(input);
		fireEvent.click(screen.getByRole('button', { name: /Send/i }));

		await waitFor(() => {
			expect(screen.getByText(/Service unavailable/i)).toBeInTheDocument();
		});

		consoleSpy.mockRestore();
	});

	// ── 4.4 – Input is cleared after a message is sent ───────────────────────
	it('clears the input field after the message is sent', async () => {
		(chatApi.query as any).mockResolvedValueOnce({ answer: 'OK', contextDocumentTitle: null });

		render(<ContextualChat materials={mockMaterials as any} />);

		const input = screen.getByLabelText(/Ask a question/i);
		input.appendChild(document.createTextNode('What is recursion?'));
		fireEvent.input(input);

		fireEvent.click(screen.getByRole('button', { name: /Send/i }));

		// After send the component calls inputRef.current.innerHTML = ""
		await waitFor(() => {
			expect(input.innerHTML).toBe('');
		});
	});

	// ── 4.5 – Model selector switches provider ────────────────────────────────
	it('switches the provider to openai when the GPT option is selected', async () => {
		(chatApi.query as any).mockResolvedValue({ answer: 'Answer', contextDocumentTitle: null });

		render(<ContextualChat materials={mockMaterials as any} />);

		// Open the model dropdown
		const modelBtn = screen.getByRole('button', { name: /Gemini 3 Flash/i });
		fireEvent.click(modelBtn);

		// Click the GPT option
		await waitFor(() => {
			expect(screen.getByText(/GPT-5.4 mini/i)).toBeInTheDocument();
		});
		fireEvent.click(screen.getAllByText(/GPT-5.4 mini/i)[0]);

		// Now send a message and verify provider = "openai"
		const input = screen.getByLabelText(/Ask a question/i);
		input.appendChild(document.createTextNode('Hello'));
		fireEvent.input(input);
		fireEvent.click(screen.getByRole('button', { name: /Send/i }));

		await waitFor(() => {
			expect(chatApi.query).toHaveBeenCalledWith(
				expect.objectContaining({ provider: 'openai' })
			);
		});
	});
});
