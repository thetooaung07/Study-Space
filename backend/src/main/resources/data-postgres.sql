
-- StudySpace Sample Data for PostgreSQL
-- Seed data for development and testing

-- Insert Sample Users (password: 'password' for all)
INSERT INTO users (username, email, password, full_name, profile_picture_url, total_study_minutes, current_status, current_streak, last_study_date, created_at, updated_at)
VALUES
('johndoe', 'john.doe@example.com', '$2a$10$IZ7IMsbk36K8fIARPFOCAO0bG4AfTuPMSH9toeW/pt47yQyKLFDle', 'John Doe', '', 495, 'ONLINE', 5, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('janesmith', 'jane.smith@example.com', '$2a$10$IZ7IMsbk36K8fIARPFOCAO0bG4AfTuPMSH9toeW/pt47yQyKLFDle', 'Jane Smith', '', 720, 'STUDYING', 12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('bobwilson', 'bob.wilson@example.com', '$2a$10$IZ7IMsbk36K8fIARPFOCAO0bG4AfTuPMSH9toeW/pt47yQyKLFDle', 'Bob Wilson', '', 330, 'AWAY', 3, CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('alicejohnson', 'alice.johnson@example.com', '$2a$10$IZ7IMsbk36K8fIARPFOCAO0bG4AfTuPMSH9toeW/pt47yQyKLFDle', 'Alice Johnson', '', 890, 'ONLINE', 21, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('charliebrown', 'charlie.brown@example.com', '$2a$10$IZ7IMsbk36K8fIARPFOCAO0bG4AfTuPMSH9toeW/pt47yQyKLFDle', 'Charlie Brown', '', 240, 'ONLINE', 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;


-- Insert Sample Study Groups
INSERT INTO study_groups (name, description, invite_code, group_type, creator_id, created_at, updated_at)
VALUES
('Advanced Mathematics', 'A group for students tackling advanced calculus, linear algebra, and differential equations. Weekly problem-solving sessions!', 'MATH2024', 'PUBLIC', 1, CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP),
('Programming Masters', 'Java, Python, and C++ programming enthusiasts. Code reviews, algorithm challenges, and project collaboration.', 'PROG5678', 'PUBLIC', 2, CURRENT_TIMESTAMP - INTERVAL '25 days', CURRENT_TIMESTAMP),
('Biology Study Circle', 'Focused on cellular biology, genetics, and molecular biology. Perfect for pre-med students!', 'BIO1234', 'INVITE_ONLY', 3, CURRENT_TIMESTAMP - INTERVAL '20 days', CURRENT_TIMESTAMP),
('History Nerds United', 'Medieval and modern history discussion group. From ancient civilizations to contemporary events.', 'HIST9999', 'PUBLIC', 4, CURRENT_TIMESTAMP - INTERVAL '15 days', CURRENT_TIMESTAMP),
('Language Learning Crew', 'Spanish, French, and German language practice. Conversation practice and grammar help!', 'LANG5555', 'PUBLIC', 5, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;


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
(3, 5)
ON CONFLICT DO NOTHING;


-- Insert Sample Study Sessions (Mix of COMPLETED and ACTIVE)
INSERT INTO study_sessions (title, description, subject, start_time, end_time, duration_minutes, is_group_session, room_code, status, visibility, user_id, study_group_id, created_at)
VALUES
-- COMPLETED group sessions
('Calculus Integration Techniques', 'Deep dive into substitution and integration by parts', 'MATH', CURRENT_TIMESTAMP - INTERVAL '48 hours', CURRENT_TIMESTAMP - INTERVAL '48 hours' + INTERVAL '120 minutes', 120, true, 'ROOM-1701100800001', 'COMPLETED', 'PUBLIC', 1, 1, CURRENT_TIMESTAMP - INTERVAL '48 hours'),
('Java OOP Concepts', 'Reviewing inheritance, polymorphism, and abstraction', 'PROGRAMMING', CURRENT_TIMESTAMP - INTERVAL '24 hours', CURRENT_TIMESTAMP - INTERVAL '24 hours' + INTERVAL '90 minutes', 90, true, 'ROOM-1701187200002', 'COMPLETED', 'PUBLIC', 2, 2, CURRENT_TIMESTAMP - INTERVAL '24 hours'),
('Biology Lab Report Writing', 'How to write effective lab reports for genetics experiments', 'SCIENCE', CURRENT_TIMESTAMP - INTERVAL '72 hours', CURRENT_TIMESTAMP - INTERVAL '72 hours' + INTERVAL '60 minutes', 60, true, 'ROOM-1700928000003', 'COMPLETED', 'PUBLIC', 3, 3, CURRENT_TIMESTAMP - INTERVAL '72 hours'),
('World War II Overview', 'Comprehensive review of major events, battles, and figures', 'HISTORY', CURRENT_TIMESTAMP - INTERVAL '120 hours', CURRENT_TIMESTAMP - INTERVAL '120 hours' + INTERVAL '150 minutes', 150, true, 'ROOM-1700755200004', 'COMPLETED', 'PUBLIC', 4, 4, CURRENT_TIMESTAMP - INTERVAL '120 hours'),
('Spanish Conversation Practice', 'Informal Spanish speaking session for intermediate learners', 'LANGUAGE', CURRENT_TIMESTAMP - INTERVAL '96 hours', CURRENT_TIMESTAMP - INTERVAL '96 hours' + INTERVAL '45 minutes', 45, true, 'ROOM-1700841600005', 'COMPLETED', 'PUBLIC', 5, 5, CURRENT_TIMESTAMP - INTERVAL '96 hours'),

-- COMPLETED solo sessions
('Linear Algebra Problem Set', 'Working through chapter 5 eigenvalue exercises', 'MATH', CURRENT_TIMESTAMP - INTERVAL '6 hours', CURRENT_TIMESTAMP - INTERVAL '6 hours' + INTERVAL '90 minutes', 90, false, 'ROOM-1701270000006', 'COMPLETED', 'PRIVATE', 1, NULL, CURRENT_TIMESTAMP - INTERVAL '6 hours'),
('Genetics Quiz Prep', 'Final preparation for midterm exam on Mendelian genetics', 'SCIENCE', CURRENT_TIMESTAMP - INTERVAL '8 hours', CURRENT_TIMESTAMP - INTERVAL '8 hours' + INTERVAL '120 minutes', 120, false, 'ROOM-1701316800007', 'COMPLETED', 'PUBLIC', 3, NULL, CURRENT_TIMESTAMP - INTERVAL '8 hours')
ON CONFLICT DO NOTHING;


-- Insert Session Participants
INSERT INTO session_participants (study_session_id, user_id, joined_at, left_at, minutes_participated)
VALUES
-- Session 1: Calculus Integration (completed)
(1, 1, CURRENT_TIMESTAMP - INTERVAL '48 hours', CURRENT_TIMESTAMP - INTERVAL '48 hours' + INTERVAL '120 minutes', 120),
(1, 2, CURRENT_TIMESTAMP - INTERVAL '48 hours' + INTERVAL '5 minutes', CURRENT_TIMESTAMP - INTERVAL '48 hours' + INTERVAL '120 minutes', 115),
(1, 3, CURRENT_TIMESTAMP - INTERVAL '48 hours', CURRENT_TIMESTAMP - INTERVAL '48 hours' + INTERVAL '110 minutes', 110),

-- Session 2: Java OOP (completed)
(2, 2, CURRENT_TIMESTAMP - INTERVAL '24 hours', CURRENT_TIMESTAMP - INTERVAL '24 hours' + INTERVAL '90 minutes', 90),
(2, 1, CURRENT_TIMESTAMP - INTERVAL '24 hours' + INTERVAL '10 minutes', CURRENT_TIMESTAMP - INTERVAL '24 hours' + INTERVAL '85 minutes', 75),
(2, 5, CURRENT_TIMESTAMP - INTERVAL '24 hours', CURRENT_TIMESTAMP - INTERVAL '24 hours' + INTERVAL '90 minutes', 90),

-- Session 3: Biology Lab (completed)
(3, 3, CURRENT_TIMESTAMP - INTERVAL '72 hours', CURRENT_TIMESTAMP - INTERVAL '72 hours' + INTERVAL '60 minutes', 60),
(3, 4, CURRENT_TIMESTAMP - INTERVAL '72 hours' + INTERVAL '2 minutes', CURRENT_TIMESTAMP - INTERVAL '72 hours' + INTERVAL '58 minutes', 56),

-- Session 4: WWII Overview (completed)
(4, 4, CURRENT_TIMESTAMP - INTERVAL '120 hours', CURRENT_TIMESTAMP - INTERVAL '120 hours' + INTERVAL '150 minutes', 150),
(4, 1, CURRENT_TIMESTAMP - INTERVAL '120 hours', CURRENT_TIMESTAMP - INTERVAL '120 hours' + INTERVAL '145 minutes', 145),
(4, 2, CURRENT_TIMESTAMP - INTERVAL '120 hours' + INTERVAL '15 minutes', CURRENT_TIMESTAMP - INTERVAL '120 hours' + INTERVAL '150 minutes', 135),

-- Session 5: Spanish Conversation (completed)
(5, 5, CURRENT_TIMESTAMP - INTERVAL '96 hours', CURRENT_TIMESTAMP - INTERVAL '96 hours' + INTERVAL '45 minutes', 45),
(5, 1, CURRENT_TIMESTAMP - INTERVAL '96 hours' + INTERVAL '3 minutes', CURRENT_TIMESTAMP - INTERVAL '96 hours' + INTERVAL '48 minutes', 45),
(5, 3, CURRENT_TIMESTAMP - INTERVAL '96 hours', CURRENT_TIMESTAMP - INTERVAL '96 hours' + INTERVAL '40 minutes', 40),

-- Session 6: Linear Algebra solo (completed)
(6, 1, CURRENT_TIMESTAMP - INTERVAL '6 hours', CURRENT_TIMESTAMP - INTERVAL '6 hours' + INTERVAL '90 minutes', 90),

-- Session 7: Genetics Quiz Prep (completed)
(7, 3, CURRENT_TIMESTAMP - INTERVAL '8 hours', CURRENT_TIMESTAMP - INTERVAL '8 hours' + INTERVAL '120 minutes', 120),
(7, 5, CURRENT_TIMESTAMP - INTERVAL '8 hours' + INTERVAL '10 minutes', CURRENT_TIMESTAMP - INTERVAL '8 hours' + INTERVAL '115 minutes', 105)
ON CONFLICT DO NOTHING;


-- Insert Sample Activities
INSERT INTO activity (type, message, timestamp, study_session_id, user_id)
VALUES
-- Session 1 activities
('SESSION_CREATED', 'created the session', CURRENT_TIMESTAMP - INTERVAL '48 hours', 1, 1),
('JOINED', 'joined the session', CURRENT_TIMESTAMP - INTERVAL '48 hours' + INTERVAL '5 minutes', 1, 2),
('JOINED', 'joined the session', CURRENT_TIMESTAMP - INTERVAL '48 hours' + INTERVAL '1 minute', 1, 3),
('HAND_RAISE', 'raised hand with question about integration limits', CURRENT_TIMESTAMP - INTERVAL '48 hours' + INTERVAL '30 minutes', 1, 1),
('MESSAGE', 'Can someone explain u-substitution again?', CURRENT_TIMESTAMP - INTERVAL '48 hours' + INTERVAL '45 minutes', 1, 3),
('MILESTONE_REACHED', 'Session completed: 120 minutes', CURRENT_TIMESTAMP - INTERVAL '48 hours' + INTERVAL '120 minutes', 1, 1),

-- Session 2 activities
('SESSION_CREATED', 'created the session', CURRENT_TIMESTAMP - INTERVAL '24 hours', 2, 2),
('JOINED', 'joined the session', CURRENT_TIMESTAMP - INTERVAL '24 hours' + INTERVAL '10 minutes', 2, 1),
('JOINED', 'joined the session', CURRENT_TIMESTAMP - INTERVAL '24 hours', 2, 5),
('MESSAGE', 'What is the difference between List and Set?', CURRENT_TIMESTAMP - INTERVAL '24 hours' + INTERVAL '25 minutes', 2, 2),
('HAND_RAISE', 'raised hand', CURRENT_TIMESTAMP - INTERVAL '24 hours' + INTERVAL '40 minutes', 2, 5),
('MILESTONE_REACHED', 'Session completed: 90 minutes', CURRENT_TIMESTAMP - INTERVAL '24 hours' + INTERVAL '90 minutes', 2, 2),

-- Session 3 activities  
('SESSION_CREATED', 'created the session', CURRENT_TIMESTAMP - INTERVAL '72 hours', 3, 3),
('JOINED', 'joined the session', CURRENT_TIMESTAMP - INTERVAL '72 hours' + INTERVAL '2 minutes', 3, 4),
('MESSAGE', 'Remember to cite sources properly!', CURRENT_TIMESTAMP - INTERVAL '72 hours' + INTERVAL '30 minutes', 3, 3),
('MILESTONE_REACHED', 'Session completed: 60 minutes', CURRENT_TIMESTAMP - INTERVAL '72 hours' + INTERVAL '60 minutes', 3, 3),

-- Session 4 activities
('SESSION_CREATED', 'created the session', CURRENT_TIMESTAMP - INTERVAL '120 hours', 4, 4),
('JOINED', 'joined the session', CURRENT_TIMESTAMP - INTERVAL '120 hours', 4, 1),
('JOINED', 'joined the session', CURRENT_TIMESTAMP - INTERVAL '120 hours' + INTERVAL '15 minutes', 4, 2),
('HAND_RAISE', 'raised hand with historical question', CURRENT_TIMESTAMP - INTERVAL '120 hours' + INTERVAL '50 minutes', 4, 4),
('MESSAGE', 'The Treaty of Versailles was crucial!', CURRENT_TIMESTAMP - INTERVAL '120 hours' + INTERVAL '80 minutes', 4, 1),
('MILESTONE_REACHED', 'Session completed: 150 minutes', CURRENT_TIMESTAMP - INTERVAL '120 hours' + INTERVAL '150 minutes', 4, 4),

-- Session 5 activities
('SESSION_CREATED', 'created the session', CURRENT_TIMESTAMP - INTERVAL '96 hours', 5, 5),
('JOINED', 'joined the session', CURRENT_TIMESTAMP - INTERVAL '96 hours' + INTERVAL '3 minutes', 5, 1),
('JOINED', 'joined the session', CURRENT_TIMESTAMP - INTERVAL '96 hours', 5, 3),
('MESSAGE', 'Hola! Vamos a practicar!', CURRENT_TIMESTAMP - INTERVAL '96 hours' + INTERVAL '10 minutes', 5, 5),
('MILESTONE_REACHED', 'Session completed: 45 minutes', CURRENT_TIMESTAMP - INTERVAL '96 hours' + INTERVAL '45 minutes', 5, 5)
ON CONFLICT DO NOTHING;
