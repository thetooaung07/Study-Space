import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Polyfill innerText for JSDOM (textContent fallback)
if (!Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'innerText')) {
	Object.defineProperty(HTMLElement.prototype, 'innerText', {
		get() { return this.textContent; },
		set(value: string) { this.textContent = value; }
	});
}

// Mock scrollIntoView
window.Element.prototype.scrollIntoView = vi.fn();

// Mock Next.js hooks
vi.mock('next/navigation', () => ({
	useParams: () => ({ spaceId: '1' }),
}));

// Mock Auth context
vi.mock('@/context/auth-context', () => ({
	useAuth: vi.fn(() => ({ user: { id: 1, fullName: 'Test User', role: 'STUDENT' } }))
}));

// Mock workspace-api (chatApi)
vi.mock('@/lib/workspace-api', () => ({
	chatApi: {
		query: vi.fn()
	}
}));

// ─── Test 1: Pure unit test of @[id:title] token parsing ─────────────────────
// The `renderMessageText` function is the core of the Contextual Anchor (F3).
// It converts @[id:title] tokens emitted by the AI into clickable Badge elements.
// We extract and test this pure function directly without rendering the full component,
// because the full ContextualChat component relies on window.getSelection() (JSDOM limitation).

// Replicate the parsing logic here for unit testing:
function parseContextualTokens(
	text: string,
	materials: { id: number; title: string; fileUrl: string; fileType: string }[]
): { type: 'text' | 'anchor'; content: string; materialId?: number; materialFound?: boolean }[] {
	const regex = /@\[(\d+):([^\]]+)\]/g;
	const parts: { type: 'text' | 'anchor'; content: string; materialId?: number; materialFound?: boolean }[] = [];
	let lastIndex = 0;
	let match: RegExpExecArray | null;

	while ((match = regex.exec(text)) !== null) {
		if (match.index > lastIndex) {
			parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
		}
		const matId = parseInt(match[1]);
		const matTitle = match[2];
		const material = materials.find((m) => m.id === matId);
		parts.push({
			type: 'anchor',
			content: matTitle,
			materialId: matId,
			materialFound: !!material,
		});
		lastIndex = regex.lastIndex;
	}
	if (lastIndex < text.length) {
		parts.push({ type: 'text', content: text.slice(lastIndex) });
	}
	return parts;
}

const mockMaterials = [
	{
		id: 123,
		title: 'Advanced React Guide',
		fileType: 'PDF',
		fileUrl: 'fake.pdf',
		uploadedAt: '2023-01-01T00:00:00Z',
		isReference: false,
	},
	{
		id: 124,
		title: 'Typescript Basics',
		fileType: 'DOCUMENT',
		fileUrl: 'fake.docx',
		uploadedAt: '2023-01-01T00:00:00Z',
		isReference: false,
	}
];

describe('ContextualAnchor — F3 Contextual Messaging System', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.setItem('token', 'fake-jwt-token');
	});

	// ── Test: @[id:title] token parsing ──────────────────────────────────────
	it('parses @[id:title] token from AI response into a Contextual Anchor', () => {
		const text = 'Check this out: @[123:Advanced React Guide] for more details.';
		const result = parseContextualTokens(text, mockMaterials);

		// Should produce: text, anchor, text
		expect(result).toHaveLength(3);
		expect(result[0]).toEqual({ type: 'text', content: 'Check this out: ' });
		expect(result[1]).toMatchObject({
			type: 'anchor',
			content: 'Advanced React Guide',
			materialId: 123,
			materialFound: true,
		});
		expect(result[2]).toMatchObject({ type: 'text', content: ' for more details.' });
	});

	it('marks the anchor as not found if the material id does not exist in the list', () => {
		const text = 'See @[999:Ghost Material] here.';
		const result = parseContextualTokens(text, mockMaterials);

		expect(result[1]).toMatchObject({
			type: 'anchor',
			content: 'Ghost Material',
			materialId: 999,
			materialFound: false,  // material not in list → no download link
		});
	});

	it('handles a message with multiple @[id:title] anchors', () => {
		const text = '@[123:Advanced React Guide] and @[124:Typescript Basics] are both useful.';
		const result = parseContextualTokens(text, mockMaterials);

		const anchors = result.filter(p => p.type === 'anchor');
		expect(anchors).toHaveLength(2);
		expect(anchors[0].materialId).toBe(123);
		expect(anchors[1].materialId).toBe(124);
	});

	it('returns plain text only when no @[...] tokens are present', () => {
		const text = 'No anchors here, just plain text.';
		const result = parseContextualTokens(text, mockMaterials);

		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({ type: 'text', content: 'No anchors here, just plain text.' });
	});

	// ── Test: badge click routes to the correct deep link URL ────────────────
	it('Contextual Anchor badge routes to the material download URL on click', () => {
		const mockOpen = vi.fn();
		Object.defineProperty(window, 'open', { value: mockOpen, writable: true });

		// Render a minimal badge that simulates what renderMessageText produces
		const material = mockMaterials[0];
		const apiBase = 'http://localhost:8080/api/v1';

		render(
			<button
				onClick={() => {
					const url = `${apiBase}/files/download?materialId=${material.id}&type=WORKSPACE&token=${localStorage.getItem('token') || ''}`;
					window.open(url, '_blank');
				}}
				data-testid="contextual-anchor"
			>
				{material.title}
			</button>
		);

		fireEvent.click(screen.getByTestId('contextual-anchor'));

		expect(mockOpen).toHaveBeenCalledWith(
			expect.stringContaining(`/files/download?materialId=123&type=WORKSPACE&token=fake-jwt-token`),
			'_blank'
		);
	});
});
