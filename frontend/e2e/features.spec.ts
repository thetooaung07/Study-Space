import { test, expect } from '@playwright/test';

test.describe('StudySpace Core Features E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Inject auth token and mock current user as student
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'fake-jwt');
    });

    await page.route('**/api/auth/me', async route => {
      await route.fulfill({
        json: { id: 1, username: 'student', email: 'student@studyspace.com', role: 'STUDENT' }
      });
    });
  });

  test('FR-01 (Course Administration Module) - Browse Course Materials', async ({ page }) => {
    // Mock courses catalog API
    await page.route('**/api/courses?*', async route => {
      await route.fulfill({
        json: {
          content: [
            {
              id: 101,
              title: 'Software Engineering Methodologies',
              description: 'Learn Scrum, XP, Agile.',
              instructorName: 'Dr. John Doe',
              isPublished: true,
              enrollmentCount: 5,
              sectionCount: 1
            }
          ],
          totalPages: 1,
          totalElements: 1
        }
      });
    });

    // Mock individual course details with sections and materials
    await page.route('**/api/courses/101', async route => {
      await route.fulfill({
        json: {
          id: 101,
          title: 'Software Engineering Methodologies',
          instructorId: 2,
          isPublished: true,
          sections: [
            {
              id: 201,
              title: 'Week 1: Introduction to Scrum',
              materials: [
                {
                  id: 301,
                  title: 'Scrum Guide PDF',
                  type: 'PDF',
                  url: '/mock/scrum-guide.pdf'
                }
              ]
            }
          ]
        }
      });
    });

    // Mock enrollments check on detail page
    await page.route('**/api/courses/my-enrollments*', async route => {
      await route.fulfill({
        json: {
          content: [],
          totalPages: 0,
          totalElements: 0
        }
      });
    });

    await page.goto('/courses');

    // Verify course is listed
    await expect(page.locator('text=Software Engineering Methodologies')).toBeVisible();

    // Click on the course "View Course" link
    await page.getByRole('link', { name: /view course/i }).first().click();

    // Verify sections and materials are loaded
    await expect(page.locator('text=Week 1: Introduction to Scrum')).toBeVisible();
    await expect(page.locator('text=Scrum Guide PDF')).toBeVisible();
  });

  test('FR-02 (Content Extension System) - Clone Workspace and Submit Merge Proposal', async ({ page }) => {
    // Mock workspaces list
    await page.route('**/api/workspaces/my?*', async route => {
      await route.fulfill({
        json: {
          content: [
            {
              id: 6,
              name: 'Software Engineering Workspace',
              description: 'Semester 5 workspace',
              ownerId: 1,
              ownerName: 'student',
              spaceCount: 1,
              createdAt: '2026-06-27T00:00:00Z',
              updatedAt: '2026-06-27T00:00:00Z'
            }
          ],
          totalPages: 1,
          totalElements: 1
        }
      });
    });

    // Mock shared spaces list
    await page.route('**/api/workspaces/shared?*', async route => {
      await route.fulfill({
        json: {
          content: [],
          totalPages: 0,
          totalElements: 0
        }
      });
    });

    // Mock individual workspace detail
    await page.route('**/api/workspaces/6?*', async route => {
      await route.fulfill({
        json: {
          id: 6,
          name: 'Software Engineering Workspace',
          description: 'Semester 5 workspace',
          ownerId: 1,
          ownerName: 'student',
          spaceCount: 1,
          createdAt: '2026-06-27T00:00:00Z',
          updatedAt: '2026-06-27T00:00:00Z'
        }
      });
    });

    // Mock spaces in that workspace
    await page.route('**/api/workspaces/6/spaces?*', async route => {
      await route.fulfill({
        json: {
          content: [
            {
              id: 27,
              title: 'My Workspace Space',
              description: 'Private copy for homework.',
              forkedFromCourseId: 101,
              sections: [
                {
                  id: 201,
                  title: 'Week 1: Introduction to Scrum',
                  materials: [
                    {
                      id: 301,
                      title: 'Scrum Guide PDF',
                      type: 'PDF',
                      url: '/mock/scrum-guide.pdf'
                    }
                  ]
                }
              ],
              guests: []
            }
          ],
          totalPages: 1,
          totalElements: 1
        }
      });
    });

    // Mock individual workspace space data
    await page.route('**/api/workspaces/spaces/27*', async route => {
      await route.fulfill({
        json: {
          id: 27,
          title: 'My Workspace Space',
          description: 'Private copy for homework.',
          forkedFromCourseId: 101,
          sections: [
            {
              id: 201,
              title: 'Week 1: Introduction to Scrum',
              materials: [
                {
                  id: 301,
                  title: 'Scrum Guide PDF',
                  type: 'PDF',
                  url: '/mock/scrum-guide.pdf'
                }
              ]
            }
          ],
          guests: []
        }
      });
    });

    // Mock target course (which is software engineering methodologies)
    await page.route('**/api/courses/101', async route => {
      await route.fulfill({
        json: {
          id: 101,
          title: 'Software Engineering Methodologies',
          instructorId: 2,
          isPublished: true,
          sections: [
            {
              id: 201,
              title: 'Week 1: Introduction to Scrum',
              materials: [
                {
                  id: 301,
                  title: 'Scrum Guide PDF',
                  type: 'PDF',
                  url: '/mock/scrum-guide.pdf'
                }
              ]
            }
          ]
        }
      });
    });

    // Mock proposals, members and messages
    await page.route('**/api/contributions/my?*', async route => {
      await route.fulfill({ json: [] });
    });
    await page.route('**/api/workspaces/spaces/27/members*', async route => {
      await route.fulfill({ json: [] });
    });
    await page.route('**/api/workspaces/spaces/27/chat/history*', async route => {
      await route.fulfill({ json: [] });
    });

    // Mock Merge Proposal submission
    await page.route('**/api/contributions?*', async route => {
      await route.fulfill({
        json: [
          {
            id: 50,
            title: 'Add new Scrum cheat sheet',
            description: 'Added reference material for team roles.',
            status: 'PENDING'
          }
        ]
      });
    });

    // Go to workspaces page
    await page.goto('/workspaces');

    // Verify workspace card is visible
    await expect(page.locator('text=Software Engineering Workspace')).toBeVisible();

    // Click on the workspace card to navigate
    await page.click('text=Software Engineering Workspace');

    // Verify the spaces are loaded inside the workspace
    await expect(page.locator('text=My Workspace Space')).toBeVisible();

    // Navigate into the workspace space details page
    await page.click('text=My Workspace Space');
    await expect(page.locator('text=Week 1: Introduction to Scrum')).toBeVisible();

    // Click propose merge button / trigger proposal dialog
    await page.getByRole('link', { name: /propose merge/i }).click();

    // Verify navigated to the propose page
    await page.waitForURL(url => url.pathname.endsWith('/propose'));

    // Select all materials on the left
    await page.click('button:has-text("Select All")');

    // Select the first radio button section on the right target course
    await page.locator('input[type="radio"]').first().check();

    // Write message
    await page.fill('textarea[placeholder*="helpful" i]', 'I found these additional resources helpful...');

    // Submit Proposal
    await page.click('button:has-text("Submit Proposal")');

    // Verify success view is displayed
    await expect(page.locator('text=Proposal Submitted!')).toBeVisible();
  });

  test('FR-03 (Contextual Messaging System) & FR-04 (AI-Based Content Querying)', async ({ page }) => {
    // Mock workspace space details
    await page.route('**/api/workspaces/spaces/27*', async route => {
      await route.fulfill({
        json: {
          id: 27,
          title: 'My Workspace Space',
          forkedFromCourseId: 101,
          sections: [
            {
              id: 201,
              title: 'Week 1: Introduction to Scrum',
              materials: [
                {
                  id: 301,
                  title: 'Scrum Guide PDF',
                  type: 'PDF',
                  url: '/mock/scrum-guide.pdf'
                }
              ]
            }
          ],
          guests: []
        }
      });
    });

    await page.route('**/api/contributions/my?*', async route => {
      await route.fulfill({ json: [] });
    });
    await page.route('**/api/workspaces/spaces/27/members*', async route => {
      await route.fulfill({ json: [] });
    });
    await page.route('**/api/workspaces/spaces/27/chat/history*', async route => {
      await route.fulfill({ json: [] });
    });

    // Mock contextual chat API query (AI assistant)
    await page.route('**/api/chat/query', async route => {
      await route.fulfill({
        json: {
          answer: 'According to the Scrum Guide, the Scrum Team consists of a Scrum Master, a Product Owner, and Developers.',
          sources: [
            {
              materialId: 301,
              materialTitle: 'Scrum Guide PDF',
              snippet: 'The Scrum Team consists of a Scrum Master, a Product Owner, and Developers.'
            }
          ]
        }
      });
    });

    await page.route('**/api/chat/conversations?*', async route => {
      await route.fulfill({ json: [] });
    });

    // Go to workspace space
    await page.goto('/workspaces/6/spaces/27');

    // Verify we are in the space
    await expect(page.locator('text=My Workspace Space')).toBeVisible();

    // --- FR-03: Contextual Messaging (Chat Anchor selection) ---
    // Focus the chat message box
    const chatInput = page.getByLabel("Send a message");
    await chatInput.focus();
    await chatInput.pressSequentially("Check out the rules in @");

    // Verify material dropdown appears using the specific button selector
    await expect(page.locator('button:has-text("Scrum Guide PDF")')).toBeVisible();

    // Select the material
    await page.locator('button:has-text("Scrum Guide PDF")').click();

    // Verify the anchor badge is attached to the input field
    await expect(page.locator('span:has-text("Scrum Guide PDF")').first()).toBeVisible();

    // --- FR-04: AI-Based Content Querying (AI Assistant) ---
    // Switch to AI tab/mode
    await page.click('button[role="tab"]:has-text("Ask AI")');

    // Fill in AI query
    const aiInput = page.getByLabel("Ask a question");
    await aiInput.focus();
    await aiInput.pressSequentially("Who are the members of the Scrum Team?");

    // Click Ask button inside the active AI tab content
    await page.locator('[data-state="active"] button:has-text("Send")').first().click();

    // Verify AI response is loaded and sources are shown
    await expect(page.locator('text=According to the Scrum Guide')).toBeVisible();
    await expect(page.locator('text=Scrum Guide PDF')).toBeVisible();
  });

  test('FR-05 (Access Control) - Role-based private route protection', async ({ page }) => {
    // Navigate to instructor-only course management route as a student
    await page.goto('/courses/101/manage');

    // Verify redirection back to the course catalog (since students are redirected)
    await page.waitForURL((url) => url.pathname === '/courses');
    expect(page.url()).toContain('/courses');
  });
});
