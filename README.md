# 🚀 CodeSync

> A modern, collaborative code synchronization and real-time development platform designed to streamline team collaboration and enhance productivity.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Usage Guide](#usage-guide)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**CodeSync** is a comprehensive solution for real-time code collaboration, synchronization, and version control management. It enables development teams to work together seamlessly, with instant synchronization across multiple clients, intelligent conflict resolution, and intuitive workflow management.

### Key Objectives

- ✅ Enable real-time collaborative coding experiences
- ✅ Provide seamless code synchronization across devices
- ✅ Implement intelligent version control workflows
- ✅ Enhance team productivity through unified collaboration tools
- ✅ Maintain data consistency and integrity

---

## ✨ Implemented Features

### Core Functionality

#### 1. **Real-Time Code Synchronization**
- Live code updates across all connected clients
- WebSocket-based communication for instant synchronization
- Operational Transformation (OT) for conflict resolution
- Support for multiple concurrent editors

#### 2. **Project Management**
- Create, manage, and organize projects
- Collaborative workspace setup
- Project-level permissions and access control
- Team member management

#### 3. **File Operations**
- Real-time file editing with syntax highlighting
- Multi-file project support
- File creation, deletion, and renaming
- File versioning and history tracking

#### 4. **User Authentication & Authorization**
- Secure user registration and login
- JWT-based session management
- Role-based access control (RBAC)
- Team-level permissions

#### 5. **Collaboration Features**
- Presence indicators showing active users
- Cursor position tracking
- User activity logs
- Comment and annotation system

#### 6. **Version Control Integration**
- Git-based version history
- Commit tracking and changelog
- Branch management
- Merge conflict detection and resolution

#### 7. **Dashboard & Monitoring**
- Real-time activity dashboard
- Project statistics and analytics
- User engagement metrics
- System health monitoring

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 18+** | Modern UI library with hooks |
| **TypeScript** | Type-safe development |
| **Tailwind CSS** | Utility-first styling framework |
| **Redux/Zustand** | State management |
| **React Query** | Server state management |
| **Socket.IO Client** | Real-time communication |
| **Monaco Editor** | Code editor component |
| **Axios** | HTTP client |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js & Express** | Server framework |
| **TypeScript** | Type-safe backend development |
| **PostgreSQL** | Primary relational database |
| **Redis** | Caching and real-time features |
| **Socket.IO** | WebSocket communication |
| **JWT** | Authentication tokens |
| **Prisma ORM** | Database abstraction layer |
| **Git.js** | Git operations integration |

### DevOps & Infrastructure
| Technology | Purpose |
|-----------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Multi-container orchestration |
| **GitHub Actions** | CI/CD pipelines |
| **ESLint & Prettier** | Code quality and formatting |
| **Jest** | Unit testing framework |
| **Vitest** | Fast unit testing |

---

## 🏗️ Architecture

### System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
│  ┌──────────────────┐  ┌──────────────────────────────────┐ │
│  │  React Frontend  │  │  Real-time Sync Engine (OT)      │ │
│  │  - Components    │  │  - Conflict Resolution           │ │
│  │  - State Mgmt    │  │  - Event Handling                │ │
│  └──────────────────┘  └──────────────────────────────────┘ │
│           │                         │                        │
│           └─────────────┬───────────┘                        │
│                         │                                    │
└─────────────────────────┼────────────────────────────────────┘
                          │
                    WebSocket/HTTP
                          │
┌─────────────────────────┼────────────────────────────────────┐
│                  API Gateway Layer                           │
│  (Express Server with Auth Middleware)                      │
└─────────────────────────┼────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼────────┐ ┌──────▼────────┐ ┌────▼─────────┐
│  REST API      │ │  WebSocket    │ │  Git Engine  │
│  Endpoints     │ │  Server       │ │  Integration │
└────────────────┘ └───────────────┘ └──────────────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼────────┐ ┌──────▼────────┐ ┌────▼─────────┐
│  PostgreSQL    │ │  Redis Cache  │ │  File Store  │
│  - User Data   │ │  - Sessions   │ │  - Code      │
│  - Projects    │ │  - Real-time  │ │  - Metadata  │
│  - Files       │ │  - Queues     │ │              │
└────────────────┘ └───────────────┘ └──────────────┘
```

### Data Flow Architecture

```
User Action
    │
    ▼
┌─────────────────────────┐
│  Client-Side OT Engine  │ ← Validates operation
└──────────────┬──────────┘
               │
               ▼
        ┌──────────────┐
        │ WebSocket    │ ← Sends update
        │ Event        │
        └──────┬───────┘
               │
               ▼
        ┌──────────────────────┐
        │ Server-Side          │
        │ Conflict Resolution  │ ← Transforms operations
        └──────┬───────────────┘
               │
               ▼
        ┌──────────────────────┐
        │ Broadcast to all     │
        │ Connected Clients    │
        └──────┬───────────────┘
               │
               ▼
        ┌──────────────────────┐
        │ Persist to Database  │
        │ & Cache              │
        └──────────────────────┘
```

---

## 📁 Project Structure

```
CodeSync/
├── 📄 README.md                      # This file
├── 📄 package.json                   # Project dependencies
├── 📄 .gitignore                     # Git ignore rules
├── 📄 .env.example                   # Environment variables template
├── 📄 docker-compose.yml             # Docker composition
├── 📄 tsconfig.json                  # TypeScript configuration
│
├── 📁 frontend/                      # React Client Application
│   ├── 📁 src/
│   │   ├── 📁 components/            # Reusable React components
│   │   │   ├── Editor/               # Code editor component
│   │   │   ├── Dashboard/            # Dashboard views
│   │   │   ├── Project/              # Project management UI
│   │   │   ├── Auth/                 # Authentication components
│   │   │   ├── Collaboration/        # Collaboration features
│   │   │   └── Common/               # Shared components
│   │   │
│   │   ├── 📁 pages/                 # Page components
│   │   │   ├── HomePage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── EditorPage.tsx
│   │   │   └── NotFoundPage.tsx
│   │   │
│   │   ├── 📁 services/              # API service layer
│   │   │   ├── api.ts                # Axios instance
│   │   │   ├── authService.ts
│   │   │   ├── projectService.ts
│   │   │   ├── editorService.ts
│   │   │   └── socketService.ts
│   │   │
│   │   ├── 📁 store/                 # State management (Redux/Zustand)
│   │   │   ├── authSlice.ts
│   │   │   ├── projectSlice.ts
│   │   │   ├── editorSlice.ts
│   │   │   └── store.ts
│   │   │
│   │   ├── 📁 hooks/                 # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useProject.ts
│   │   │   ├── useSocket.ts
│   │   │   └── useEditor.ts
│   │   │
│   │   ├── 📁 utils/                 # Utility functions
│   │   │   ├── constants.ts
│   │   │   ├── helpers.ts
│   │   │   ├── validators.ts
│   │   │   └── formatters.ts
│   │   │
│   │   ├── 📁 styles/                # Global styles
│   │   │   ├── globals.css
│   │   │   ├── tailwind.config.ts
│   │   │   └── variables.css
│   │   │
│   │   ├── 📁 types/                 # TypeScript type definitions
│   │   │   ├── index.ts
│   │   │   ├── api.ts
│   │   │   ├── models.ts
│   │   │   └── events.ts
│   │   │
│   │   ├── App.tsx                   # Root component
│   │   └── main.tsx                  # Entry point
│   │
│   ├── 📁 public/                    # Static assets
│   │   ├── favicon.ico
│   │   └── logo.png
│   │
│   ├── 📄 package.json               # Frontend dependencies
│   ├── 📄 tsconfig.json              # TypeScript config
│   ├── 📄 vite.config.ts             # Vite configuration
│   └── 📄 index.html                 # HTML template
│
├── 📁 backend/                       # Node.js/Express Server
│   ├── 📁 src/
│   │   ├── 📁 controllers/           # Request handlers
│   │   │   ├── authController.ts
│   │   │   ├── projectController.ts
│   │   │   ├── fileController.ts
│   │   │   └── userController.ts
│   │   │
│   │   ├── 📁 services/              # Business logic
│   │   │   ├── authService.ts
│   │   │   ├── projectService.ts
│   │   │   ├── syncService.ts        # Sync/OT logic
│   │   │   ├── gitService.ts
│   │   │   └── collaborationService.ts
│   │   │
│   │   ├── 📁 middleware/            # Express middleware
│   │   │   ├── authMiddleware.ts
│   │   │   ├── errorHandler.ts
│   │   │   ├── logging.ts
│   │   │   └── validation.ts
│   │   │
│   │   ├── 📁 routes/                # API routes
│   │   │   ├── auth.routes.ts
│   │   │   ├── projects.routes.ts
│   │   │   ├── files.routes.ts
│   │   │   └── users.routes.ts
│   │   │
│   │   ├── 📁 models/                # Database models
│   │   │   ├── User.ts
│   │   │   ├── Project.ts
│   │   │   ├── File.ts
│   │   │   ├── Collaboration.ts
│   │   │   └── ActivityLog.ts
│   │   │
│   │   ├── 📁 websocket/             # WebSocket handlers
│   │   │   ├── socketHandler.ts
│   │   │   ├── eventHandlers.ts
│   │   │   ├── operationalTransform.ts
│   │   │   └── presenceManager.ts
│   │   │
│   │   ├── 📁 utils/                 # Utility functions
│   │   │   ├── logger.ts
│   │   │   ├── validators.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── constants.ts
│   │   │
│   │   ├── 📁 config/                # Configuration files
│   │   │   ├── database.ts
│   │   │   ├── redis.ts
│   │   │   ├── auth.ts
│   │   │   └── env.ts
│   │   │
│   │   ├── 📁 types/                 # TypeScript definitions
│   │   │   ├── index.ts
│   │   │   ├── express.ts
│   │   │   └── socket.ts
│   │   │
│   │   └── server.ts                 # Server entry point
│   │
│   ├── 📁 prisma/                    # Database schema
│   │   ├── schema.prisma             # Prisma schema
│   │   └── migrations/               # Database migrations
│   │
│   ├── 📁 tests/                     # Unit & integration tests
│   │   ├── unit/
│   │   ├── integration/
│   │   └── setup.ts
│   │
│   ├── 📄 package.json               # Backend dependencies
│   ├── 📄 tsconfig.json              # TypeScript config
│   ├── 📄 .env.example               # Environment template
│   └── 📄 jest.config.js             # Jest configuration
│
├── 📁 docs/                          # Documentation
│   ├── 📄 API.md                     # API documentation
│   ├── 📄 ARCHITECTURE.md            # Detailed architecture
│   ├── 📄 DEPLOYMENT.md              # Deployment guide
│   ├── 📄 CONTRIBUTING.md            # Contribution guidelines
│   └── 📁 guides/                    # Additional guides
│       ├── 📄 SETUP.md
│       ├── 📄 DEVELOPMENT.md
│       └── 📄 TESTING.md
│
└── 📁 .github/                       # GitHub specific files
    ├── 📁 workflows/                 # CI/CD workflows
    │   ├── test.yml
    │   ├── deploy.yml
    │   └── lint.yml
    └── 📄 ISSUE_TEMPLATE.md
```

---

## 🚀 Setup Instructions

### Prerequisites

- **Node.js**: v18.0 or higher
- **npm**: v9.0 or higher
- **PostgreSQL**: v14 or higher
- **Redis**: v7.0 or higher
- **Git**: v2.0 or higher
- **Docker** (optional): Latest version

### Local Development Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/namra-ace/CodeSync.git
cd CodeSync
```

#### 2. Environment Configuration

Create `.env` files in both backend and frontend directories:

**Backend `.env` (backend/.env)**
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/codesync"

# Redis
REDIS_URL="redis://localhost:6379"

# Authentication
JWT_SECRET="your-secret-key-here"
JWT_EXPIRY="7d"

# Server Configuration
PORT=3000
NODE_ENV="development"
LOG_LEVEL="debug"

# CORS
CORS_ORIGIN="http://localhost:5173"

# Git Configuration
GIT_AUTHOR_NAME="CodeSync Bot"
GIT_AUTHOR_EMAIL="bot@codesync.dev"
```

**Frontend `.env` (frontend/.env)**
```env
VITE_API_URL="http://localhost:3000/api"
VITE_SOCKET_URL="http://localhost:3000"
VITE_ENV="development"
```

#### 3. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

#### 4. Database Setup

```bash
cd backend

# Create database
createdb codesync

# Run Prisma migrations
npx prisma migrate dev --name init

# Seed database (optional)
npm run seed
```

#### 5. Start Development Servers

**Option A: Using npm scripts (from root)**

```bash
# Terminal 1: Start backend
npm run dev:backend

# Terminal 2: Start frontend
npm run dev:frontend
```

**Option B: Using Docker Compose**

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

#### 6. Verify Installation

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **WebSocket**: http://localhost:3000

---

## 📖 Usage Guide

### Getting Started

1. **Create an Account**
   - Navigate to the signup page
   - Fill in your details (email, password, username)
   - Verify your email address

2. **Create a Project**
   - Click "New Project" from the dashboard
   - Enter project name, description, and visibility settings
   - Invite team members (optional)

3. **Start Collaborating**
   - Open a file in the editor
   - Invite collaborators to the project
   - See real-time updates as others edit

### Key Features Usage

#### Real-Time Code Editing
- Open the editor and start typing
- Changes automatically sync to all connected users
- Cursor positions show where others are editing

#### File Management
- Create, rename, or delete files using the file explorer
- Organize files in folders
- Version history available for each file

#### Collaboration
- View active collaborators in the sidebar
- See presence indicators showing cursor positions
- Use comments for code review and discussion

#### Version Control
- Commit changes with meaningful messages
- View commit history and diffs
- Create branches for feature development

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit your changes**
   ```bash
   git commit -m "Add your feature description"
   ```
4. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Create a Pull Request**

### Development Workflow

```bash
# Run linter
npm run lint

# Format code
npm run format

# Run tests
npm run test

# Build for production
npm run build
```

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👥 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/namra-ace/CodeSync/issues)
- **Discussions**: [GitHub Discussions](https://github.com/namra-ace/CodeSync/discussions)
- **Email**: support@codesync.dev

---

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by collaborative development tools
- Thanks to all contributors and supporters

---

<div align="center">

**Made with ❤️ by the CodeSync Team**

⭐ If you find this project helpful, please consider giving it a star!

</div>
