-- StudySpace Sample Data (Postgres-compatible)
-- All inserts use ON CONFLICT DO NOTHING for idempotency.

-- Insert Sample Users (password: 'password' for all)
INSERT INTO users (username, email, password, full_name, profile_picture_url, total_study_minutes, current_status, current_streak, last_study_date, role, created_at, updated_at)
VALUES
('johndoe',      'john.doe@example.com',    '$2a$10$IZ7IMsbk36K8fIARPFOCAO0bG4AfTuPMSH9toeW/pt47yQyKLFDle', 'John Doe',      '', 495, 'ONLINE',   5,  CURRENT_TIMESTAMP - INTERVAL '1 day',  'INSTRUCTOR', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('janesmith',    'jane.smith@example.com',  '$2a$10$IZ7IMsbk36K8fIARPFOCAO0bG4AfTuPMSH9toeW/pt47yQyKLFDle', 'Jane Smith',    '', 720, 'STUDYING', 12, CURRENT_TIMESTAMP,                     'INSTRUCTOR', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('bobwilson',    'bob.wilson@example.com',  '$2a$10$IZ7IMsbk36K8fIARPFOCAO0bG4AfTuPMSH9toeW/pt47yQyKLFDle', 'Bob Wilson',    '', 330, 'AWAY',     3,  CURRENT_TIMESTAMP - INTERVAL '2 days', 'STUDENT',    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('alicejohnson', 'alice.johnson@example.com','$2a$10$IZ7IMsbk36K8fIARPFOCAO0bG4AfTuPMSH9toeW/pt47yQyKLFDle','Alice Johnson', '', 890, 'ONLINE',   21, CURRENT_TIMESTAMP - INTERVAL '1 day',  'STUDENT',    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('charliebrown', 'charlie.brown@example.com','$2a$10$IZ7IMsbk36K8fIARPFOCAO0bG4AfTuPMSH9toeW/pt47yQyKLFDle','Charlie Brown', '', 240, 'ONLINE',   7,  CURRENT_TIMESTAMP,                     'STUDENT',    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (username) DO NOTHING;



-- Insert Sample Study Sessions
INSERT INTO study_sessions (title, description, subject, start_time, end_time, duration_minutes, room_code, status, visibility, user_id, created_at)
VALUES
('Calculus Integration Techniques', 'Deep dive into substitution and integration by parts', 'MATH',        CURRENT_TIMESTAMP - INTERVAL '48 hours', CURRENT_TIMESTAMP - INTERVAL '46 hours', 120, 'ROOM-1701100800001', 'COMPLETED', 'PUBLIC',   1, CURRENT_TIMESTAMP - INTERVAL '48 hours'),
('Java OOP Concepts',               'Reviewing inheritance, polymorphism, and abstraction',  'PROGRAMMING', CURRENT_TIMESTAMP - INTERVAL '24 hours', CURRENT_TIMESTAMP - INTERVAL '22.5 hours', 90,  'ROOM-1701187200002', 'COMPLETED', 'PUBLIC',   2, CURRENT_TIMESTAMP - INTERVAL '24 hours'),
('Biology Lab Report Writing',      'How to write effective lab reports',                     'SCIENCE',     CURRENT_TIMESTAMP - INTERVAL '72 hours', CURRENT_TIMESTAMP - INTERVAL '71 hours', 60,   'ROOM-1700928000003', 'COMPLETED', 'PUBLIC',   3, CURRENT_TIMESTAMP - INTERVAL '72 hours'),
('World War II Overview',           'Comprehensive review of major events, battles, and figures', 'HISTORY', CURRENT_TIMESTAMP - INTERVAL '120 hours', CURRENT_TIMESTAMP - INTERVAL '117.5 hours', 150, 'ROOM-1700755200004', 'COMPLETED', 'PUBLIC',  4, CURRENT_TIMESTAMP - INTERVAL '120 hours'),
('Spanish Conversation Practice',   'Informal Spanish speaking session for intermediate learners', 'LANGUAGE', CURRENT_TIMESTAMP - INTERVAL '96 hours', CURRENT_TIMESTAMP - INTERVAL '95.25 hours', 45, 'ROOM-1700841600005', 'COMPLETED', 'PUBLIC', 5, CURRENT_TIMESTAMP - INTERVAL '96 hours'),
('Linear Algebra Problem Set',      'Working through chapter 5 eigenvalue exercises',          'MATH',        CURRENT_TIMESTAMP - INTERVAL '6 hours', CURRENT_TIMESTAMP - INTERVAL '4.5 hours',   90,  'ROOM-1701270000006', 'COMPLETED', 'PRIVATE',  1, CURRENT_TIMESTAMP - INTERVAL '6 hours'),
('Genetics Quiz Prep',              'Final preparation for midterm exam on Mendelian genetics', 'SCIENCE',    CURRENT_TIMESTAMP - INTERVAL '8 hours', CURRENT_TIMESTAMP - INTERVAL '6 hours',     120, 'ROOM-1701316800007', 'COMPLETED', 'PUBLIC',   3, CURRENT_TIMESTAMP - INTERVAL '8 hours')
ON CONFLICT (room_code) DO NOTHING;


-- Insert Session Participants
INSERT INTO session_participants (study_session_id, user_id, joined_at, left_at, minutes_participated)
VALUES
(1, 1, CURRENT_TIMESTAMP - INTERVAL '48 hours',             CURRENT_TIMESTAMP - INTERVAL '46 hours', 120),
(1, 2, CURRENT_TIMESTAMP - INTERVAL '48 hours' + INTERVAL '5 minutes',  CURRENT_TIMESTAMP - INTERVAL '46 hours', 115),
(1, 3, CURRENT_TIMESTAMP - INTERVAL '48 hours',             CURRENT_TIMESTAMP - INTERVAL '46.17 hours', 110),
(2, 2, CURRENT_TIMESTAMP - INTERVAL '24 hours',             CURRENT_TIMESTAMP - INTERVAL '22.5 hours',  90),
(2, 1, CURRENT_TIMESTAMP - INTERVAL '24 hours' + INTERVAL '10 minutes', CURRENT_TIMESTAMP - INTERVAL '22.58 hours', 75),
(2, 5, CURRENT_TIMESTAMP - INTERVAL '24 hours',             CURRENT_TIMESTAMP - INTERVAL '22.5 hours',  90),
(3, 3, CURRENT_TIMESTAMP - INTERVAL '72 hours',             CURRENT_TIMESTAMP - INTERVAL '71 hours',    60),
(3, 4, CURRENT_TIMESTAMP - INTERVAL '72 hours' + INTERVAL '2 minutes',  CURRENT_TIMESTAMP - INTERVAL '71.03 hours', 56),
(4, 4, CURRENT_TIMESTAMP - INTERVAL '120 hours',            CURRENT_TIMESTAMP - INTERVAL '117.5 hours', 150),
(4, 1, CURRENT_TIMESTAMP - INTERVAL '120 hours',            CURRENT_TIMESTAMP - INTERVAL '117.58 hours', 145),
(4, 2, CURRENT_TIMESTAMP - INTERVAL '120 hours' + INTERVAL '15 minutes', CURRENT_TIMESTAMP - INTERVAL '117.5 hours', 135),
(5, 5, CURRENT_TIMESTAMP - INTERVAL '96 hours',             CURRENT_TIMESTAMP - INTERVAL '95.25 hours', 45),
(5, 1, CURRENT_TIMESTAMP - INTERVAL '96 hours' + INTERVAL '3 minutes',  CURRENT_TIMESTAMP - INTERVAL '95.2 hours',  45),
(5, 3, CURRENT_TIMESTAMP - INTERVAL '96 hours',             CURRENT_TIMESTAMP - INTERVAL '95.33 hours', 40),
(6, 1, CURRENT_TIMESTAMP - INTERVAL '6 hours',              CURRENT_TIMESTAMP - INTERVAL '4.5 hours',   90),
(7, 3, CURRENT_TIMESTAMP - INTERVAL '8 hours',              CURRENT_TIMESTAMP - INTERVAL '6 hours',     120),
(7, 5, CURRENT_TIMESTAMP - INTERVAL '8 hours' + INTERVAL '10 minutes',  CURRENT_TIMESTAMP - INTERVAL '6.08 hours',  105)
ON CONFLICT (study_session_id, user_id) DO NOTHING;


-- Insert Sample Activities
INSERT INTO activity (type, message, timestamp, study_session_id, user_id)
VALUES
('SESSION_CREATED',  'created the session',                            CURRENT_TIMESTAMP - INTERVAL '48 hours',                         1, 1),
('JOINED',           'joined the session',                             CURRENT_TIMESTAMP - INTERVAL '48 hours' + INTERVAL '5 minutes',  1, 2),
('JOINED',           'joined the session',                             CURRENT_TIMESTAMP - INTERVAL '48 hours' + INTERVAL '1 minute',   1, 3),
('HAND_RAISE',       'raised hand with question about integration',    CURRENT_TIMESTAMP - INTERVAL '48 hours' + INTERVAL '30 minutes', 1, 1),
('MESSAGE',          'Can someone explain u-substitution again?',      CURRENT_TIMESTAMP - INTERVAL '48 hours' + INTERVAL '45 minutes', 1, 3),
('MILESTONE_REACHED','Session completed: 120 minutes',                 CURRENT_TIMESTAMP - INTERVAL '46 hours',                         1, 1),
('SESSION_CREATED',  'created the session',                            CURRENT_TIMESTAMP - INTERVAL '24 hours',                         2, 2),
('JOINED',           'joined the session',                             CURRENT_TIMESTAMP - INTERVAL '24 hours' + INTERVAL '10 minutes', 2, 1),
('JOINED',           'joined the session',                             CURRENT_TIMESTAMP - INTERVAL '24 hours',                         2, 5),
('MESSAGE',          'What is the difference between List and Set?',   CURRENT_TIMESTAMP - INTERVAL '24 hours' + INTERVAL '25 minutes', 2, 2),
('HAND_RAISE',       'raised hand',                                    CURRENT_TIMESTAMP - INTERVAL '24 hours' + INTERVAL '40 minutes', 2, 5),
('MILESTONE_REACHED','Session completed: 90 minutes',                  CURRENT_TIMESTAMP - INTERVAL '22.5 hours',                       2, 2),
('SESSION_CREATED',  'created the session',                            CURRENT_TIMESTAMP - INTERVAL '72 hours',                         3, 3),
('JOINED',           'joined the session',                             CURRENT_TIMESTAMP - INTERVAL '72 hours' + INTERVAL '2 minutes',  3, 4),
('MESSAGE',          'Remember to cite sources properly!',             CURRENT_TIMESTAMP - INTERVAL '72 hours' + INTERVAL '30 minutes', 3, 3),
('MILESTONE_REACHED','Session completed: 60 minutes',                  CURRENT_TIMESTAMP - INTERVAL '71 hours',                         3, 3),
('SESSION_CREATED',  'created the session',                            CURRENT_TIMESTAMP - INTERVAL '120 hours',                        4, 4),
('JOINED',           'joined the session',                             CURRENT_TIMESTAMP - INTERVAL '120 hours',                        4, 1),
('JOINED',           'joined the session',                             CURRENT_TIMESTAMP - INTERVAL '120 hours' + INTERVAL '15 minutes',4, 2),
('HAND_RAISE',       'raised hand with historical question',           CURRENT_TIMESTAMP - INTERVAL '120 hours' + INTERVAL '50 minutes',4, 4),
('MESSAGE',          'The Treaty of Versailles was crucial!',          CURRENT_TIMESTAMP - INTERVAL '120 hours' + INTERVAL '80 minutes',4, 1),
('MILESTONE_REACHED','Session completed: 150 minutes',                 CURRENT_TIMESTAMP - INTERVAL '117.5 hours',                      4, 4),
('SESSION_CREATED',  'created the session',                            CURRENT_TIMESTAMP - INTERVAL '96 hours',                         5, 5),
('JOINED',           'joined the session',                             CURRENT_TIMESTAMP - INTERVAL '96 hours' + INTERVAL '3 minutes',  5, 1),
('JOINED',           'joined the session',                             CURRENT_TIMESTAMP - INTERVAL '96 hours',                         5, 3),
('MESSAGE',          'Hola! Vamos a practicar!',                       CURRENT_TIMESTAMP - INTERVAL '96 hours' + INTERVAL '10 minutes', 5, 5),
('MILESTONE_REACHED','Session completed: 45 minutes',                  CURRENT_TIMESTAMP - INTERVAL '95.25 hours',                      5, 5)
;


-- ============================================
-- Course Administration Seed Data
-- ============================================

INSERT INTO courses (title, description, instructor_id, is_published, created_at, updated_at)
VALUES
('Introduction to Calculus',    'A foundational course covering limits, derivatives, and integrals.', 1, true,  CURRENT_TIMESTAMP - INTERVAL '14 days', CURRENT_TIMESTAMP),
('Advanced Java Programming',   'Deep dive into Java: OOP, design patterns, concurrency, and Spring Boot.', 1, true,  CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP),
('Molecular Biology Essentials','From DNA replication to gene expression.',                            2, true,  CURRENT_TIMESTAMP - INTERVAL '7 days',  CURRENT_TIMESTAMP),
('Modern World History',        'A survey of major historical events from 1800 to the present day.',   2, false, CURRENT_TIMESTAMP - INTERVAL '3 days',  CURRENT_TIMESTAMP)
ON CONFLICT (title) DO NOTHING;


INSERT INTO course_sections (title, description, order_index, course_id, created_at)
VALUES
('Chapter 1: Limits',       'Understanding the concept of a limit and continuity.',                0, 1, CURRENT_TIMESTAMP - INTERVAL '14 days'),
('Chapter 2: Derivatives',  'Rules of differentiation — chain rule, product rule, and more.',     1, 1, CURRENT_TIMESTAMP - INTERVAL '13 days'),
('Chapter 3: Integration',  'Introduction to Riemann sums, antiderivatives, and definite integrals.', 2, 1, CURRENT_TIMESTAMP - INTERVAL '12 days'),
('Module 1: OOP Refresher', 'Revisiting classes, interfaces, polymorphism, and SOLID principles.', 0, 2, CURRENT_TIMESTAMP - INTERVAL '10 days'),
('Module 2: Design Patterns','Creational, structural, and behavioural patterns with real examples.', 1, 2, CURRENT_TIMESTAMP - INTERVAL '9 days'),
('Module 3: Spring Boot',   'Building RESTful APIs with Spring Boot, JPA, and security.',          2, 2, CURRENT_TIMESTAMP - INTERVAL '8 days'),
('Unit 1: DNA Structure',   'Watson-Crick model, base pairing, and genomic organisation.',         0, 3, CURRENT_TIMESTAMP - INTERVAL '7 days'),
('Unit 2: Gene Expression', 'Transcription, translation, and post-translational modifications.',   1, 3, CURRENT_TIMESTAMP - INTERVAL '6 days'),
('Part 1: Industrial Revolution','Origins and global impact of industrialisation.',                 0, 4, CURRENT_TIMESTAMP - INTERVAL '3 days')
ON CONFLICT (course_id, title) DO NOTHING;


INSERT INTO course_materials (title, file_url, file_type, original_file_name, section_id, uploaded_at)
VALUES
('Limits Lecture Notes',       '/uploads/courses/5d01869f-dd95-475f-8a80-6383ba13057c.pdf',  'PDF',    'limits-lecture-notes.pdf',  1, CURRENT_TIMESTAMP - INTERVAL '13 days'),
('Limits Practice Problems',   '/uploads/courses/5d01869f-dd95-475f-8a80-6383ba13057c.pdf',        'PDF',    'limits-practice.pdf',       1, CURRENT_TIMESTAMP - INTERVAL '13 days'),
('Derivatives Slides',         '/uploads/courses/5d01869f-dd95-475f-8a80-6383ba13057c.pdf',     'SLIDES', 'derivatives-slides.pdf',    2, CURRENT_TIMESTAMP - INTERVAL '12 days'),
('OOP Cheatsheet',             '/uploads/courses/5d01869f-dd95-475f-8a80-6383ba13057c.pdf',         'PDF',    'oop-cheatsheet.pdf',        4, CURRENT_TIMESTAMP - INTERVAL '9 days'),
('Spring Boot Getting Started','/uploads/courses/5d01869f-dd95-475f-8a80-6383ba13057c.pdf',      'PDF',    'spring-boot-intro.pdf',     6, CURRENT_TIMESTAMP - INTERVAL '7 days'),
('DNA Structure Overview',     '/uploads/courses/5d01869f-dd95-475f-8a80-6383ba13057c.pdf',          'PDF',    'dna-structure.pdf',         7, CURRENT_TIMESTAMP - INTERVAL '6 days' )
ON CONFLICT (section_id, title) DO NOTHING;


INSERT INTO course_enrollments (course_id, student_id, status, enrolled_at)
VALUES
(1, 3, 'ACTIVE',   CURRENT_TIMESTAMP - INTERVAL '12 days'),
(1, 4, 'ACTIVE',   CURRENT_TIMESTAMP - INTERVAL '11 days'),
(1, 5, 'ACTIVE',   CURRENT_TIMESTAMP - INTERVAL '10 days'),
(2, 3, 'ACTIVE',   CURRENT_TIMESTAMP - INTERVAL '9 days'),
(2, 5, 'ACTIVE',   CURRENT_TIMESTAMP - INTERVAL '8 days'),
(3, 4, 'ACTIVE',   CURRENT_TIMESTAMP - INTERVAL '6 days'),
(3, 3, 'DROPPED',  CURRENT_TIMESTAMP - INTERVAL '4 days')
ON CONFLICT (course_id, student_id) DO NOTHING;


-- ============================================
-- Workspace System Seed Data
-- ============================================

INSERT INTO student_workspaces (name, description, owner_id, created_at, updated_at)
VALUES
('Alice Study Space', 'My personal workspace for pre-med and general studies.', 4, CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP),
('Bob Math Workspace','Workspace for advanced mathematics.',                     3, CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP)
ON CONFLICT (owner_id, name) DO NOTHING;

INSERT INTO workspace_spaces (title, description, workspace_id, forked_from_course_id, is_published, created_at, updated_at)
VALUES
('My Pre-Med Notes',                     'Self-compiled notes and diagrams.',           1, NULL, false, CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP),
('Molecular Biology Essentials (Fork)',  'Forked from the official course.',            1, 3,    false, CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP),
('Advanced Mathematics',                 'Cloned repository for advanced mathematics.', 2, 1,    false, CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP)
ON CONFLICT (workspace_id, title) DO NOTHING;

INSERT INTO workspace_sections (title, description, order_index, space_id, created_at)
VALUES
('General Biology Notes',   'Notes from textbook reading.',                           0, 1, CURRENT_TIMESTAMP - INTERVAL '5 days'),
('Unit 1: DNA Structure',   'Watson-Crick model, base pairing, and genomic organisation.', 0, 2, CURRENT_TIMESTAMP - INTERVAL '4 days'),
('Advanced Math Concepts',  'Advanced formulas and proofs.',                           0, 3, CURRENT_TIMESTAMP - INTERVAL '3 days'),
('Calculus Homework',       'Completed assignments.',                                  1, 3, CURRENT_TIMESTAMP - INTERVAL '2 days')
ON CONFLICT (space_id, title) DO NOTHING;

INSERT INTO workspace_materials (title, file_url, file_type, original_file_name, is_reference, is_hidden, section_id, uploaded_at)
SELECT * FROM (VALUES
    (CAST('Cells Diagram' AS VARCHAR),               CAST('/uploads/courses/5d01869f-dd95-475f-8a80-6383ba13057c.pdf' AS VARCHAR),                                     CAST('PDF' AS VARCHAR), CAST('cells-diagram.pdf' AS VARCHAR),                false, false, CAST(1 AS BIGINT), CAST(CURRENT_TIMESTAMP - INTERVAL '5 days' AS TIMESTAMP)),
    ('DNA Structure Overview',      '/uploads/courses/5d01869f-dd95-475f-8a80-6383ba13057c.pdf',                                        'PDF', 'dna-structure.pdf',                true,  false, 2, CURRENT_TIMESTAMP - INTERVAL '4 days'),
    ('Alice Extra DNA Notes',       '/uploads/courses/5d01869f-dd95-475f-8a80-6383ba13057c.pdf',                                   'PDF', 'extra-dna-notes.pdf',              false, false, 2, CURRENT_TIMESTAMP - INTERVAL '2 days'),
    ('Advanced Calculus Reference', '/uploads/courses/5d01869f-dd95-475f-8a80-6383ba13057c.pdf',              'PDF', 'advanced-calculus-ref.pdf',        false, false, 3, CURRENT_TIMESTAMP - INTERVAL '3 days'),
    ('Linear Algebra Cheatsheet',   '/uploads/courses/5d01869f-dd95-475f-8a80-6383ba13057c.pdf',              'PDF', 'linear-algebra-cheatsheet.pdf',    false, false, 3, CURRENT_TIMESTAMP - INTERVAL '3 days'),
    ('Assignment 1 Submission',     '/uploads/courses/5d01869f-dd95-475f-8a80-6383ba13057c.pdf',              'PDF', 'assignment-1.pdf',                 false, false, 4, CURRENT_TIMESTAMP - INTERVAL '2 days')
) AS v(title, file_url, file_type, original_file_name, is_reference, is_hidden, section_id, uploaded_at)
WHERE NOT EXISTS (
    SELECT 1 FROM workspace_materials wm WHERE wm.title = v.title AND wm.section_id = v.section_id
);

INSERT INTO contribution_proposals (status, message, target_course_id, target_section_id, source_material_id, student_id, contributor_display_name, created_at)
VALUES
('PENDING', 'I created an extra summary for the DNA structure that might be helpful for others!', 3, 7, 3, 4, 'Alice Johnson', CURRENT_TIMESTAMP - INTERVAL '1 day')
ON CONFLICT (student_id, target_course_id, target_section_id, source_material_id) DO NOTHING;

-- ============================================
-- Extra Data for Pagination and Search Testing
-- ============================================

INSERT INTO courses (title, description, instructor_id, is_published, created_at, updated_at) VALUES
('Data Structures and Algorithms', 'Learn about trees, graphs, dynamic programming.', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Operating Systems', 'Memory management, processes, threads, file systems.', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Computer Networks', 'TCP/IP, UDP, Routing protocols, Application layer.', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Database Systems', 'SQL, normalization, transactions, concurrency.', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Software Engineering', 'Agile, Scrum, SDLC, design patterns.', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Machine Learning Fundamentals', 'Linear regression, neural networks, SVMs.', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Artificial Intelligence', 'Search algorithms, logic, planning.', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Human Computer Interaction', 'UI/UX design, usability testing, heuristics.', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Cybersecurity Basics', 'Cryptography, network security, web security.', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Cloud Computing', 'AWS, Azure, Docker, Kubernetes.', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Mobile App Development', 'Android, iOS, React Native, Flutter.', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Web Technologies', 'HTML, CSS, JS, REST, GraphQL.', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Compiler Design', 'Lexical analysis, parsing, code generation.', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Computer Graphics', 'OpenGL, ray tracing, transformations.', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Distributed Systems', 'Consensus, Paxos, Raft, CAP theorem.', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Quantum Computing', 'Qubits, quantum gates, Shor algorithm.', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Blockchain Technologies', 'Bitcoin, Ethereum, smart contracts.', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (title) DO NOTHING;

INSERT INTO study_sessions (title, description, subject, start_time, end_time, duration_minutes, room_code, status, visibility, user_id, created_at) VALUES
('Group study for OS Midterm', 'Covering chapters 1-5.', 'PROGRAMMING', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '22 hours', 120, 'ROOM-OS1', 'COMPLETED', 'PUBLIC', 1, CURRENT_TIMESTAMP),
('Algorithms practice', 'Solving leetcode dynamic programming problems.', 'PROGRAMMING', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '46 hours', 120, 'ROOM-ALG1', 'COMPLETED', 'PUBLIC', 2, CURRENT_TIMESTAMP),
('Database normalization workshop', 'Reviewing BCNF and 3NF.', 'PROGRAMMING', CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '70 hours', 120, 'ROOM-DB1', 'COMPLETED', 'PUBLIC', 3, CURRENT_TIMESTAMP),
('React hooks study', 'useEffect and useState deep dive.', 'PROGRAMMING', CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '94 hours', 120, 'ROOM-WEB1', 'COMPLETED', 'PUBLIC', 4, CURRENT_TIMESTAMP),
('AWS certification prep', 'Reviewing IAM and S3.', 'PROGRAMMING', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '118 hours', 120, 'ROOM-CLOUD1', 'COMPLETED', 'PUBLIC', 5, CURRENT_TIMESTAMP),
('Machine Learning Study Group', 'Reviewing logistic regression.', 'PROGRAMMING', CURRENT_TIMESTAMP - INTERVAL '6 days', CURRENT_TIMESTAMP - INTERVAL '142 hours', 120, 'ROOM-ML1', 'COMPLETED', 'PUBLIC', 1, CURRENT_TIMESTAMP),
('Cybersecurity CTF prep', 'Practicing on HackTheBox.', 'PROGRAMMING', CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP - INTERVAL '166 hours', 120, 'ROOM-SEC1', 'COMPLETED', 'PUBLIC', 2, CURRENT_TIMESTAMP),
('Distributed systems reading group', 'Reading the Dynamo paper.', 'PROGRAMMING', CURRENT_TIMESTAMP - INTERVAL '8 days', CURRENT_TIMESTAMP - INTERVAL '190 hours', 120, 'ROOM-DIST1', 'COMPLETED', 'PUBLIC', 3, CURRENT_TIMESTAMP),
('Compiler design lab', 'Writing a simple lexer.', 'PROGRAMMING', CURRENT_TIMESTAMP - INTERVAL '9 days', CURRENT_TIMESTAMP - INTERVAL '214 hours', 120, 'ROOM-COMP1', 'COMPLETED', 'PUBLIC', 4, CURRENT_TIMESTAMP),
('Mobile app hackathon prep', 'Brainstorming ideas.', 'PROGRAMMING', CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '238 hours', 120, 'ROOM-MOB1', 'COMPLETED', 'PUBLIC', 5, CURRENT_TIMESTAMP)
ON CONFLICT (room_code) DO NOTHING;

-- ============================================
-- Super User Data
-- ============================================
INSERT INTO users (username, email, password, full_name, profile_picture_url, total_study_minutes, current_status, current_streak, last_study_date, role, created_at, updated_at)
VALUES
('superuser1', 'super.user1@example.com', '$2a$10$IZ7IMsbk36K8fIARPFOCAO0bG4AfTuPMSH9toeW/pt47yQyKLFDle', 'Super User', '', 1000, 'ONLINE', 100, CURRENT_TIMESTAMP, 'STUDENT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (username) DO NOTHING;

INSERT INTO course_enrollments (course_id, student_id, status, enrolled_at)
SELECT c.id, u.id, 'ACTIVE', CURRENT_TIMESTAMP 
FROM courses c
CROSS JOIN users u
WHERE u.username = 'superuser1'
ON CONFLICT (course_id, student_id) DO NOTHING;

INSERT INTO student_workspaces (name, description, owner_id, created_at, updated_at)
SELECT 'Super Workspace', 'All forked courses', id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users WHERE username = 'superuser1'
ON CONFLICT (owner_id, name) DO NOTHING;

INSERT INTO workspace_spaces (title, description, workspace_id, forked_from_course_id, is_published, created_at, updated_at)
SELECT c.title || ' (Fork)', c.description, sw.id, c.id, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM courses c
CROSS JOIN student_workspaces sw
INNER JOIN users u ON sw.owner_id = u.id
WHERE u.username = 'superuser1'
ON CONFLICT (workspace_id, title) DO NOTHING;

-- ============================================
-- Extra Workspaces and Spaces for Collaboration
-- ============================================

-- Workspaces for John Doe (1) and Jane Smith (2)
INSERT INTO student_workspaces (name, description, owner_id, created_at, updated_at)
VALUES
('John Collaboration Hub', 'Space for group study and notes sharing.', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Jane Biology Notes', 'Personal and shared biology notes.', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (owner_id, name) DO NOTHING;

-- Brand new spaces (not forked)
INSERT INTO workspace_spaces (title, description, workspace_id, forked_from_course_id, is_published, sharing_enabled, created_at, updated_at)
VALUES
('Calculus Group Study', 'Let''s solve problems together', (SELECT id FROM student_workspaces WHERE name = 'John Collaboration Hub' AND owner_id = 1), NULL, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Genetics Lab Project', 'Research and notes on genetics', (SELECT id FROM student_workspaces WHERE name = 'Jane Biology Notes' AND owner_id = 2), NULL, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (workspace_id, title) DO NOTHING;

-- Let superuser1 join these spaces
INSERT INTO space_guests (space_id, user_id, joined_at)
SELECT ws.id, u.id, CURRENT_TIMESTAMP
FROM workspace_spaces ws
CROSS JOIN users u
WHERE u.username = 'superuser1' AND ws.title IN ('Calculus Group Study', 'Genetics Lab Project')
ON CONFLICT (space_id, user_id) DO NOTHING;
-- ============================================
-- Super User Seed Data
-- ============================================

INSERT INTO users (username, email, password, full_name, profile_picture_url, total_study_minutes, current_status, current_streak, last_study_date, role, created_at, updated_at)
VALUES ('superuser', 'super.user@example.com', '$2a$10$IZ7IMsbk36K8fIARPFOCAO0bG4AfTuPMSH9toeW/pt47yQyKLFDle', 'Super User', '', 1000, 'ONLINE', 100, CURRENT_TIMESTAMP, 'STUDENT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (username) DO NOTHING;

-- Enroll super user in all courses
INSERT INTO course_enrollments (course_id, student_id, status, enrolled_at)
SELECT id, (SELECT id FROM users WHERE username = 'superuser'), 'ACTIVE', CURRENT_TIMESTAMP FROM courses
ON CONFLICT (course_id, student_id) DO NOTHING;

-- Create a workspace for super user
INSERT INTO student_workspaces (name, description, owner_id, created_at, updated_at)
VALUES ('Super Workspace', 'Workspace for Super User', (SELECT id FROM users WHERE username = 'superuser'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (owner_id, name) DO NOTHING;

-- Fork all courses for super user
INSERT INTO workspace_spaces (title, description, workspace_id, forked_from_course_id, is_published, created_at, updated_at)
SELECT title || ' (Fork)', 'Forked from course', (SELECT id FROM student_workspaces WHERE owner_id = (SELECT id FROM users WHERE username = 'superuser')), id, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM courses
ON CONFLICT (workspace_id, title) DO NOTHING;

-- Create some brand new spaces for other users
INSERT INTO workspace_spaces (title, description, workspace_id, forked_from_course_id, is_published, created_at, updated_at)
VALUES ('Alice Brand New Space', 'Brand new space for Alice', (SELECT id FROM student_workspaces WHERE name = 'Alice Study Space'), NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ('Bob Brand New Space', 'Brand new space for Bob', (SELECT id FROM student_workspaces WHERE name = 'Bob Math Workspace'), NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (workspace_id, title) DO NOTHING;

-- Add super user as guest to those new spaces
INSERT INTO space_guests (space_id, user_id, joined_at)
VALUES ((SELECT id FROM workspace_spaces WHERE title = 'Alice Brand New Space'), (SELECT id FROM users WHERE username = 'superuser'), CURRENT_TIMESTAMP),
       ((SELECT id FROM workspace_spaces WHERE title = 'Bob Brand New Space'), (SELECT id FROM users WHERE username = 'superuser'), CURRENT_TIMESTAMP)
ON CONFLICT (space_id, user_id) DO NOTHING;

-- ============================================
-- Populate Sections and Materials for Forked Spaces
-- ============================================

-- Create sections for all forked spaces
INSERT INTO workspace_sections (title, description, order_index, space_id, created_at, created_by)
SELECT cs.title, cs.description, cs.order_index, ws.id, CURRENT_TIMESTAMP, sw.owner_id
FROM course_sections cs
JOIN workspace_spaces ws ON ws.forked_from_course_id = cs.course_id
JOIN student_workspaces sw ON ws.workspace_id = sw.id
ON CONFLICT (space_id, title) DO NOTHING;

-- Create materials for all forked spaces
INSERT INTO workspace_materials (title, file_url, file_type, original_file_name, is_reference, is_hidden, section_id, uploaded_at, created_by)
SELECT cm.title, cm.file_url, cm.file_type, cm.original_file_name, true, false, ws_sec.id, CURRENT_TIMESTAMP, sw.owner_id
FROM course_materials cm
JOIN course_sections cs ON cm.section_id = cs.id
JOIN workspace_spaces ws ON ws.forked_from_course_id = cs.course_id
JOIN student_workspaces sw ON ws.workspace_id = sw.id
JOIN workspace_sections ws_sec ON ws_sec.space_id = ws.id AND ws_sec.title = cs.title
WHERE NOT EXISTS (
    SELECT 1 FROM workspace_materials wm WHERE wm.section_id = ws_sec.id AND wm.title = cm.title
);
