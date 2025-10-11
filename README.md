# StudySpace – Project Specification (Checkpoint 1)

**Project Name:** Study Session Tracker & Social Platform  
**Student:** Thet Oo Aung  
**Username:** aungthet  
**Date:** 2 Oct, 2025

## Project Overview

A study tracking platform where students can track their study sessions, form study groups with friends, see who's studying in real-time, and compete on leaderboards. The platform helps students stay motivated and accountable by providing social features and detailed study analytics.

## 1. Data Models

### 1.1 Entity Descriptions

#### **User** - Represents a registered user of the platform.

**Attributes:**

-   `id` (Long, PK) - Unique identifier
-   `username` (String, unique, not null) - User's login name
-   `email` (String, unique, not null) - User's email address
-   `password` (String, not null) - Hashed password
-   `fullName` (String) - User's full name
-   `profilePictureUrl` (String) - URL to profile picture
-   `totalStudyMinutes` (Integer, default 0) - Cumulative study time
-   `currentStatus` (Enum: OFFLINE, STUDYING, BREAK) - Current activity status
-   `createdAt` (LocalDateTime) - Account creation timestamp
-   `updatedAt` (LocalDateTime) - Last update timestamp

**Relationships:**

-   One-to-Many with `StudySession` (one user creates many sessions)
-   Many-to-Many with `StudyGroup` (user can be member of multiple groups)
-   One-to-Many with `SessionParticipant` (user can join many sessions as participant)
-   One-to-Many with `Reaction` (user can create many reactions)

---

#### **StudySession** - Represents a single study session, either individual or group-based.

**Attributes:**

-   `id` (Long, PK) - Unique identifier
-   `title` (String, not null) - Session title (e.g., "Math Homework")
-   `description` (String) - Detailed description
-   `subject` (Enum: MATH, SCIENCE, LANGUAGE, HISTORY, PROGRAMMING, OTHER) - Study subject
-   `startTime` (LocalDateTime, not null) - When session started
-   `endTime` (LocalDateTime, nullable) - When session ended (null if active)
-   `durationMinutes` (Integer) - Calculated duration
-   `isGroupSession` (Boolean, default false) - Whether it's a group session
-   `roomCode` (String, unique, nullable) - Code for others to join
-   `status` (Enum: SCHEDULED, ACTIVE, COMPLETED, CANCELLED) - Session status
-   `createdAt` (LocalDateTime) - Creation timestamp

**Relationships:**

-   Many-to-One with `User` (creator/owner of the session)
-   One-to-Many with `SessionParticipant` (multiple users can join)
-   One-to-Many with `Reaction` (events during the session)
-   Many-to-One with `StudyGroup` (optional, if session belongs to a group)

---

#### **StudyGroup** - Represents a study group where multiple users can collaborate.

**Attributes:**

-   `id` (Long, PK) - Unique identifier
-   `name` (String, not null) - Group name
-   `description` (String) - Group description
-   `inviteCode` (String, unique, not null) - Code for joining the group
-   `isPrivate` (Boolean, default false) - Whether group is private
-   `createdAt` (LocalDateTime) - Creation timestamp
-   `updatedAt` (LocalDateTime) - Last update timestamp

**Relationships:**

-   Many-to-One with `User` (creator of the group)
-   **Many-to-Many with `User`** (group members) - **PRIMARY M:N ASSOCIATION**
-   One-to-Many with `StudySession` (group can have multiple sessions)

---

#### **SessionParticipant** (Junction Entity) - Represents participation of a user in a study session. This entity tracks who joined which session and their participation details.

**Attributes:**

-   `id` (Long, PK) - Unique identifier
-   `joinedAt` (LocalDateTime, not null) - When user joined
-   `leftAt` (LocalDateTime, nullable) - When user left (null if still in session)
-   `minutesParticipated` (Integer) - Calculated participation time

**Relationships:**

-   Many-to-One with `StudySession`
-   Many-to-One with `User`

_Note: This creates a **secondary Many-to-Many** relationship between User and StudySession._

---

#### **Activity** - Represents an event or reaction during a study session (e.g., hand raise, break, milestone).

**Attributes:**

