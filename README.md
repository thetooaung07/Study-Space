# StudySpace – Course Material and Peer Communication Platform

StudySpace is a proof of concept application developed as part of a Bachelor thesis at the Faculty of Information Technology, Czech Technical University in Prague (FIT CTU). It is designed to solve tool fragmentation in academic environments by unifying course-material management, peer communication, and document querying into a single, cohesive platform.

Students and instructors no longer need to switch between separate learning management systems, messaging applications, and document viewers just to link a question to its source material.

## Core Features

- **Course Administration**: Instructors can easily create course structures, manage enrollments, and upload study materials.
- **Personal Workspaces**: Students can copy course materials into their own private spaces, make annotations or improvements, and propose changes back to the instructor for review.
- **Contextual Messaging**: A chat system where users can reference specific parts of a document. This creates a clickable link that instantly takes the reader to the exact location in the source material.
- **AI-Assisted Search**: An integrated system that allows students to ask questions directly against their course documents and receive relevant answers.
- **Role Management**: Distinct features and permissions assigned based on whether the user is a student or an instructor.

## Project Structure

The project is organized into two main parts:

- `/backend`: Contains the server application providing the core logic, database interactions, and service integrations.
- `/frontend`: Contains the web interface that users interact with.

For detailed technical specifications, documentation, and setup instructions, please refer to their respective documentation files:

- [Backend Documentation](./backend/README.md)
- [Frontend Documentation](./frontend/README.md)

## Quick Start

The most straightforward method to run the entire StudySpace application locally is through containerization.

### Prerequisites

- **Docker** and **Docker Compose**

### Running the Application

1. Clone the repository:

    ```bash
    git clone <repository-url>
    cd StudySpace
    ```

2. Start all required services (Backend, Frontend, and Database):

    ```bash
    docker-compose up --build
    ```

3. Access the application:
    - **User Interface**: [http://localhost:3000](http://localhost:3000)
    - **Application Server**: [http://localhost:8080](http://localhost:8080)
    - **API Documentation**: [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)

## Author

**Thet Oo Aung**  
FIT CTU, Prague
