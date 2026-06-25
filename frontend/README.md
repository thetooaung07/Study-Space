# StudySpace - Frontend

StudySpace is a modern web application designed to unify course-material management and peer communication into a single, cohesive environment. The platform reduces tool fragmentation by combining course administration, student contributions (Merge Proposals), contextual messaging, and an AI assistant.

## Technical Details

The frontend is built with performance, reusability, and modern developer experience in mind. 

### Core Stack
- **Framework:** [Next.js 16](https://nextjs.org/) (App Router) + [React 19](https://react.dev/)
- **Language:** TypeScript
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)
- **Forms & Validation:** [React Hook Form](https://react-hook-form.com/)
- **State Management:** React Context API & Custom Hooks
- **Real-Time Communication:** `@stomp/stompjs` over `sockjs-client` (WebSockets)

### Key Architectural Decisions
- **Declarative UI Component Model:** The interface is decomposed into independent components, allowing complex shared state across simultaneous views (e.g., Course Material Viewer, Chat Panel, and AI Assistant Panel).
- **Stateless Authentication:** Handles secure JWT-based authentication via HTTP-only or `Authorization: Bearer` token flows.
- **Contextual Messaging:** Real-time chat uses STOMP over SockJS. Messages are parsed for `@[id:title]` markdown syntax to render clickable "Contextual Anchors" pointing to specific course materials.
- **Built-in Quality Assurance:** Uses modern tools to ensure stability (Vitest for rapid unit testing and Playwright for complex browser-based E2E scenarios).

---

## Developer Guide

### Prerequisites
- **Node.js**: v22+ recommended
- **Package Manager**: npm (or yarn / pnpm)

### Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```
   *Note: This command runs Next.js with the Turbopack engine for faster local compilation.*

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Project Structure

- `app/`: Next.js App Router pages, layout files, and global providers.
- `components/`: Reusable UI components. Includes primitives (like buttons and dialogs from Shadcn UI) and complex domain-specific blocks (like the AI panel or chat sidebar).
- `lib/`: Utility functions, formatters, and external API client logic.
- `hooks/`: Custom React hooks for encapsulating complex state or data-fetching logic.

### Testing

The project uses a dual-testing strategy to balance speed and realism.

**Unit and Integration Testing (Vitest)**
Used for testing individual components, hooks, and utility functions in isolation.
```bash
# Run tests in CLI mode
npm run test

# Open the Vitest UI in the browser for an interactive test runner
npm run test:ui
```

**End-to-End Testing (Playwright)**
Used for testing complete multi-step user journeys (e.g., submitting a Merge Proposal, interacting with the AI).
```bash
# Run the complete E2E test suite
npm run test:e2e
```

### Building for Production

To create an optimized production build:
```bash
npm run build
```

To start the production server:
```bash
npm run start
```
