# Learning Management System (LMS)

A full-stack Learning Management System built with **Next.js** (frontend) and **Strapi CMS** (backend).

## Project Structure

```
LMS/
├── frontend/   # Next.js 15 App Router (TypeScript, Tailwind CSS)
├── backend/    # Strapi v5 CMS (TypeScript, SQLite / PostgreSQL)
└── LMS_IMPLEMENTATION_PLAN.md
```

## Quick Start (Local Development)

### 1. Backend (Strapi)
```bash
cd backend
pnpm install
pnpm develop
```
Strapi Admin panel will be available at `http://localhost:1337/admin`.

### 2. Frontend (Next.js)
```bash
cd frontend
pnpm install
pnpm dev
```
Frontend will be available at `http://localhost:3000`.

## Features Roadmap

- **Phase 0:** Environment & Repo Scaffold
- **Phase 1:** Backend Data Model & RBAC Policies
- **Phase 2:** Authentication & Protected Routing
- **Phase 3:** Course Management, Enrollment & Lesson Viewer
- **Phase 4:** Persisted Progress Tracking
- **Phase 5:** Quiz with Server-Side Auto-Grading
- **Phase 6:** Admin Panel & Blog
- **Phase 7:** Deployment (Vercel & Railway)
- **Phase 8:** README & Repo Hygiene
- **Phase 9:** Video Walkthrough Prep
- **Phase 10:** Final Submission
