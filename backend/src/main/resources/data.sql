-- Insert Sample Users
INSERT INTO users (username, email, password, full_name, profile_picture_url, total_study_minutes, current_status, created_at, updated_at)
VALUES
('johndoe', 'john.doe@example.com', '$2a$10$IZ7IMsbk36K8fIARPFOCAO0bG4AfTuPMSH9toeW/pt47yQyKLFDle', 'John Doe', 'https://api.example.com/avatars/john.jpg', 450, 'OFFLINE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('janesmith', 'jane.smith@example.com', '$2a$10$IZ7IMsbk36K8fIARPFOCAO0bG4AfTuPMSH9toeW/pt47yQyKLFDle', 'Jane Smith', 'https://api.example.com/avatars/jane.jpg', 720, 'STUDYING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('bobwilson', 'bob.wilson@example.com', '$2a$10$IZ7IMsbk36K8fIARPFOCAO0bG4AfTuPMSH9toeW/pt47yQyKLFDle', 'Bob Wilson', 'https://api.example.com/avatars/bob.jpg', 300, 'AWAY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('alicejohnson', 'alice.johnson@example.com', '$2a$10$IZ7IMsbk36K8fIARPFOCAO0bG4AfTuPMSH9toeW/pt47yQyKLFDle', 'Alice Johnson', 'https://api.example.com/avatars/alice.jpg', 600, 'OFFLINE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('charliebrown', 'charlie.brown@example.com', '$2a$10$IZ7IMsbk36K8fIARPFOCAO0bG4AfTuPMSH9toeW/pt47yQyKLFDle', 'Charlie Brown', 'https://api.example.com/avatars/charlie.jpg', 900, 'STUDYING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert Sample Study Groups
INSERT INTO study_groups (name, description, invite_code, is_private, creator_id, created_at, updated_at)
VALUES
('Advanced Mathematics', 'A group for students tackling advanced calculus and linear algebra problems', 'MATH2024', false, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Programming Masters', 'Java, Python, and C++ programming enthusiasts', 'PROG5678', false, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Biology Study Circle', 'Focused on cellular biology and genetics', 'BIO1234', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('History Nerds United', 'Medieval and modern history discussion group', 'HIST9999', false, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Language Learning Crew', 'Spanish, French, and German language practice', 'LANG5555', false, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert Group Members (Many-to-Many)
INSERT INTO group_members (user_id, group_id, joined_at, role)
VALUES
(1, 1, CURRENT_TIMESTAMP, 'ADMIN'),
(2, 1, DATEADD('HOUR', -168, CURRENT_TIMESTAMP), 'MEMBER'),
(3, 1, DATEADD('HOUR', -336, CURRENT_TIMESTAMP), 'MEMBER'),
(4, 1, DATEADD('HOUR', -72, CURRENT_TIMESTAMP), 'MEMBER'),
(2, 2, CURRENT_TIMESTAMP, 'ADMIN'),
(1, 2, DATEADD('HOUR', -120, CURRENT_TIMESTAMP), 'MEMBER'),
(5, 2, DATEADD('HOUR', -240, CURRENT_TIMESTAMP), 'MEMBER'),
(3, 3, CURRENT_TIMESTAMP, 'ADMIN'),
(4, 3, DATEADD('HOUR', -48, CURRENT_TIMESTAMP), 'MEMBER'),
(5, 3, DATEADD('HOUR', -192, CURRENT_TIMESTAMP), 'MEMBER'),
(4, 4, CURRENT_TIMESTAMP, 'ADMIN'),
(1, 4, DATEADD('HOUR', -144, CURRENT_TIMESTAMP), 'MEMBER'),
(2, 4, DATEADD('HOUR', -24, CURRENT_TIMESTAMP), 'MEMBER'),
(5, 5, CURRENT_TIMESTAMP, 'ADMIN'),
(1, 5, DATEADD('HOUR', -96, CURRENT_TIMESTAMP), 'MEMBER'),
(3, 5, DATEADD('HOUR', -216, CURRENT_TIMESTAMP), 'MEMBER');

-- Insert Sample Study Sessions
INSERT INTO study_sessions (title, description, subject, start_time, end_time, duration_minutes, is_group_session, room_code, status, user_id, study_group_id, created_at)
VALUES
('Calculus Integration Techniques', 'Deep dive into substitution and integration by parts', 'MATH', DATEADD('HOUR', -48, CURRENT_TIMESTAMP), DATEADD('MINUTE', 72, DATEADD('HOUR', -48, CURRENT_TIMESTAMP)), 120, true, 'ROOM-1701100800000', 'COMPLETED', 1, 1, DATEADD('HOUR', -48, CURRENT_TIMESTAMP)),
('Java OOP Concepts', 'Reviewing inheritance, polymorphism, and abstraction', 'PROGRAMMING', DATEADD('HOUR', -24, CURRENT_TIMESTAMP), DATEADD('MINUTE', 90, DATEADD('HOUR', -24, CURRENT_TIMESTAMP)), 90, true, 'ROOM-1701187200000', 'COMPLETED', 2, 2, DATEADD('HOUR', -24, CURRENT_TIMESTAMP)),
('Biology Lab Report Writing', 'How to write effective lab reports', 'SCIENCE', DATEADD('HOUR', -72, CURRENT_TIMESTAMP), DATEADD('MINUTE', 60, DATEADD('HOUR', -72, CURRENT_TIMESTAMP)), 60, true, 'ROOM-1700928000000', 'COMPLETED', 3, 3, DATEADD('HOUR', -72, CURRENT_TIMESTAMP)),
('World War II Overview', 'Comprehensive review of major events and figures', 'HISTORY', DATEADD('HOUR', -120, CURRENT_TIMESTAMP), DATEADD('MINUTE', 150, DATEADD('HOUR', -120, CURRENT_TIMESTAMP)), 150, true, 'ROOM-1700755200000', 'COMPLETED', 4, 4, DATEADD('HOUR', -120, CURRENT_TIMESTAMP)),
('Spanish Conversation Practice', 'Informal Spanish speaking session', 'LANGUAGE', DATEADD('HOUR', -96, CURRENT_TIMESTAMP), DATEADD('MINUTE', 45, DATEADD('HOUR', -96, CURRENT_TIMESTAMP)), 45, true, 'ROOM-1700841600000', 'COMPLETED', 5, 5, DATEADD('HOUR', -96, CURRENT_TIMESTAMP)),
('Linear Algebra Problem Set', 'Working through chapter 5 exercises', 'MATH', DATEADD('HOUR', -6, CURRENT_TIMESTAMP), DATEADD('MINUTE', 90, DATEADD('HOUR', -6, CURRENT_TIMESTAMP)), 90, false, 'ROOM-1701270000000', 'ACTIVE', 1, NULL, DATEADD('HOUR', -6, CURRENT_TIMESTAMP)),
('Python Data Structures', 'Lists, dictionaries, and sets deep dive', 'PROGRAMMING', DATEADD('HOUR', 1, CURRENT_TIMESTAMP), NULL, NULL, false, 'ROOM-1701360000000', 'SCHEDULED', 2, NULL, CURRENT_TIMESTAMP),
('Genetics Quiz Prep', 'Final preparation for midterm exam', 'SCIENCE', DATEADD('HOUR', -8, CURRENT_TIMESTAMP), DATEADD('MINUTE', 120, DATEADD('HOUR', -8, CURRENT_TIMESTAMP)), 120, false, 'ROOM-1701316800000', 'COMPLETED', 3, NULL, DATEADD('HOUR', -8, CURRENT_TIMESTAMP));

-- Insert Session Participants
INSERT INTO session_participants (study_session_id, user_id, joined_at, left_at, minutes_participated)
VALUES
(1, 1, DATEADD('HOUR', -48, CURRENT_TIMESTAMP), DATEADD('MINUTE', 120, DATEADD('HOUR', -48, CURRENT_TIMESTAMP)), 120),
(1, 2, DATEADD('MINUTE', 5, DATEADD('HOUR', -48, CURRENT_TIMESTAMP)), DATEADD('MINUTE', 125, DATEADD('HOUR', -48, CURRENT_TIMESTAMP)), 120),
(1, 3, DATEADD('HOUR', -48, CURRENT_TIMESTAMP), DATEADD('MINUTE', 110, DATEADD('HOUR', -48, CURRENT_TIMESTAMP)), 110),
(2, 2, DATEADD('HOUR', -24, CURRENT_TIMESTAMP), DATEADD('MINUTE', 90, DATEADD('HOUR', -24, CURRENT_TIMESTAMP)), 90),
(2, 1, DATEADD('MINUTE', 10, DATEADD('HOUR', -24, CURRENT_TIMESTAMP)), DATEADD('MINUTE', 85, DATEADD('HOUR', -24, CURRENT_TIMESTAMP)), 75),
(2, 5, DATEADD('HOUR', -24, CURRENT_TIMESTAMP), DATEADD('MINUTE', 90, DATEADD('HOUR', -24, CURRENT_TIMESTAMP)), 90),
(3, 3, DATEADD('HOUR', -72, CURRENT_TIMESTAMP), DATEADD('MINUTE', 60, DATEADD('HOUR', -72, CURRENT_TIMESTAMP)), 60),
(3, 4, DATEADD('MINUTE', 2, DATEADD('HOUR', -72, CURRENT_TIMESTAMP)), DATEADD('MINUTE', 58, DATEADD('HOUR', -72, CURRENT_TIMESTAMP)), 56),
(4, 4, DATEADD('HOUR', -120, CURRENT_TIMESTAMP), DATEADD('MINUTE', 150, DATEADD('HOUR', -120, CURRENT_TIMESTAMP)), 150),
(4, 1, DATEADD('HOUR', -120, CURRENT_TIMESTAMP), DATEADD('MINUTE', 145, DATEADD('HOUR', -120, CURRENT_TIMESTAMP)), 145),
(4, 2, DATEADD('MINUTE', 15, DATEADD('HOUR', -120, CURRENT_TIMESTAMP)), DATEADD('MINUTE', 150, DATEADD('HOUR', -120, CURRENT_TIMESTAMP)), 135),
(5, 5, DATEADD('HOUR', -96, CURRENT_TIMESTAMP), DATEADD('MINUTE', 45, DATEADD('HOUR', -96, CURRENT_TIMESTAMP)), 45),
(5, 1, DATEADD('MINUTE', 3, DATEADD('HOUR', -96, CURRENT_TIMESTAMP)), DATEADD('MINUTE', 48, DATEADD('HOUR', -96, CURRENT_TIMESTAMP)), 45),
(5, 3, DATEADD('HOUR', -96, CURRENT_TIMESTAMP), DATEADD('MINUTE', 40, DATEADD('HOUR', -96, CURRENT_TIMESTAMP)), 40),
(6, 1, DATEADD('HOUR', -6, CURRENT_TIMESTAMP), NULL, NULL),
(7, 2, DATEADD('HOUR', 1, CURRENT_TIMESTAMP), NULL, NULL),
(8, 3, DATEADD('HOUR', -8, CURRENT_TIMESTAMP), DATEADD('MINUTE', 120, DATEADD('HOUR', -8, CURRENT_TIMESTAMP)), 120),
(8, 5, DATEADD('MINUTE', 10, DATEADD('HOUR', -8, CURRENT_TIMESTAMP)), DATEADD('MINUTE', 115, DATEADD('HOUR', -8, CURRENT_TIMESTAMP)), 105);

-- Insert Sample Activities
INSERT INTO activity (type, message, timestamp, study_session_id, user_id)
VALUES
('JOINED', 'John Doe joined the session', DATEADD('HOUR', -48, CURRENT_TIMESTAMP), 1, 1),
('JOINED', 'Jane Smith joined the session', DATEADD('MINUTE', 5, DATEADD('HOUR', -48, CURRENT_TIMESTAMP)), 1, 2),
('HAND_RAISE', 'John Doe raised hand with question about integration limits', DATEADD('MINUTE', 30, DATEADD('HOUR', -48, CURRENT_TIMESTAMP)), 1, 1),
('COFFEE_BREAK', 'Bob Wilson took a coffee break', DATEADD('MINUTE', 45, DATEADD('HOUR', -48, CURRENT_TIMESTAMP)), 1, 3),
('MILESTONE_REACHED', 'Session completed: 120 minutes', DATEADD('MINUTE', 120, DATEADD('HOUR', -48, CURRENT_TIMESTAMP)), 1, 1),
('JOINED', 'Jane Smith joined the session', DATEADD('HOUR', -24, CURRENT_TIMESTAMP), 2, 2),
('JOINED', 'John Doe joined the session', DATEADD('MINUTE', 10, DATEADD('HOUR', -24, CURRENT_TIMESTAMP)), 2, 1),
('QUESTION', 'Jane Smith asked: What is the difference between List and Set?', DATEADD('MINUTE', 25, DATEADD('HOUR', -24, CURRENT_TIMESTAMP)), 2, 2),
('HAND_RAISE', 'Charlie Brown raised hand', DATEADD('MINUTE', 40, DATEADD('HOUR', -24, CURRENT_TIMESTAMP)), 2, 5),
('MILESTONE_REACHED', 'Session completed: 90 minutes', DATEADD('MINUTE', 90, DATEADD('HOUR', -24, CURRENT_TIMESTAMP)), 2, 2),
('JOINED', 'Bob Wilson joined the session', DATEADD('HOUR', -72, CURRENT_TIMESTAMP), 3, 3),
('JOINED', 'Alice Johnson joined the session', DATEADD('MINUTE', 2, DATEADD('HOUR', -72, CURRENT_TIMESTAMP)), 3, 4),
('MILESTONE_REACHED', 'Session completed: 60 minutes', DATEADD('MINUTE', 60, DATEADD('HOUR', -72, CURRENT_TIMESTAMP)), 3, 3),
('JOINED', 'Alice Johnson joined the session', DATEADD('HOUR', -120, CURRENT_TIMESTAMP), 4, 4),
('JOINED', 'John Doe joined the session', DATEADD('HOUR', -120, CURRENT_TIMESTAMP), 4, 1),
('HAND_RAISE', 'Alice Johnson raised hand with historical question', DATEADD('MINUTE', 50, DATEADD('HOUR', -120, CURRENT_TIMESTAMP)), 4, 4),
('MILESTONE_REACHED', 'Session completed: 150 minutes', DATEADD('MINUTE', 150, DATEADD('HOUR', -120, CURRENT_TIMESTAMP)), 4, 4),
('JOINED', 'Charlie Brown joined the session', DATEADD('HOUR', -96, CURRENT_TIMESTAMP), 5, 5),
('JOINED', 'John Doe joined the session', DATEADD('MINUTE', 3, DATEADD('HOUR', -96, CURRENT_TIMESTAMP)), 5, 1),
('MILESTONE_REACHED', 'Session completed: 45 minutes', DATEADD('MINUTE', 45, DATEADD('HOUR', -96, CURRENT_TIMESTAMP)), 5, 5),
('JOINED', 'John Doe joined the session', DATEADD('HOUR', -6, CURRENT_TIMESTAMP), 6, 1),
('JOINED', 'Jane Smith joined the session', DATEADD('HOUR', 1, CURRENT_TIMESTAMP), 7, 2),
('JOINED', 'Bob Wilson joined the session', DATEADD('HOUR', -8, CURRENT_TIMESTAMP), 8, 3),
('QUESTION', 'Bob Wilson asked: Can you explain dominant and recessive traits?', DATEADD('MINUTE', 30, DATEADD('HOUR', -8, CURRENT_TIMESTAMP)), 8, 3),
('MILESTONE_REACHED', 'Session completed: 120 minutes', DATEADD('MINUTE', 120, DATEADD('HOUR', -8, CURRENT_TIMESTAMP)), 8, 3);