-- ==========================================
-- Enable pgvector extension (Postgres only)
-- ==========================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ==========================================
-- Core User & Study Tables
-- ==========================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id                  BIGSERIAL PRIMARY KEY,
    username            VARCHAR(255) NOT NULL UNIQUE,
    email               VARCHAR(255) NOT NULL UNIQUE,
    password            VARCHAR(255) NOT NULL,
    full_name           VARCHAR(255),
    profile_picture_url VARCHAR(500),
    total_study_minutes INTEGER DEFAULT 0,
    current_status      VARCHAR(50) DEFAULT 'OFFLINE',
    role                VARCHAR(20) DEFAULT 'STUDENT',
    auth_provider       VARCHAR(20) DEFAULT 'LOCAL',
    current_streak      INTEGER DEFAULT 0,
    last_study_date     TIMESTAMP,
    created_at          TIMESTAMP NOT NULL,
    updated_at          TIMESTAMP NOT NULL
);

-- Study Sessions Table
CREATE TABLE IF NOT EXISTS study_sessions (
    id               BIGSERIAL PRIMARY KEY,
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    subject          VARCHAR(50),
    start_time       TIMESTAMP NOT NULL,
    end_time         TIMESTAMP,
    duration_minutes INTEGER,
    room_code        VARCHAR(255) UNIQUE,
    status           VARCHAR(50) DEFAULT 'ACTIVE',
    visibility       VARCHAR(20) DEFAULT 'PUBLIC',
    user_id          BIGINT NOT NULL,
    created_at       TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Session Participants Table
CREATE TABLE IF NOT EXISTS session_participants (
    id                   BIGSERIAL PRIMARY KEY,
    study_session_id     BIGINT NOT NULL,
    user_id              BIGINT NOT NULL,
    joined_at            TIMESTAMP NOT NULL,
    left_at              TIMESTAMP,
    last_paused_at       TIMESTAMP,
    minutes_participated INTEGER,
    total_paused_seconds BIGINT DEFAULT 0,
    UNIQUE (study_session_id, user_id),
    FOREIGN KEY (study_session_id) REFERENCES study_sessions(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Activity Table
CREATE TABLE IF NOT EXISTS activity (
    id               BIGSERIAL PRIMARY KEY,
    type             VARCHAR(50) NOT NULL,
    message          TEXT,
    timestamp        TIMESTAMP NOT NULL,
    study_session_id BIGINT,
    user_id          BIGINT NOT NULL,
    UNIQUE (study_session_id, user_id, timestamp, type),
    FOREIGN KEY (study_session_id) REFERENCES study_sessions(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Core indexes
CREATE INDEX IF NOT EXISTS idx_user_username            ON users(username);
CREATE INDEX IF NOT EXISTS idx_user_email               ON users(email);
CREATE INDEX IF NOT EXISTS idx_study_session_creator    ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_session_room_code  ON study_sessions(room_code);
CREATE INDEX IF NOT EXISTS idx_session_participants_session ON session_participants(study_session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_user    ON session_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_session         ON activity(study_session_id);
CREATE INDEX IF NOT EXISTS idx_activity_user            ON activity(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_timestamp       ON activity(timestamp);

-- ==========================================
-- Course System Tables
-- ==========================================

CREATE TABLE IF NOT EXISTS courses (
    id            BIGSERIAL PRIMARY KEY,
    title         VARCHAR(255) NOT NULL UNIQUE,
    description   TEXT,
    instructor_id BIGINT NOT NULL,
    is_published  BOOLEAN DEFAULT false,
    created_at    TIMESTAMP NOT NULL,
    updated_at    TIMESTAMP NOT NULL,
    FOREIGN KEY (instructor_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS course_sections (
    id          BIGSERIAL PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    course_id   BIGINT NOT NULL,
    created_at  TIMESTAMP NOT NULL,
    UNIQUE (course_id, title),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

CREATE TABLE IF NOT EXISTS course_materials (
    id                 BIGSERIAL PRIMARY KEY,
    title              VARCHAR(255) NOT NULL,
    file_url           VARCHAR(1000) NOT NULL,
    file_type          VARCHAR(20) DEFAULT 'OTHER',
    original_file_name VARCHAR(500),
    contributor_name   VARCHAR(255),
    section_id         BIGINT NOT NULL,
    uploaded_at        TIMESTAMP NOT NULL,
    UNIQUE (section_id, title),
    FOREIGN KEY (section_id) REFERENCES course_sections(id)
);

CREATE TABLE IF NOT EXISTS course_enrollments (
    id         BIGSERIAL PRIMARY KEY,
    course_id  BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    status     VARCHAR(20) DEFAULT 'ACTIVE',
    enrolled_at TIMESTAMP NOT NULL,
    UNIQUE (course_id, student_id),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (student_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_course_instructor        ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_course_published         ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_course_section_course    ON course_sections(course_id);
CREATE INDEX IF NOT EXISTS idx_course_material_section  ON course_materials(section_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollment_course ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollment_student ON course_enrollments(student_id);

-- ==========================================
-- Workspace System Tables
-- ==========================================

CREATE TABLE IF NOT EXISTS student_workspaces (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id    BIGINT NOT NULL,
    created_at  TIMESTAMP NOT NULL,
    updated_at  TIMESTAMP NOT NULL,
    UNIQUE (owner_id, name),
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS workspace_spaces (
    id                   BIGSERIAL PRIMARY KEY,
    title                VARCHAR(255) NOT NULL,
    description          TEXT,
    workspace_id         BIGINT NOT NULL,
    forked_from_course_id BIGINT,
    is_published         BOOLEAN DEFAULT false NOT NULL,
    created_at           TIMESTAMP NOT NULL,
    updated_at           TIMESTAMP NOT NULL,
    UNIQUE (workspace_id, title),
    FOREIGN KEY (workspace_id) REFERENCES student_workspaces(id),
    FOREIGN KEY (forked_from_course_id) REFERENCES courses(id)
);

CREATE TABLE IF NOT EXISTS workspace_sections (
    id          BIGSERIAL PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0 NOT NULL,
    space_id    BIGINT NOT NULL,
    created_at  TIMESTAMP NOT NULL,
    UNIQUE (space_id, title),
    FOREIGN KEY (space_id) REFERENCES workspace_spaces(id)
);

CREATE TABLE IF NOT EXISTS workspace_materials (
    id                 BIGSERIAL PRIMARY KEY,
    title              VARCHAR(255) NOT NULL,
    file_url           VARCHAR(1000) NOT NULL,
    file_type          VARCHAR(20) DEFAULT 'OTHER' NOT NULL,
    original_file_name VARCHAR(500),
    is_reference       BOOLEAN DEFAULT false NOT NULL,
    is_hidden          BOOLEAN DEFAULT false NOT NULL,
    section_id         BIGINT,
    uploaded_at        TIMESTAMP NOT NULL,
    FOREIGN KEY (section_id) REFERENCES workspace_sections(id) ON DELETE SET NULL
);

-- Migrate existing schema if section_id is still NOT NULL
ALTER TABLE workspace_materials ALTER COLUMN section_id DROP NOT NULL;
ALTER TABLE workspace_materials DROP CONSTRAINT IF EXISTS workspace_materials_section_id_title_key;

CREATE TABLE IF NOT EXISTS contribution_proposals (
    id                     BIGSERIAL PRIMARY KEY,
    status                 VARCHAR(50) DEFAULT 'PENDING' NOT NULL,
    message                TEXT,
    review_message         TEXT,
    proposed_section_title VARCHAR(255),
    student_id             BIGINT NOT NULL,
    target_course_id       BIGINT NOT NULL,
    target_section_id      BIGINT,
    source_material_id     BIGINT,
    contributor_display_name VARCHAR(255),
    created_at             TIMESTAMP NOT NULL,
    reviewed_at            TIMESTAMP,
    UNIQUE (student_id, target_course_id, target_section_id, source_material_id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (target_course_id) REFERENCES courses(id),
    FOREIGN KEY (target_section_id) REFERENCES course_sections(id),
    FOREIGN KEY (source_material_id) REFERENCES workspace_materials(id)
);

-- Workspace sharing columns
ALTER TABLE workspace_spaces
    ADD COLUMN IF NOT EXISTS invite_code      VARCHAR(20) UNIQUE,
    ADD COLUMN IF NOT EXISTS sharing_enabled  BOOLEAN NOT NULL DEFAULT false;

-- Space guests (users who joined via invite code)
CREATE TABLE IF NOT EXISTS space_guests (
    id        BIGSERIAL PRIMARY KEY,
    space_id  BIGINT NOT NULL,
    user_id   BIGINT NOT NULL,
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (space_id, user_id),
    FOREIGN KEY (space_id) REFERENCES workspace_spaces(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)  REFERENCES users(id)            ON DELETE CASCADE
);

-- Track who created each section / material (for own-delete enforcement)
ALTER TABLE workspace_sections  ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES users(id);
ALTER TABLE workspace_materials ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_workspace_owner       ON student_workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspace_space_ws    ON workspace_spaces(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_space_fork  ON workspace_spaces(forked_from_course_id);
CREATE INDEX IF NOT EXISTS idx_workspace_space_invite ON workspace_spaces(invite_code);
CREATE INDEX IF NOT EXISTS idx_workspace_req_space   ON workspace_sections(space_id);
CREATE INDEX IF NOT EXISTS idx_workspace_mat_sec     ON workspace_materials(section_id);
CREATE INDEX IF NOT EXISTS idx_proposal_student      ON contribution_proposals(student_id);
CREATE INDEX IF NOT EXISTS idx_proposal_course       ON contribution_proposals(target_course_id);
CREATE INDEX IF NOT EXISTS idx_space_guests_space    ON space_guests(space_id);
CREATE INDEX IF NOT EXISTS idx_space_guests_user     ON space_guests(user_id);

-- Space Chat Messages
CREATE TABLE IF NOT EXISTS space_messages (
    id          BIGSERIAL PRIMARY KEY,
    content     TEXT NOT NULL,
    space_id    BIGINT NOT NULL,
    user_id     BIGINT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (space_id) REFERENCES workspace_spaces(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)  REFERENCES users(id)            ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_space_messages_space  ON space_messages(space_id);

-- ==========================================
-- Conversational Memory Tables
-- ==========================================

-- Conversation: holds only the rolling long-term summary; individual turns live in messages.
CREATE TABLE IF NOT EXISTS conversations (
    id         VARCHAR(36) PRIMARY KEY,
    summary    TEXT        DEFAULT '',
    created_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conversation_updated ON conversations(updated_at);

-- Messages: normalized storage for individual turns (replaces the JSON blob in recent_messages).
CREATE TABLE IF NOT EXISTS messages (
    id              BIGSERIAL PRIMARY KEY,
    conversation_id VARCHAR(36) NOT NULL,
    role            VARCHAR(20) NOT NULL,   -- 'user' | 'assistant'
    content         TEXT        NOT NULL,
    created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);

-- ==========================================
-- RAG Vector Store Table
-- ==========================================

-- document_chunks: stores text fragments and their embeddings for semantic search.
-- embedding dimension 768 matches text-embedding-004 (Google Gemini).
CREATE TABLE IF NOT EXISTS document_chunks (
    id           BIGSERIAL PRIMARY KEY,
    document_url TEXT      NOT NULL,
    content      TEXT      NOT NULL,
    embedding    vector(768),
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doc_chunks_url ON document_chunks(document_url);
-- IVFFlat index for approximate nearest-neighbour cosine search
-- Created with 10 lists — suitable for small-to-medium corpora (< 1 million vectors).
CREATE INDEX IF NOT EXISTS idx_doc_chunks_embedding
    ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);