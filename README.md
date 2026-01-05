# StudySpace – Study Session Tracker & Social Platform

[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.6-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-blue.svg)](https://www.postgresql.org/)

> A modern study tracking platform where students can track their study sessions, form study groups with friends, see who's studying in real-time, and compete on leaderboards.

**Project by:** Thet Oo Aung (`aungthet`)  
**Course:** TJV (Web Applications in Java)  
**Submission:** January 2026



## 🚀 Quick Start

### Prerequisites

- **Java 21** or higher
- **Node.js 18+** and npm
- **Docker** and Docker Compose (recommended)
- **Maven** (or use the included `mvnw` wrapper)

### Running with Docker (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd StudySpace

# Start all services (backend, frontend, database)
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8080
# Swagger UI: http://localhost:8080/swagger-ui/index.html
# Adminer: http://localhost:8081
```

### Running Locally

#### Backend

```bash
cd backend

# Build the project
mvn clean install

# Run tests
mvn test

# Start the application
mvn spring-boot:run

# Or using Maven wrapper
./mvnw spring-boot:run
```

The backend will start on `http://localhost:8080`

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

The frontend will start on `http://localhost:3000`



## 📚 API Documentation

The API is fully documented using **OpenAPI 3.0** (Swagger).

### Interactive API Documentation

Once the backend is running, access the **Swagger UI** for interactive API testing:

- **Swagger UI**: [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)
- **OpenAPI Spec**: [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)



## 🏗️ Technology Stack

### Backend
- **Framework**: Spring Boot 3.5.6
- **Language**: Java 21
- **Database**: PostgreSQL 17 (production), H2 (testing)
- **ORM**: Hibernate/JPA
- **Security**: Spring Security with JWT, OAuth2
- **API Documentation**: Springdoc OpenAPI (Swagger)
- **Build Tool**: Maven
- **Testing**: JUnit 5, Mockito, Spring Test

### Frontend
- **Framework**: Next.js 15 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui, Radix UI
- **State Management**: React Context API
- **HTTP Client**: Fetch API

### DevOps
- **Containerization**: Docker & Docker Compose
- **Database**: PostgreSQL with persistent volumes


## Project Overview

A study tracking platform where students can track their study sessions, form study groups with friends, see who's studying in (almost) real-time, and compete on leaderboards. The platform helps students stay motivated and accountable by providing social features and detailed study analytics.

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


## ✨ Key Features

### For Students
- 📊 **Study Session Tracking** - Track individual and group study sessions with real-time timers
- 👥 **Study Groups** - Create or join study groups with invite codes
- 🏆 **LeaderBoard** - Earn achievements and maintain study streaks
- 📈 **Analytics** - View detailed study statistics and progress
- 💬 **Activity Feed** - Chat and interact during study sessions
- ⏸️ **Break Management** - Pause timer for breaks without losing progress

### Technical Highlights
- 🔐 **Secure Authentication** - JWT-based auth with Spring Security and OAuth2
- 🐳 **Docker Ready** - Easy deployment with Docker Compose
- 📚 **Complete API Docs** - Interactive Swagger UI
- 🗃️ **Database** - PostgreSQL with proper schema design


## 🧪 Testing

The project includes comprehensive automated tests covering **three different test types**:

### Test Coverage

1. **Unit Tests** (Service Layer) - 28 tests
   - `UserServiceTest` - User creation, deletion, validation
   - `StudySessionServiceTest` - Session management, participant handling
   - `StudyGroupServiceTest` - Group operations, member management
   - `GamificationServiceTest` - Streak calculation, milestone detection

2. **Repository Tests** (JPA Layer) - 2 tests
   - `UserRepositoryTest` - Custom query methods, database operations

3. **Integration Tests** (Full Stack) - 15 tests
   - `StudyGroupControllerIntegrationTest` - End-to-end API testing
   - `StudySessionControllerIntegrationTest` - Full request/response cycle
   - `StudyGroupControllerTest` - Controller layer with mocked services

### Running Tests

```bash
cd backend

# Run all tests
mvn test

# Run specific test class
mvn test -Dtest=UserServiceTest
```

## 📁 Project Structure

```
StudySpace/
├── backend/                    # Spring Boot backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/studyspace/
│   │   │   │   ├── controller/     # REST API endpoints
│   │   │   │   ├── service/        # Business logic
│   │   │   │   ├── repository/     # Data access layer
│   │   │   │   ├── entity/         # JPA entities
│   │   │   │   ├── dto/            # Data transfer objects
│   │   │   │   ├── security/       # Authentication & authorization
│   │   │   │   └── config/         # Spring configuration
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       └── data-postgres.sql
│   │   └── test/                   # Automated tests
│   └── pom.xml                     # Maven dependencies
│
├── frontend/                       # Next.js frontend
│   ├── app/                        # App router pages
│   ├── components/                 # React components
│   ├── context/                    # Global Context (eg. for Auth)
│   ├── lib/                        # Utilities and API client
│   └── package.json
│
└── docker-compose.yml              # Docker orchestration
```

## 📝 Development Notes

### Authentication

The application uses **JWT tokens** for authentication:

1. Register or login via `/api/auth/register` or `/api/auth/login`
2. Receive JWT token in response
3. Include token in `Authorization: Bearer <token>` header for protected endpoints

### Default Credentials

When running with Docker, seed data is loaded with default users:

- Email: `john.doe@example.com` / Password: `password123`
- Email: `jane.smith@example.com` / Password: `password123`

### Environment Variables

Backend (`application.yml`):
```yaml
spring:
  datasource:
    url: jdbc:postgresql://postgres:5432/studyspace
  jpa:
    hibernate:
      ddl-auto: create-drop  # Use 'update' for production
```

## 👨‍💻 Author

**Thet Oo Aung**  
FIT CTU, Prague  
Course: TJV (Web Applications in Java)
