# StudySpace - Backend

StudySpace's backend is a robust RESTful API and WebSocket server built to handle course management, multi-step contribution workflows, role-based access control, and contextual AI integration.

## Technical Details

### Core Stack
- **Framework:** Java 21 + Spring Boot 3
- **Database:** PostgreSQL 17 (with `pgvector` for similarity search)
- **Data Access:** Spring Data JPA (Hibernate)
- **Security:** Spring Security (JWT Authentication + Role-based Authorisation)
- **Real-Time Communication:** Spring WebSocket with STOMP message broker

### Key Architectural Decisions
- **Relational Integrity:** A PostgreSQL database was chosen over NoSQL to enforce strict ACID transactional guarantees and foreign-key constraints. This is essential when users clone course sections and submit Merge Proposals.
- **Embedded AI Capabilities:** Instead of a dedicated external vector database, `pgvector` is used inside PostgreSQL to perform similarity searches over document embeddings (RAG pipeline) directly alongside the relational data.
- **Stateless Architecture:** Uses JSON Web Tokens (JWT) for authentication instead of server-side sessions, making the backend easier to scale horizontally.
- **Bidirectional WebSocket Sync:** Instead of HTTP long-polling, a STOMP over SockJS setup ensures students and instructors receive real-time updates on contextual chat messages.

---

## Developer Guide

### Prerequisites
- **Java Development Kit (JDK):** Version 21
- **Build Tool:** Maven or Gradle (embedded wrapper provided)
- **Database:** PostgreSQL 17 running locally or via Docker

### Environment Configuration
The backend depends on a set of environment variables for database connections, OAuth logins, and AI integrations. You should provide these in your local environment or via a `.env` file in the `backend/` root directory.

| Variable Name | Description | Default / Example |
|---|---|---|
| `DB_PASSWORD` | The password for the PostgreSQL `studyspace` user. | `local_studyspace_pw` |
| `GEMINI_API_KEY` | Required for the document-grounded AI Assistant. | `AIzaSy...` |
| `OPENAI_API_KEY` | (Optional) Alternative LLM provider fallback. | `sk-...` |
| `GOOGLE_CLIENT_ID` | OAuth2 Client ID for Google login. | (Your GCP OAuth Client ID) |
| `GOOGLE_CLIENT_SECRET`| OAuth2 Secret for Google login. | (Your GCP OAuth Secret) |
| `GITHUB_CLIENT_ID` | OAuth2 Client ID for GitHub login. | (Your GitHub App Client ID)|
| `GITHUB_CLIENT_SECRET`| OAuth2 Secret for GitHub login. | (Your GitHub App Secret) |

**Note on Profiles:** 
- The default active profile is `local` (uses `application.properties`).
- You can override properties by setting environment variables matching the property name.

### Getting Started

1. **Start the database:**
   If you have Docker installed, the easiest way to spin up the required PostgreSQL instance with `pgvector` is from the root of the project:
   ```bash
   cd ..
   docker-compose up -d postgres
   ```

2. **Run the backend application:**
   You can run the application directly using the Maven wrapper:
   ```bash
   ./mvnw spring-boot:run
   ```

3. **Explore the API:**
   Once the server starts (default port `8080`), you can access the OpenAPI (Swagger) documentation to explore and test the endpoints interactively:
   - **Swagger UI:** [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)

### Project Structure
- `src/main/java/com/studyspace/`:
  - `config/`: Spring Security, WebSocket, and Bean configurations.
  - `controllers/`: REST API endpoints grouped by domain feature.
  - `services/`: Core business logic (e.g., executing the cloning mechanism or calling the AI).
  - `repositories/`: Spring Data JPA interfaces for database access.
  - `models/`: JPA Entities and DTOs.
- `src/main/resources/`:
  - `application.properties`: Primary configuration file.
  - `schema-postgres.sql`: Auto-executed database schema initialisation.
  - `local-data.sql`: Seed data for testing locally.
