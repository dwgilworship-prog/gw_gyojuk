# Shepherd Flow - 청소년부 사역 관리 플랫폼

## Overview

Shepherd Flow is a premium SaaS platform designed for Korean church youth ministry management. It digitizes and streamlines administrative tasks that were previously handled through Excel spreadsheets, paper records, and group chat applications. The platform enables ministry workers to focus on "Soul Care" rather than administrative burdens.

**Current Version**: v2.0 (December 2025)

The application is a mobile-first web platform that manages:
- Student records and status tracking (with profile cards, gender, baptism info)
- Teacher/staff management
- Mokjang (small group) organization
- Attendance tracking (role-based views for admin/teacher)
- Long absence management (4+ weeks tracking, contact records)
- Dashboard widgets (absence alerts, birthdays, unassigned students)
- Excel export (student roster, teacher roster, attendance data)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Design System**: "Ethereal Glass" aesthetic with violet-indigo gradients, glassmorphism effects, dark mode default
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express
- **API Pattern**: RESTful JSON API with `/api` prefix
- **Authentication**: Passport.js with local strategy, session-based auth using express-session
- **Password Security**: scrypt hashing with random salt

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit with `drizzle-kit push` command
- **Session Storage**: PostgreSQL via connect-pg-simple

### Core Data Models
- **Users**: Authentication accounts with admin/teacher roles
- **Teachers**: Staff profiles linked to user accounts
- **Mokjangs**: Small groups with target grade levels
- **Students**: Youth members with status tracking (ACTIVE/REST/GRADUATED)
- **AttendanceLogs**: Per-student attendance records with status types
- **Reports**: Weekly ministry reports per mokjang

### Project Structure
```
├── client/           # React frontend
│   └── src/
│       ├── components/   # UI components including shadcn/ui
│       ├── pages/        # Route page components
│       ├── hooks/        # Custom React hooks
│       └── lib/          # Utilities and query client
├── server/           # Express backend
│   ├── routes.ts     # API route definitions
│   ├── storage.ts    # Database operations layer
│   └── auth.ts       # Authentication setup
├── shared/           # Shared code between client/server
│   └── schema.ts     # Drizzle schema definitions
└── migrations/       # Database migrations
```

### Authentication Flow
- Session-based authentication with 7-day cookie expiration
- Role-based access control (admin vs teacher)
- Protected routes redirect unauthenticated users to `/auth`

### Responsive Design
- Desktop: Fixed sidebar navigation (w-64)
- Mobile: Bottom tab navigation with floating glass style
- Breakpoints: Mobile (<768px), Tablet (768-1024px), Desktop (>1024px)

## External Dependencies

### Database
- **PostgreSQL**: Primary database via `DATABASE_URL` environment variable
- **Session Store**: PostgreSQL-backed session storage

### Required Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption

### Key NPM Packages
- **UI**: @radix-ui primitives, shadcn/ui components, lucide-react icons
- **Forms**: react-hook-form with zod validation
- **Data**: drizzle-orm, @tanstack/react-query
- **Auth**: passport, passport-local, express-session
- **Utilities**: date-fns with Korean locale support, class-variance-authority