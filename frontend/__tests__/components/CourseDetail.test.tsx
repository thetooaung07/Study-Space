import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CourseDetail } from "@/components/courses/course-detail";
import { workspacesApi } from "@/lib/workspace-api";
import { coursesApi } from "@/lib/courses-api";
import React from "react";

// Mock Next.js router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: mockPush }),
}));

// Mock APIs
vi.mock("@/lib/workspace-api", () => ({
	workspacesApi: {
		getMyWorkspaces: vi.fn(),
		forkCourse: vi.fn(),
		create: vi.fn(),
	},
}));

vi.mock("@/lib/courses-api", () => ({
	coursesApi: {
		enroll: vi.fn(),
		unenroll: vi.fn(),
	},
}));

const mockCourse = {
	id: 100,
	title: "Test Course",
	description: "This is a test course",
	instructorId: 1,
	instructorName: "John Doe",
	sections: [],
	enrollmentCount: 5,
	isPublished: true,
	createdAt: "",
	updatedAt: "",
};

describe("CourseDetail Component", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders course title and handles enrollment", async () => {
		render(<CourseDetail course={mockCourse} userId={2} isEnrolled={false} />);
		expect(screen.getByText("Test Course")).toBeInTheDocument();

		const enrollBtn = screen.getByRole("button", { name: /Enroll Now/i });
		expect(enrollBtn).toBeInTheDocument();

		// Setup mock for enrollment
		vi.mocked(coursesApi.enroll).mockResolvedValueOnce({
			id: 0,
			courseId: 0,
			courseTitle: "",
			instructorId: 0,
			instructorName: "",
			studentId: 0,
			studentName: "",
			studentEmail: "",
			status: "PENDING",
			enrolledAt: "",
			enrollmentCount: 0,
			sectionCount: 0,
		});

		// Click enroll
		fireEvent.click(enrollBtn);

		expect(coursesApi.enroll).toHaveBeenCalledWith(100, 2);

		// The button should change to "Unenroll"
		await waitFor(() => {
			expect(screen.getByRole("button", { name: /Unenroll/i })).toBeInTheDocument();
		});
	});

	it("handles cloning (forking) interaction and captures correct payload", async () => {
		// User is enrolled, so fork button appears
		render(<CourseDetail course={mockCourse} userId={2} isEnrolled={true} />);

		// 1. Click "Copy to Workspace"
		const forkBtn = screen.getByRole("button", { name: /Copy to Workspace/i });

		// Mock workspaces response
		const mockWorkspaces = {
			content: [{ id: 10, name: "My Workspace", spaceCount: 1, ownerId: 2, createdAt: "", updatedAt: "" }],
			totalElements: 1,
			totalPages: 1,
			size: 10,
			number: 0,
		};
		vi.mocked(workspacesApi.getMyWorkspaces).mockResolvedValueOnce(mockWorkspaces as any);

		fireEvent.click(forkBtn);

		// 2. Wait for workspace list to load and click on "My Workspace"
		await waitFor(() => {
			expect(screen.getByText("My Workspace")).toBeInTheDocument();
		});

		// Click the workspace card
		const workspaceCard = screen.getByText("My Workspace");
		fireEvent.click(workspaceCard);

		// 3. We should now be on Step 2 (Name your clone)
		await waitFor(() => {
			expect(screen.getByText("Name your clone")).toBeInTheDocument();
		});

		// Default name should be course title
		const input = screen.getByLabelText("Cloned Space Name") as HTMLInputElement;
		expect(input.value).toBe("Test Course");

		// Change the name using fireEvent
		fireEvent.change(input, { target: { value: "My Custom Fork" } });

		// 4. Submit fork
		vi.mocked(workspacesApi.forkCourse).mockResolvedValueOnce({ id: 999 } as any);

		const submitBtn = screen.getByRole("button", { name: /Clone course/i });
		fireEvent.click(submitBtn);

		// Verify API was called with right arguments
		// forkCourse(selectedWorkspace.id, userId, course.id, forkName)
		await waitFor(() => {
			expect(workspacesApi.forkCourse).toHaveBeenCalledWith(10, 2, 100, "My Custom Fork");
		});

		// Verify router redirect
		expect(mockPush).toHaveBeenCalledWith("/workspaces/10/spaces/999");
	});
	it("handles unenrolling via confirmation dialog", async () => {
		// Start already enrolled
		render(<CourseDetail course={mockCourse} userId={2} isEnrolled={true} />);

		// Unenroll button should be visible (enrolled state)
		const unenrollBtn = screen.getByRole("button", { name: /Unenroll/i });
		expect(unenrollBtn).toBeInTheDocument();

		vi.mocked(coursesApi.unenroll).mockResolvedValueOnce({} as any);
		fireEvent.click(unenrollBtn);

		// Confirmation dialog should appear
		await waitFor(() => {
			expect(screen.getByText(/Are you sure you want to unenroll/i)).toBeInTheDocument();
		});

		// Find and click the confirm button inside the dialog
		const confirmBtns = screen.getAllByRole("button", { name: /Unenroll/i });
		const dialogConfirmBtn = confirmBtns[confirmBtns.length - 1];
		fireEvent.click(dialogConfirmBtn);

		await waitFor(() => {
			expect(coursesApi.unenroll).toHaveBeenCalledWith(100, 2);
		});

		// After unenrolling, enrollment button should revert
		await waitFor(() => {
			expect(screen.getByRole("button", { name: /Enroll Now/i })).toBeInTheDocument();
		});
	});

	it("shows Manage Course button for the instructor; not for a student", () => {
		// Render as the instructor (userId === course.instructorId === 1)
		render(<CourseDetail course={mockCourse} userId={1} isEnrolled={false} />);
		expect(screen.getByRole("link", { name: /Manage Course/i })).toBeInTheDocument();
		// Student-only controls should not appear
		expect(screen.queryByRole("button", { name: /Enroll Now/i })).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: /Copy to Workspace/i })).not.toBeInTheDocument();
	});

	it("hides Copy to Workspace for a non-enrolled student", () => {
		// Enrolled = false means Copy to Workspace is not yet visible
		render(<CourseDetail course={mockCourse} userId={2} isEnrolled={false} />);
		expect(screen.queryByRole("button", { name: /Copy to Workspace/i })).not.toBeInTheDocument();
	});
});
