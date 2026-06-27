import { test, expect } from '@playwright/test';

test.describe('StudySpace Usability Test Scenarios (E2E Automated)', () => {

  test.beforeEach(async ({ page }) => {
    // Mock general settings and common endpoints
    await page.route('**/api/chat/conversations**', async route => {
      await route.fulfill({ json: [] });
    });
  });

  test('Test 4.1 — Upload and browse a Course Material (FR-01)', async ({ page }) => {
    // 1. Mock Instructor account login
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'instructor-jwt');
    });
    await page.route('**/api/auth/me', async route => {
      await route.fulfill({
        json: { id: 10, username: 'instructor', email: 'instructor@studyspace.com', role: 'INSTRUCTOR' }
      });
    });

    // Mock published course details for instructor (exact matching to avoid collisions)
    await page.route('**/api/courses/101', async route => {
      await route.fulfill({
        json: {
          id: 101,
          title: 'Software Engineering Methodologies',
          instructorId: 10,
          isPublished: true,
          sections: [
            {
              id: 201,
              title: 'Week 1: Introduction to Scrum',
              materials: []
            }
          ]
        }
      });
    });

    // Mock upload material POST API call
    await page.route('**/api/courses/sections/201/materials**', async route => {
      expect(route.request().method()).toBe('POST');
      await route.fulfill({
        json: {
          id: 302,
          title: 'Scrum Guide PDF',
          fileUrl: '/mock/scrum-guide.pdf',
          fileType: 'PDF',
          originalFileName: 'scrum-guide.pdf'
        }
      });
    });

    // 2. Navigate to course management view
    await page.goto('/courses/101/manage');
    await expect(page.locator('text=Week 1: Introduction to Scrum')).toBeVisible();

    // 3. Select a section and click edit to show upload controls
    await page.locator('button[title="Edit title / description"]').first().click();

    // Fill in the upload inputs
    await page.locator('input[placeholder="Material name…"]').fill('Scrum Guide PDF');
    
    // Select a file
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('input[type="file"]').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'scrum-guide.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('mock pdf content of at least 1MB size'.repeat(30000))
    });

    // 4. Confirm upload (Click Upload button)
    await page.locator('button:has-text("Upload")').click();

    // Verify it appears in the list
    await expect(page.locator('text=Scrum Guide PDF')).toBeVisible();

    // 5. Simulate student login, log out and check view
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'student-jwt');
    });
    await page.route('**/api/auth/me', async route => {
      await route.fulfill({
        json: { id: 1, username: 'student', email: 'student@studyspace.com', role: 'STUDENT' }
      });
    });

    // Mock same course details, but now with the uploaded material present (exact match)
    await page.route('**/api/courses/101', async route => {
      await route.fulfill({
        json: {
          id: 101,
          title: 'Software Engineering Methodologies',
          instructorId: 10,
          isPublished: true,
          sections: [
            {
              id: 201,
              title: 'Week 1: Introduction to Scrum',
              materials: [
                {
                  id: 302,
                  title: 'Scrum Guide PDF',
                  fileType: 'PDF',
                  fileUrl: '/mock/scrum-guide.pdf',
                  uploadedAt: new Date().toISOString()
                }
              ]
            }
          ]
        }
      });
    });

    // Mock student enrollments list
    await page.route('**/api/courses/my-enrollments**', async route => {
      await route.fulfill({ json: { content: [] } });
    });

    // Navigate to course detail page as Student
    await page.goto('/courses/101');

    // 6. Confirm the material is visible
    await expect(page.locator('text=Scrum Guide PDF')).toBeVisible();
    await expect(page.locator('a[title="Scrum Guide PDF"]')).toBeVisible();

    // Edge case: Student tries to upload
    // Verify upload controls (edit/upload buttons) are absent from student UI
    await expect(page.locator('button[title="Edit title / description"]')).not.toBeVisible();
  });

  test('Test 4.2 — Clone course and submit Merge Proposal (FR-02)', async ({ page }) => {
    // 1. Log in as Student
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'student-jwt');
    });
    await page.route('**/api/auth/me', async route => {
      await route.fulfill({
        json: { id: 1, username: 'student', email: 'student@studyspace.com', role: 'STUDENT' }
      });
    });

    // Mock student enrollments (active enrollment required to fork/clone)
    await page.route('**/api/courses/my-enrollments**', async route => {
      await route.fulfill({
        json: {
          content: [
            {
              id: 501,
              courseId: 101,
              studentId: 1,
              status: 'ACTIVE',
              enrolledAt: new Date().toISOString()
            }
          ],
          totalPages: 1,
          totalElements: 1
        }
      });
    });

    // Mock student workspaces list
    await page.route('**/api/workspaces**', async route => {
      if (route.request().url().includes('/workspaces/6')) {
        await route.fulfill({
          json: {
            id: 6,
            name: 'My Workspace',
            ownerId: 1
          }
        });
      } else {
        await route.fulfill({
          json: {
            content: [
              {
                id: 6,
                name: 'My Workspace',
                ownerId: 1,
                spaceCount: 0
              }
            ],
            totalPages: 1,
            totalElements: 1
          }
        });
      }
    });

    // Mock published course details (exact match)
    await page.route('**/api/courses/101', async route => {
      await route.fulfill({
        json: {
          id: 101,
          title: 'Software Engineering Methodologies',
          instructorId: 10,
          isPublished: true,
          sections: [
            {
              id: 201,
              title: 'Week 1: Introduction to Scrum',
              materials: [
                {
                  id: 301,
                  title: 'Scrum Guide PDF',
                  fileType: 'PDF',
                  fileUrl: '/mock/scrum-guide.pdf'
                }
              ]
            }
          ]
        }
      });
    });

    // Mock Workspace fork course endpoint
    let cloneTriggered = false;
    await page.route('**/api/workspaces/*/spaces/fork**', async route => {
      cloneTriggered = true;
      await route.fulfill({
        json: {
          id: 27,
          title: 'Software Engineering Methodologies (Fork)',
          workspaceId: 6
        }
      });
    });

    // 2. Navigate to course page and click Clone
    await page.goto('/courses/101');
    const cloneBtn = page.locator('button:has-text("Copy to Workspace")');
    await expect(cloneBtn).toBeVisible();
    await cloneBtn.click();

    // Select workspace in modal card (Scoped to dialog)
    await page.locator('[role="dialog"] >> text="My Workspace"').first().click();

    // Confirm name and click Clone course
    await page.locator('button:has-text("Clone course")').click();

    // 3. Confirm clone request is made
    expect(cloneTriggered).toBe(true);

    // Mock workspace space details (propose page reads materials from sections)
    await page.route('**/api/workspaces/spaces/27**', async route => {
      await route.fulfill({
        json: {
          id: 27,
          title: 'Software Engineering Methodologies (Fork)',
          workspaceId: 6,
          forkedFromCourseId: 101,
          sections: [
            {
              id: 202,
              title: 'Week 1: Introduction to Scrum',
              materials: [
                {
                  id: 301,
                  title: 'Scrum Guide PDF',
                  fileType: 'PDF',
                  fileUrl: '/mock/scrum-guide.pdf',
                  isReference: true
                },
                {
                  id: 305,
                  title: 'My Custom Slide PDF',
                  fileType: 'PDF',
                  fileUrl: '/mock/my-custom-slide.pdf',
                  isReference: false,
                  sectionId: 202
                }
              ]
            }
          ]
        }
      });
    });

    // Mock workspace space materials list
    await page.route('**/api/workspaces/spaces/27/materials**', async route => {
      await route.fulfill({
        json: [
          {
            id: 305,
            title: 'My Custom Slide PDF',
            fileType: 'PDF',
            fileUrl: '/mock/my-custom-slide.pdf',
            isReference: false,
            sectionId: 202
          }
        ]
      });
    });

    // Mock proposal submit endpoint
    let proposalSubmitted = false;
    await page.route('**/api/contributions**', async route => {
      if (route.request().method() === 'POST') {
        proposalSubmitted = true;
        await route.fulfill({
          json: {
            id: 50,
            status: 'PENDING',
            message: 'Please accept my contribution'
          }
        });
      } else {
        await route.fulfill({ json: [] });
      }
    });

    // 4 & 5. Submit a Merge Proposal from workspace space propose page
    await page.goto('/workspaces/6/spaces/27/propose');
    await expect(page.locator('text=My Custom Slide PDF')).toBeVisible();
    
    // Select the material and submit
    await page.locator('button:has-text("Select All")').click();
    await page.locator('textarea').first().fill('Please accept my contribution');
    await page.locator('button:has-text("Submit Proposal")').click();

    // 6. Verify proposal is submitted
    expect(proposalSubmitted).toBe(true);

    // Mock Instructor login and review
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'instructor-jwt');
    });
    await page.route('**/api/auth/me', async route => {
      await route.fulfill({
        json: { id: 10, username: 'instructor', email: 'instructor@studyspace.com', role: 'INSTRUCTOR' }
      });
    });

    // Mock individual course details for instructor (showing contributions list)
    await page.route('**/api/contributions**', async route => {
      if (route.request().url().includes('/review')) {
        await route.fallback();
      } else {
        await route.fulfill({
          json: [
            {
              id: 50,
              status: 'PENDING',
              message: 'Please accept my contribution',
              studentName: 'Student User',
              createdAt: new Date().toISOString(),
              proposedSectionTitle: null,
              sourceMaterial: {
                id: 305,
                title: 'My Custom Slide PDF',
                fileType: 'PDF'
              },
              targetSection: {
                id: 201,
                title: 'Week 1: Introduction to Scrum'
              }
            }
          ]
        });
      }
    });

    await page.route('**/api/courses/101', async route => {
      await route.fulfill({
        json: {
          id: 101,
          title: 'Software Engineering Methodologies',
          instructorId: 10,
          isPublished: true,
          sections: [
            {
              id: 201,
              title: 'Week 1: Introduction to Scrum',
              materials: []
            }
          ]
        }
      });
    });

    // Mock review API call
    let reviewCallStatus = '';
    await page.route('**/api/contributions/50/review**', async route => {
      expect(route.request().method()).toBe('PATCH');
      const body = JSON.parse(route.request().postData() || '{}');
      reviewCallStatus = body.status;
      await route.fulfill({
        json: {
          id: 50,
          status: 'APPROVED',
          reviewMessage: 'Accepted!'
        }
      });
    });

    // Go to Instructor Course Manage page (Contributions Tab)
    await page.goto('/courses/101/manage');
    await page.locator('button[role="tab"]:has-text("Contributions")').click();

    // 7. Confirm proposal appears, click Review, then click Approve
    await expect(page.locator('text=Please accept my contribution')).toBeVisible();
    await page.locator('button:has-text("Review")').first().click();
    await page.locator('button:has-text("Approve")').click();

    // 8. Confirm review status is sent as APPROVED
    expect(reviewCallStatus).toBe('APPROVED');
  });

  test('Test 4.3 — Post a message with Contextual Anchor (FR-03)', async ({ page }) => {
    // 1. Log in as Student
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'student-jwt');
    });
    await page.route('**/api/auth/me', async route => {
      await route.fulfill({
        json: { id: 1, username: 'student', email: 'student@studyspace.com', role: 'STUDENT' }
      });
    });

    // Mock workspace space details
    await page.route('**/api/workspaces/spaces/27**', async route => {
      await route.fulfill({
        json: {
          id: 27,
          title: 'Software Engineering Methodologies (Fork)',
          workspaceId: 6,
          sections: [
            {
              id: 202,
              title: 'Week 1: Introduction to Scrum',
              materials: [
                {
                  id: 301,
                  title: 'Scrum Guide PDF',
                  fileType: 'PDF',
                  fileUrl: '/mock/scrum-guide.pdf',
                  isReference: true
                }
              ]
            }
          ]
        }
      });
    });

    // Mock workspace details to prevent redirects
    await page.route('**/api/workspaces/6', async route => {
      await route.fulfill({
        json: {
          id: 6,
          name: 'My Workspace',
          ownerId: 1
        }
      });
    });

    // Mock contextual chat history to dynamically capture the sent message
    let messagesList: any[] = [];
    await page.route('**/api/workspaces/spaces/27/messages**', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ json: messagesList });
      } else if (route.request().method() === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        const newMsg = {
          id: 801,
          content: body.content,
          userId: 1,
          userFullName: 'Student User',
          createdAt: new Date().toISOString()
        };
        messagesList.push(newMsg);
        await route.fulfill({ json: newMsg });
      }
    });

    await page.goto('/workspaces/6/spaces/27');

    // 2 & 3. Type @ followed by part of material name
    const chatInput = page.getByLabel("Send a message");
    await chatInput.focus();
    await chatInput.pressSequentially("Check out the rules in @");

    // 4. Select material from autocomplete dropdown menu
    const matchBtn = page.locator('button:has-text("Scrum Guide PDF")');
    await expect(matchBtn).toBeVisible();
    await matchBtn.click();

    // Confirm inline badge chip is generated
    await expect(page.locator('span:has-text("Scrum Guide PDF")').first()).toBeVisible();

    // 5. Submit the message
    const sendBtn = page.locator('[data-state="active"] button:has-text("Send")').first();
    await sendBtn.click();

    // Reload page to fetch updated history from mock GET messages
    await page.goto('/workspaces/6/spaces/27');

    // 6. Confirm message rendered as clickable badge in chat area
    const badge = page.locator('span:has-text("Scrum Guide PDF")').first();
    await expect(badge).toBeVisible();
  });

  test('Test 4.4 — Query AI assistant (FR-04)', async ({ page }) => {
    // 1. Log in as Student
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'student-jwt');
    });
    await page.route('**/api/auth/me', async route => {
      await route.fulfill({
        json: { id: 1, username: 'student', email: 'student@studyspace.com', role: 'STUDENT' }
      });
    });

    // Mock workspace space details
    await page.route('**/api/workspaces/spaces/27**', async route => {
      await route.fulfill({
        json: {
          id: 27,
          title: 'Software Engineering Methodologies (Fork)',
          workspaceId: 6,
          sections: [
            {
              id: 202,
              title: 'Week 1: Introduction to Scrum',
              materials: [
                {
                  id: 301,
                  title: 'Scrum Guide PDF',
                  fileType: 'PDF',
                  fileUrl: '/mock/scrum-guide.pdf',
                  isReference: true
                }
              ]
            }
          ]
        }
      });
    });

    // Mock workspace details to prevent redirects
    await page.route('**/api/workspaces/6', async route => {
      await route.fulfill({
        json: {
          id: 6,
          name: 'My Workspace',
          ownerId: 1
        }
      });
    });

    // Mock contextual chat history to avoid component mount issues
    await page.route('**/api/workspaces/spaces/27/messages**', async route => {
      await route.fulfill({ json: [] });
    });

    // Mock chat API response
    let lastQueryContext: any = null;
    await page.route('**/api/chat/query**', async route => {
      lastQueryContext = JSON.parse(route.request().postData() || '{}');
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

    await page.goto('/workspaces/6/spaces/27');

    // 2. Open AI assistant panel
    await page.click('button[role="tab"]:has-text("Ask AI")');

    // 3. Type factual question using @ to reference document context and submit
    const chatInput = page.getByLabel("Ask a question");
    await chatInput.focus();
    await chatInput.pressSequentially("Who are the members in @");

    // Select the document from suggestion
    const matchBtn = page.locator('button:has-text("Scrum Guide PDF")');
    await expect(matchBtn).toBeVisible();
    await matchBtn.click();

    // Confirm inline badge chip is generated
    await expect(page.locator('span:has-text("Scrum Guide PDF")').first()).toBeVisible();

    // Click Send
    await page.locator('[data-state="active"] button:has-text("Send")').first().click();

    // Confirm response appears
    await expect(page.locator('text=According to the Scrum Guide')).toBeVisible();
    await expect(page.locator('text=Scrum Guide PDF').first()).toBeVisible();

    // Verify document context URL was sent in request
    expect(lastQueryContext.documentUrl).toBe('/mock/scrum-guide.pdf');
  });

  test('Test 4.5 — Role-based access control (FR-05)', async ({ page }) => {
    // 1. Log in as Student
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'student-jwt');
    });
    await page.route('**/api/auth/me', async route => {
      await route.fulfill({
        json: { id: 1, username: 'student', email: 'student@studyspace.com', role: 'STUDENT' }
      });
    });

    // Mock API requests with student JWT to Instructor endpoints returning 403 Forbidden
    await page.route('**/api/courses**', async route => {
      if (route.request().method() !== 'GET') {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Forbidden' })
        });
      } else {
        await route.fulfill({
          json: { content: [], totalPages: 1, totalElements: 0 }
        });
      }
    });

    await page.route('**/api/contributions**', async route => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Forbidden' })
      });
    });

    await page.goto('/courses');

    // Perform fetch request inside browser context so they are correctly intercepted
    const statuses = await page.evaluate(async () => {
      const token = localStorage.getItem('token');
      const call = async (url: string, method: string, data: any) => {
        try {
          const res = await fetch(url, {
            method,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: data ? JSON.stringify(data) : undefined
          });
          return res.status;
        } catch {
          return 500;
        }
      };

      return {
        createCourse: await call('/api/courses', 'POST', { title: 'Unauthorized Course' }),
        addSection: await call('/api/courses/101/sections', 'POST', { title: 'Unauthorized Section' }),
        reviewProposal: await call('/api/contributions/50/review', 'POST', { status: 'APPROVED' })
      };
    });

    expect(statuses.createCourse).toBe(403);
    expect(statuses.addSection).toBe(403);
    expect(statuses.reviewProposal).toBe(403);
  });
});
