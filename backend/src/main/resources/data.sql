
-- StudySpace Sample Data
-- Seed data for development and testing

-- Insert Sample Users (password: 'password' for all)
INSERT INTO users (username, email, password, full_name, profile_picture_url, total_study_minutes, current_status, current_streak, last_study_date, role, created_at, updated_at)
VALUES
('johndoe', 'john.doe@example.com', '$2a$10$IZ7IMsbk36K8fIARPFOCAO0bG4AfTuPMSH9toeW/pt47yQyKLFDle', 'John Doe', '', 495, 'ONLINE', 5, DATEADD('DAY', -1, CURRENT_TIMESTAMP), 'INSTRUCTOR', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('janesmith', 'jane.smith@example.com', '$2a$10$IZ7IMsbk36K8fIARPFOCAO0bG4AfTuPMSH9toeW/pt47yQyKLFDle', 'Jane Smith', '', 720, 'STUDYING', 12, CURRENT_TIMESTAMP, 'INSTRUCTOR', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('bobwilson', 'bob.wilson@example.com', '$2a$10$IZ7IMsbk36K8fIARPFOCAO0bG4AfTuPMSH9toeW/pt47yQyKLFDle', 'Bob Wilson', '', 330, 'AWAY', 3, DATEADD('DAY', -2, CURRENT_TIMESTAMP), 'STUDENT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('alicejohnson', 'alice.johnson@example.com', '$2a$10$IZ7IMsbk36K8fIARPFOCAO0bG4AfTuPMSH9toeW/pt47yQyKLFDle', 'Alice Johnson', '', 890, 'ONLINE', 21, DATEADD('DAY', -1, CURRENT_TIMESTAMP), 'STUDENT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('charliebrown', 'charlie.brown@example.com', '$2a$10$IZ7IMsbk36K8fIARPFOCAO0bG4AfTuPMSH9toeW/pt47yQyKLFDle', 'Charlie Brown', '', 240, 'ONLINE', 7, CURRENT_TIMESTAMP, 'STUDENT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);


-- Insert Sample Study Groups
INSERT INTO study_groups (name, description, invite_code, group_type, creator_id, created_at, updated_at)
VALUES
('Advanced Mathematics', 'A group for students tackling advanced calculus, linear algebra, and differential equations. Weekly problem-solving sessions!', 'MATH2024', 'PUBLIC', 1, DATEADD('DAY', -30, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP),
('Programming Masters', 'Java, Python, and C++ programming enthusiasts. Code reviews, algorithm challenges, and project collaboration.', 'PROG5678', 'PUBLIC', 2, DATEADD('DAY', -25, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP),
('Biology Study Circle', 'Focused on cellular biology, genetics, and molecular biology. Perfect for pre-med students!', 'BIO1234', 'INVITE_ONLY', 3, DATEADD('DAY', -20, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP),
('History Nerds United', 'Medieval and modern history discussion group. From ancient civilizations to contemporary events.', 'HIST9999', 'PUBLIC', 4, DATEADD('DAY', -15, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP),
('Language Learning Crew', 'Spanish, French, and German language practice. Conversation practice and grammar help!', 'LANG5555', 'PUBLIC', 5, DATEADD('DAY', -10, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP);


-- Insert Group Members (Many-to-Many join table)
INSERT INTO group_members (user_id, group_id)
VALUES
-- Advanced Mathematics members
(1, 1),
(2, 1),
(3, 1),
(4, 1),
-- Programming Masters members
(2, 2),
(1, 2),
(5, 2),
-- Biology Study Circle members
(3, 3),
(4, 3),
(5, 3),
-- History Nerds United members
(4, 4),
(1, 4),
(2, 4),
-- Language Learning Crew members
(5, 5),
(1, 5),
(3, 5);


-- Insert Sample Study Sessions (Mix of COMPLETED and ACTIVE)
INSERT INTO study_sessions (title, description, subject, start_time, end_time, duration_minutes, is_group_session, room_code, status, visibility, user_id, study_group_id, created_at)
VALUES
-- COMPLETED group sessions
('Calculus Integration Techniques', 'Deep dive into substitution and integration by parts', 'MATH', DATEADD('HOUR', -48, CURRENT_TIMESTAMP), DATEADD('MINUTE', 120, DATEADD('HOUR', -48, CURRENT_TIMESTAMP)), 120, true, 'ROOM-1701100800001', 'COMPLETED', 'PUBLIC', 1, 1, DATEADD('HOUR', -48, CURRENT_TIMESTAMP)),
('Java OOP Concepts', 'Reviewing inheritance, polymorphism, and abstraction', 'PROGRAMMING', DATEADD('HOUR', -24, CURRENT_TIMESTAMP), DATEADD('MINUTE', 90, DATEADD('HOUR', -24, CURRENT_TIMESTAMP)), 90, true, 'ROOM-1701187200002', 'COMPLETED', 'PUBLIC', 2, 2, DATEADD('HOUR', -24, CURRENT_TIMESTAMP)),
('Biology Lab Report Writing', 'How to write effective lab reports for genetics experiments', 'SCIENCE', DATEADD('HOUR', -72, CURRENT_TIMESTAMP), DATEADD('MINUTE', 60, DATEADD('HOUR', -72, CURRENT_TIMESTAMP)), 60, true, 'ROOM-1700928000003', 'COMPLETED', 'PUBLIC', 3, 3, DATEADD('HOUR', -72, CURRENT_TIMESTAMP)),
('World War II Overview', 'Comprehensive review of major events, battles, and figures', 'HISTORY', DATEADD('HOUR', -120, CURRENT_TIMESTAMP), DATEADD('MINUTE', 150, DATEADD('HOUR', -120, CURRENT_TIMESTAMP)), 150, true, 'ROOM-1700755200004', 'COMPLETED', 'PUBLIC', 4, 4, DATEADD('HOUR', -120, CURRENT_TIMESTAMP)),
('Spanish Conversation Practice', 'Informal Spanish speaking session for intermediate learners', 'LANGUAGE', DATEADD('HOUR', -96, CURRENT_TIMESTAMP), DATEADD('MINUTE', 45, DATEADD('HOUR', -96, CURRENT_TIMESTAMP)), 45, true, 'ROOM-1700841600005', 'COMPLETED', 'PUBLIC', 5, 5, DATEADD('HOUR', -96, CURRENT_TIMESTAMP)),

-- COMPLETED solo sessions
('Linear Algebra Problem Set', 'Working through chapter 5 eigenvalue exercises', 'MATH', DATEADD('HOUR', -6, CURRENT_TIMESTAMP), DATEADD('MINUTE', 90, DATEADD('HOUR', -6, CURRENT_TIMESTAMP)), 90, false, 'ROOM-1701270000006', 'COMPLETED', 'PRIVATE', 1, NULL, DATEADD('HOUR', -6, CURRENT_TIMESTAMP)),
('Genetics Quiz Prep', 'Final preparation for midterm exam on Mendelian genetics', 'SCIENCE', DATEADD('HOUR', -8, CURRENT_TIMESTAMP), DATEADD('MINUTE', 120, DATEADD('HOUR', -8, CURRENT_TIMESTAMP)), 120, false, 'ROOM-1701316800007', 'COMPLETED', 'PUBLIC', 3, NULL, DATEADD('HOUR', -8, CURRENT_TIMESTAMP));

-- -- ACTIVE sessions (ongoing)
-- ('Python Data Structures', 'Lists, dictionaries, and sets deep dive with coding exercises', 'PROGRAMMING', DATEADD('MINUTE', -45, CURRENT_TIMESTAMP), NULL, NULL, true, 'ROOM-1701360000008', 'ACTIVE', 'PUBLIC', 2, 2, DATEADD('MINUTE', -45, CURRENT_TIMESTAMP)),
-- ('Differential Equations Review', 'Preparing for final exam - solving first and second order ODEs', 'MATH', DATEADD('MINUTE', -20, CURRENT_TIMESTAMP), NULL, NULL, true, 'ROOM-1701360000009', 'ACTIVE', 'PUBLIC', 1, 1, DATEADD('MINUTE', -20, CURRENT_TIMESTAMP));


-- Insert Session Participants
INSERT INTO session_participants (study_session_id, user_id, joined_at, left_at, minutes_participated)
VALUES
-- Session 1: Calculus Integration (completed)
(1, 1, DATEADD('HOUR', -48, CURRENT_TIMESTAMP), DATEADD('MINUTE', 120, DATEADD('HOUR', -48, CURRENT_TIMESTAMP)), 120),
(1, 2, DATEADD('MINUTE', 5, DATEADD('HOUR', -48, CURRENT_TIMESTAMP)), DATEADD('MINUTE', 120, DATEADD('HOUR', -48, CURRENT_TIMESTAMP)), 115),
(1, 3, DATEADD('HOUR', -48, CURRENT_TIMESTAMP), DATEADD('MINUTE', 110, DATEADD('HOUR', -48, CURRENT_TIMESTAMP)), 110),

-- Session 2: Java OOP (completed)
(2, 2, DATEADD('HOUR', -24, CURRENT_TIMESTAMP), DATEADD('MINUTE', 90, DATEADD('HOUR', -24, CURRENT_TIMESTAMP)), 90),
(2, 1, DATEADD('MINUTE', 10, DATEADD('HOUR', -24, CURRENT_TIMESTAMP)), DATEADD('MINUTE', 85, DATEADD('HOUR', -24, CURRENT_TIMESTAMP)), 75),
(2, 5, DATEADD('HOUR', -24, CURRENT_TIMESTAMP), DATEADD('MINUTE', 90, DATEADD('HOUR', -24, CURRENT_TIMESTAMP)), 90),

-- Session 3: Biology Lab (completed)
(3, 3, DATEADD('HOUR', -72, CURRENT_TIMESTAMP), DATEADD('MINUTE', 60, DATEADD('HOUR', -72, CURRENT_TIMESTAMP)), 60),
(3, 4, DATEADD('MINUTE', 2, DATEADD('HOUR', -72, CURRENT_TIMESTAMP)), DATEADD('MINUTE', 58, DATEADD('HOUR', -72, CURRENT_TIMESTAMP)), 56),

-- Session 4: WWII Overview (completed)
(4, 4, DATEADD('HOUR', -120, CURRENT_TIMESTAMP), DATEADD('MINUTE', 150, DATEADD('HOUR', -120, CURRENT_TIMESTAMP)), 150),
(4, 1, DATEADD('HOUR', -120, CURRENT_TIMESTAMP), DATEADD('MINUTE', 145, DATEADD('HOUR', -120, CURRENT_TIMESTAMP)), 145),
(4, 2, DATEADD('MINUTE', 15, DATEADD('HOUR', -120, CURRENT_TIMESTAMP)), DATEADD('MINUTE', 150, DATEADD('HOUR', -120, CURRENT_TIMESTAMP)), 135),

-- Session 5: Spanish Conversation (completed)
(5, 5, DATEADD('HOUR', -96, CURRENT_TIMESTAMP), DATEADD('MINUTE', 45, DATEADD('HOUR', -96, CURRENT_TIMESTAMP)), 45),
(5, 1, DATEADD('MINUTE', 3, DATEADD('HOUR', -96, CURRENT_TIMESTAMP)), DATEADD('MINUTE', 48, DATEADD('HOUR', -96, CURRENT_TIMESTAMP)), 45),
(5, 3, DATEADD('HOUR', -96, CURRENT_TIMESTAMP), DATEADD('MINUTE', 40, DATEADD('HOUR', -96, CURRENT_TIMESTAMP)), 40),

-- Session 6: Linear Algebra solo (completed)
(6, 1, DATEADD('HOUR', -6, CURRENT_TIMESTAMP), DATEADD('MINUTE', 90, DATEADD('HOUR', -6, CURRENT_TIMESTAMP)), 90),

-- Session 7: Genetics Quiz Prep (completed)
(7, 3, DATEADD('HOUR', -8, CURRENT_TIMESTAMP), DATEADD('MINUTE', 120, DATEADD('HOUR', -8, CURRENT_TIMESTAMP)), 120),
(7, 5, DATEADD('MINUTE', 10, DATEADD('HOUR', -8, CURRENT_TIMESTAMP)), DATEADD('MINUTE', 115, DATEADD('HOUR', -8, CURRENT_TIMESTAMP)), 105);

-- -- Session 8: Python Data Structures (ACTIVE - no left_at)
-- (8, 2, DATEADD('MINUTE', -45, CURRENT_TIMESTAMP), NULL, NULL),
-- (8, 5, DATEADD('MINUTE', -40, CURRENT_TIMESTAMP), NULL, NULL),
-- (8, 1, DATEADD('MINUTE', -30, CURRENT_TIMESTAMP), NULL, NULL),

-- -- Session 9: Differential Equations (ACTIVE - no left_at)
-- (9, 1, DATEADD('MINUTE', -20, CURRENT_TIMESTAMP), NULL, NULL),
-- (9, 4, DATEADD('MINUTE', -15, CURRENT_TIMESTAMP), NULL, NULL);


-- Insert Sample Activities
INSERT INTO activity (type, message, timestamp, study_session_id, user_id)
VALUES
-- Session 1 activities
('SESSION_CREATED', 'created the session', DATEADD('HOUR', -48, CURRENT_TIMESTAMP), 1, 1),
('JOINED', 'joined the session', DATEADD('MINUTE', 5, DATEADD('HOUR', -48, CURRENT_TIMESTAMP)), 1, 2),
('JOINED', 'joined the session', DATEADD('MINUTE', 1, DATEADD('HOUR', -48, CURRENT_TIMESTAMP)), 1, 3),
('HAND_RAISE', 'raised hand with question about integration limits', DATEADD('MINUTE', 30, DATEADD('HOUR', -48, CURRENT_TIMESTAMP)), 1, 1),
('MESSAGE', 'Can someone explain u-substitution again?', DATEADD('MINUTE', 45, DATEADD('HOUR', -48, CURRENT_TIMESTAMP)), 1, 3),
('MILESTONE_REACHED', 'Session completed: 120 minutes', DATEADD('MINUTE', 120, DATEADD('HOUR', -48, CURRENT_TIMESTAMP)), 1, 1),

-- Session 2 activities
('SESSION_CREATED', 'created the session', DATEADD('HOUR', -24, CURRENT_TIMESTAMP), 2, 2),
('JOINED', 'joined the session', DATEADD('MINUTE', 10, DATEADD('HOUR', -24, CURRENT_TIMESTAMP)), 2, 1),
('JOINED', 'joined the session', DATEADD('HOUR', -24, CURRENT_TIMESTAMP), 2, 5),
('MESSAGE', 'What is the difference between List and Set?', DATEADD('MINUTE', 25, DATEADD('HOUR', -24, CURRENT_TIMESTAMP)), 2, 2),
('HAND_RAISE', 'raised hand', DATEADD('MINUTE', 40, DATEADD('HOUR', -24, CURRENT_TIMESTAMP)), 2, 5),
('MILESTONE_REACHED', 'Session completed: 90 minutes', DATEADD('MINUTE', 90, DATEADD('HOUR', -24, CURRENT_TIMESTAMP)), 2, 2),

-- Session 3 activities  
('SESSION_CREATED', 'created the session', DATEADD('HOUR', -72, CURRENT_TIMESTAMP), 3, 3),
('JOINED', 'joined the session', DATEADD('MINUTE', 2, DATEADD('HOUR', -72, CURRENT_TIMESTAMP)), 3, 4),
('MESSAGE', 'Remember to cite sources properly!', DATEADD('MINUTE', 30, DATEADD('HOUR', -72, CURRENT_TIMESTAMP)), 3, 3),
('MILESTONE_REACHED', 'Session completed: 60 minutes', DATEADD('MINUTE', 60, DATEADD('HOUR', -72, CURRENT_TIMESTAMP)), 3, 3),

-- Session 4 activities
('SESSION_CREATED', 'created the session', DATEADD('HOUR', -120, CURRENT_TIMESTAMP), 4, 4),
('JOINED', 'joined the session', DATEADD('HOUR', -120, CURRENT_TIMESTAMP), 4, 1),
('JOINED', 'joined the session', DATEADD('MINUTE', 15, DATEADD('HOUR', -120, CURRENT_TIMESTAMP)), 4, 2),
('HAND_RAISE', 'raised hand with historical question', DATEADD('MINUTE', 50, DATEADD('HOUR', -120, CURRENT_TIMESTAMP)), 4, 4),
('MESSAGE', 'The Treaty of Versailles was crucial!', DATEADD('MINUTE', 80, DATEADD('HOUR', -120, CURRENT_TIMESTAMP)), 4, 1),
('MILESTONE_REACHED', 'Session completed: 150 minutes', DATEADD('MINUTE', 150, DATEADD('HOUR', -120, CURRENT_TIMESTAMP)), 4, 4),

-- Session 5 activities
('SESSION_CREATED', 'created the session', DATEADD('HOUR', -96, CURRENT_TIMESTAMP), 5, 5),
('JOINED', 'joined the session', DATEADD('MINUTE', 3, DATEADD('HOUR', -96, CURRENT_TIMESTAMP)), 5, 1),
('JOINED', 'joined the session', DATEADD('HOUR', -96, CURRENT_TIMESTAMP), 5, 3),
('MESSAGE', 'Hola! Vamos a practicar!', DATEADD('MINUTE', 10, DATEADD('HOUR', -96, CURRENT_TIMESTAMP)), 5, 5),
('MILESTONE_REACHED', 'Session completed: 45 minutes', DATEADD('MINUTE', 45, DATEADD('HOUR', -96, CURRENT_TIMESTAMP)), 5, 5);

-- -- Session 8 activities (ACTIVE Python session)
-- ('SESSION_CREATED', 'created the session', DATEADD('MINUTE', -45, CURRENT_TIMESTAMP), 8, 2),
-- ('JOINED', 'joined the session', DATEADD('MINUTE', -40, CURRENT_TIMESTAMP), 8, 5),
-- ('JOINED', 'joined the session', DATEADD('MINUTE', -30, CURRENT_TIMESTAMP), 8, 1),
-- ('MESSAGE', 'Let us start with list comprehensions!', DATEADD('MINUTE', -25, CURRENT_TIMESTAMP), 8, 2),
-- ('HAND_RAISE', 'raised hand', DATEADD('MINUTE', -10, CURRENT_TIMESTAMP), 8, 1),

-- -- Session 9 activities (ACTIVE Diff Eq session)
-- ('SESSION_CREATED', 'created the session', DATEADD('MINUTE', -20, CURRENT_TIMESTAMP), 9, 1),
-- ('JOINED', 'joined the session', DATEADD('MINUTE', -15, CURRENT_TIMESTAMP), 9, 4),
-- ('MESSAGE', 'Focus on homogeneous equations first', DATEADD('MINUTE', -5, CURRENT_TIMESTAMP), 9, 1);


-- ============================================
-- Course Administration Seed Data
-- ============================================

-- Insert Sample Courses (instructors: johndoe=1, janesmith=2)
INSERT INTO courses (title, description, instructor_id, is_published, created_at, updated_at)
VALUES
('Introduction to Calculus', 'A foundational course covering limits, derivatives, and integrals. Perfect for first-year university students.', 1, true, DATEADD('DAY', -14, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP),
('Advanced Java Programming', 'Deep dive into Java: OOP, design patterns, concurrency, and Spring Boot fundamentals.', 1, true, DATEADD('DAY', -10, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP),
('Molecular Biology Essentials', 'From DNA replication to gene expression — core concepts for life science students.', 2, true, DATEADD('DAY', -7, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP),
('Modern World History', 'A survey of major historical events from 1800 to the present day.', 2, false, DATEADD('DAY', -3, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP);


-- Insert Course Sections
INSERT INTO course_sections (title, description, order_index, course_id, created_at)
VALUES
-- Course 1: Intro to Calculus
('Chapter 1: Limits', 'Understanding the concept of a limit and continuity.', 0, 1, DATEADD('DAY', -14, CURRENT_TIMESTAMP)),
('Chapter 2: Derivatives', 'Rules of differentiation — chain rule, product rule, and more.', 1, 1, DATEADD('DAY', -13, CURRENT_TIMESTAMP)),
('Chapter 3: Integration', 'Introduction to Riemann sums, antiderivatives, and definite integrals.', 2, 1, DATEADD('DAY', -12, CURRENT_TIMESTAMP)),

-- Course 2: Advanced Java
('Module 1: OOP Refresher', 'Revisiting classes, interfaces, polymorphism, and SOLID principles.', 0, 2, DATEADD('DAY', -10, CURRENT_TIMESTAMP)),
('Module 2: Design Patterns', 'Creational, structural, and behavioural patterns with real examples.', 1, 2, DATEADD('DAY', -9, CURRENT_TIMESTAMP)),
('Module 3: Spring Boot', 'Building RESTful APIs with Spring Boot, JPA, and security.', 2, 2, DATEADD('DAY', -8, CURRENT_TIMESTAMP)),

-- Course 3: Molecular Biology
('Unit 1: DNA Structure', 'Watson-Crick model, base pairing, and genomic organisation.', 0, 3, DATEADD('DAY', -7, CURRENT_TIMESTAMP)),
('Unit 2: Gene Expression', 'Transcription, translation, and post-translational modifications.', 1, 3, DATEADD('DAY', -6, CURRENT_TIMESTAMP)),

-- Course 4: Modern World History (draft)
('Part 1: Industrial Revolution', 'Origins and global impact of industrialisation.', 0, 4, DATEADD('DAY', -3, CURRENT_TIMESTAMP));


-- Insert Course Materials (files are placeholder URLs for local dev)
INSERT INTO course_materials (title, file_url, file_type, original_file_name, section_id, uploaded_at)
VALUES
-- Calculus Section 1
('Limits Lecture Notes', '/uploads/courses/limits-lecture-notes.pdf', 'PDF', 'limits-lecture-notes.pdf', 1, DATEADD('DAY', -13, CURRENT_TIMESTAMP)),
('Limits Practice Problems', '/uploads/courses/limits-practice.pdf', 'PDF', 'limits-practice.pdf', 1, DATEADD('DAY', -13, CURRENT_TIMESTAMP)),
-- Calculus Section 2
('Derivatives Slides', '/uploads/courses/derivatives-slides.pdf', 'SLIDES', 'derivatives-slides.pdf', 2, DATEADD('DAY', -12, CURRENT_TIMESTAMP)),
-- Java Section 1
('OOP Cheatsheet', '/uploads/courses/oop-cheatsheet.pdf', 'PDF', 'oop-cheatsheet.pdf', 4, DATEADD('DAY', -9, CURRENT_TIMESTAMP)),
-- Java Section 3
('Spring Boot Getting Started', '/uploads/courses/spring-boot-intro.pdf', 'PDF', 'spring-boot-intro.pdf', 6, DATEADD('DAY', -7, CURRENT_TIMESTAMP)),
-- Biology Section 1
('DNA Structure Overview', '/uploads/courses/dna-structure.pdf', 'PDF', 'dna-structure.pdf', 7, DATEADD('DAY', -6, CURRENT_TIMESTAMP));


-- Insert Course Enrollments (students: bobwilson=3, alicejohnson=4, charliebrown=5)
INSERT INTO course_enrollments (course_id, student_id, status, enrolled_at)
VALUES
-- Calculus enrollments
(1, 3, 'ACTIVE', DATEADD('DAY', -12, CURRENT_TIMESTAMP)),
(1, 4, 'ACTIVE', DATEADD('DAY', -11, CURRENT_TIMESTAMP)),
(1, 5, 'ACTIVE', DATEADD('DAY', -10, CURRENT_TIMESTAMP)),
-- Java enrollments
(2, 3, 'ACTIVE', DATEADD('DAY', -9, CURRENT_TIMESTAMP)),
(2, 5, 'ACTIVE', DATEADD('DAY', -8, CURRENT_TIMESTAMP)),
-- Biology enrollments
(3, 4, 'ACTIVE', DATEADD('DAY', -6, CURRENT_TIMESTAMP)),
(3, 5, 'ACTIVE', DATEADD('DAY', -5, CURRENT_TIMESTAMP)),
(3, 3, 'DROPPED', DATEADD('DAY', -4, CURRENT_TIMESTAMP));