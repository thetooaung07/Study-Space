-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    profile_picture_url VARCHAR(500),
    total_study_minutes INTEGER DEFAULT 0,
    current_status VARCHAR(50) DEFAULT 'OFFLINE',
    role VARCHAR(20) DEFAULT 'STUDENT',
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Study Groups Table
CREATE TABLE IF NOT EXISTS study_groups (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    invite_code VARCHAR(50) NOT NULL UNIQUE,
    is_private BOOLEAN DEFAULT false,
    creator_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (creator_id) REFERENCES users(id)
);

-- Study Sessions Table
CREATE TABLE IF NOT EXISTS study_sessions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(50),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_minutes INTEGER,
    is_group_session BOOLEAN DEFAULT false,
    room_code VARCHAR(100) UNIQUE,
    status VARCHAR(50) DEFAULT 'SCHEDULED',
    user_id BIGINT NOT NULL,
    study_group_id BIGINT,
    created_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (study_group_id) REFERENCES study_groups(id)
);

-- Group Members (Many-to-Many Junction Table)
CREATE TABLE IF NOT EXISTS group_members (
    user_id BIGINT NOT NULL,
    group_id BIGINT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    role VARCHAR(50) DEFAULT 'MEMBER',
    PRIMARY KEY (user_id, group_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (group_id) REFERENCES study_groups(id)
);

-- Session Participants Table
CREATE TABLE IF NOT EXISTS session_participants (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    study_session_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    joined_at TIMESTAMP NOT NULL,
    left_at TIMESTAMP,
    minutes_participated INTEGER,
    UNIQUE (study_session_id, user_id),
    FOREIGN KEY (study_session_id) REFERENCES study_sessions(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Activity Table
CREATE TABLE IF NOT EXISTS activity (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    type VARCHAR(50) NOT NULL,
    message TEXT,
    timestamp TIMESTAMP NOT NULL,
    study_session_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    FOREIGN KEY (study_session_id) REFERENCES study_sessions(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_user_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_study_session_creator ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_session_group ON study_sessions(study_group_id);
CREATE INDEX IF NOT EXISTS idx_study_session_room_code ON study_sessions(room_code);
CREATE INDEX IF NOT EXISTS idx_study_group_creator ON study_groups(creator_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_session ON session_participants(study_session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_user ON session_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_session ON activity(study_session_id);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON activity(timestamp);

-- Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructor_id BIGINT NOT NULL,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (instructor_id) REFERENCES users(id)
);

-- Course Sections Table
CREATE TABLE IF NOT EXISTS course_sections (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    course_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- Course Materials Table
CREATE TABLE IF NOT EXISTS course_materials (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    file_url VARCHAR(1000) NOT NULL,
    file_type VARCHAR(20) DEFAULT 'OTHER',
    original_file_name VARCHAR(500),
    section_id BIGINT NOT NULL,
    uploaded_at TIMESTAMP NOT NULL,
    FOREIGN KEY (section_id) REFERENCES course_sections(id)
);

-- Course Enrollments Table
CREATE TABLE IF NOT EXISTS course_enrollments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    course_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    enrolled_at TIMESTAMP NOT NULL,
    UNIQUE (course_id, student_id),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (student_id) REFERENCES users(id)
);

-- Course indexes
CREATE INDEX IF NOT EXISTS idx_course_instructor ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_course_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_course_section_course ON course_sections(course_id);
CREATE INDEX IF NOT EXISTS idx_course_material_section ON course_materials(section_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollment_course ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollment_student ON course_enrollments(student_id);