-   `id` (Long, PK) - Unique identifier
-   `type` (Enum: HAND_RAISE, COFFEE_BREAK, MILESTONE_REACHED, JOINED, LEFT, QUESTION) - Type of activity
-   `message` (String, nullable) - Optional text message
-   `timestamp` (LocalDateTime, not null) - When activity occurred

**Relationships:**

-   Many-to-One with `StudySession`
-   Many-to-One with `User`

---

### 1.2 Relational Database Schema

**Tables:**

1. **users**

    - Primary Key: `id`
    - Unique constraints: `username`, `email`

2. **study_sessions**

    - Primary Key: `id`
    - Foreign Key: `user_id` → `users(id)`
    - Foreign Key: `study_group_id` → `study_groups(id)` (nullable)
    - Unique constraint: `room_code`

3. **study_groups**

    - Primary Key: `id`
    - Foreign Key: `creator_id` → `users(id)`
    - Unique constraint: `invite_code`

4. **group_members** (Many-to-Many junction table)

    - Primary Key: `(group_id, user_id)`
    - Foreign Key: `group_id` → `study_groups(id)`
    - Foreign Key: `user_id` → `users(id)`
    - Additional columns: `joined_at`, `role` (MEMBER, ADMIN)

5. **session_participants** (Many-to-Many junction table with additional attributes)

    - Primary Key: `id`
    - Foreign Key: `study_session_id` → `study_sessions(id)`
    - Foreign Key: `user_id` → `users(id)`
    - Unique constraint: `(study_session_id, user_id)`

6. **activity**
    - Primary Key: `id`
    - Foreign Key: `study_session_id` → `study_sessions(id)`
    - Foreign Key: `user_id` → `users(id)`

**Key Relationships:**

-   **User ↔ StudyGroup** (Many-to-Many via `group_members`) - **PRIMARY M:N**
-   **User ↔ StudySession** (Many-to-Many via `session_participants`) - **SECONDARY M:N**
-   User → StudySession (One-to-Many, creator)
-   User → StudyGroup (One-to-Many, creator)
-   StudySession → Reaction (One-to-Many)
-   StudySession → SessionParticipant (One-to-Many)

## 2. Complex Query Description

Identify the most active and productive study groups based on their members' collective study performance over a specified time period.

### Query Description (Natural Language)

**"Find all study groups where the total combined study time of all group members in the last 30 days exceeds a specified threshold (e.g., 50 hours), and return statistics including the number of study sessions conducted by group members, the total study time in minutes, the average session duration, and the number of unique active members. Results should be ordered by total study time in descending order to show the most active groups first."**

### Query Details

**Input Parameters:**

-   `cutoffDate` (LocalDateTime) - The date from which to start counting (e.g., 30 days ago)
-   `minimumMinutes` (Integer) - Minimum total study minutes required (e.g., 3000 minutes = 50 hours)

**Output Information:**

-   Group ID
-   Group name
-   Number of study sessions conducted by all members
-   Total study minutes by all members
-   Average session duration
-   Number of unique active members in the period

**Tables Involved:**

-   `study_groups` - Base table
-   `group_members` - Join table for many-to-many relationship
-   `users` - To get group members
-   `study_sessions` - To aggregate study time and sessions

**Business Value:**
This query helps identify highly engaged study communities, which can be featured on leaderboards, recommended to new users, or rewarded with achievements. It demonstrates complex aggregation across multiple entities with filtering and grouping.

## 3. Complex Business Logic Operation

**Operation Name:** `EndStudySessionAndUpdateStats`

**Description (in words):**
When a user ends a study session, the system must:

1. Calculate the session duration (`endTime - startTime`).
2. Update the `durationMinutes` in the `study_sessions` table.
3. For each participant:

    - Calculate their individual participation time (`leftAt - joinedAt`).
    - Update their cumulative `totalStudyMinutes` in the `users` table.

4. If the session belongs to a group:

    - Update the group’s total activity stats (e.g., `group_study_minutes` cache or leaderboard entry).

5. Mark the session `status = COMPLETED`.
6. Create an `Activity` record with type `MILESTONE_REACHED`.

**Business Value:**
Ensures consistent user and group statistics, keeps leaderboards accurate, and automates progress tracking after each session.
