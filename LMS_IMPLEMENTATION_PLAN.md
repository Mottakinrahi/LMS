# LMS Implementation Plan (Phase-by-Phase, Gated)

## HOW TO USE THIS FILE (read this first, IDE/agent)

- This project is built in **phases**, in order.
- After finishing a phase, **STOP**. Do not start the next phase.
- Print a short summary of what was done, what files were created/changed, and how to test it.
- Wait for explicit user confirmation (e.g. "phase 1 confirmed", "move to phase 2") before starting the next phase.
- If a phase is only partially possible without info only the user has (API keys, account names, deployment URLs), stop and ask for exactly that missing piece — do not skip ahead or invent values.
- Tech stack is **fixed and non-negotiable**: Next.js (frontend, deployed on Vercel) + Strapi (backend/CMS, deployed on Railway). Do not substitute any part of this stack.

---

## Global Context (read once, keep in mind for every phase)

**Roles:** Admin, Content Manager, Instructor, Student.

**Permission matrix (must be enforced on the backend, not just hidden in UI):**

| Action | Admin | Content Manager | Instructor | Student |
|---|---|---|---|---|
| Manage users & assign roles | ✅ | ❌ | ❌ | ❌ |
| Create/edit/delete any course | ✅ | ✅ | Own only | ❌ |
| Add/edit/delete lessons | ✅ | ✅ | Own courses only | ❌ |
| Create quizzes | ✅ | ✅ | Own courses only | ❌ |
| View student progress | ✅ | ✅ | Own courses only | Own only |
| Write/manage blog posts | ✅ | ✅ | ❌ | ❌ |
| Enroll in a course | ❌ | ❌ | ❌ | ✅ |
| Take quizzes | ❌ | ❌ | ❌ | ✅ |

**Core features required:** auth + RBAC, course management, enrollment, lesson viewing.
**Differentiator features required:** progress tracking (persisted %, per student per course), quiz with auto-grading (server-computed score), admin panel (manage user roles + platform stats), blog with draft/published state.

**Non-negotiable engineering rules to apply in every phase:**
1. Every restricted action must be blocked at the **API level** (Strapi policy/controller), never only via frontend conditional rendering.
2. Instructor-owned resources (their own courses/lessons/quizzes) must be checked by **ownership**, not just role — a policy that only checks "is this user an Instructor" is not enough; it must check "does this Instructor own this specific course."
3. Quiz scoring must be computed **server-side** in Strapi, not trusted from the client.
4. Commit to git after each meaningful chunk of work inside a phase — never one giant commit at the end.

---

## Phase 0 — Environment & Repo Scaffold

> **NOTE: The user sets up the environment and scaffolds both projects manually.** The IDE/agent's job in Phase 0 is only to **verify** the scaffold is correct and runnable, install dependencies with `pnpm`, and make the first commit. Do not run `create-strapi-app` or `create-next-app` yourself unless the user explicitly asks — assume the folders already exist when this phase starts.

**Goal:** both apps boot locally with `pnpm`, repo exists with real commit history from the start.

Tasks:
1. Confirm repo structure exists: monorepo with `/frontend` (Next.js) and `/backend` (Strapi) folders, or two separate repos — confirm which with the user if unclear.
2. Confirm `pnpm` is available (`pnpm -v`). If not installed: `npm install -g pnpm`.
3. Install dependencies in each project:
   ```bash
   cd backend && pnpm install
   cd ../frontend && pnpm install
   ```
4. Confirm both run locally:
   ```bash
   # Terminal 1
   cd backend && pnpm develop

   # Terminal 2
   cd frontend && pnpm dev
   ```
5. Confirm Strapi is using **Postgres**, not the SQLite default (see the full Strapi setup guide below — this must be set correctly before Phase 1's content-types are built, since switching databases later means redoing migrations).
6. Add a root-level README stub (filled in properly in Phase 8).
7. Initialize git (if not already) and make an initial commit.

**STOP. Report the confirmed repo structure, `pnpm install` results, and confirmation both apps run locally. Wait for confirmation before Phase 1.**

---

### 📘 Full Strapi Setup Guide (for Phase 0)

Use this as the reference for setting up `/backend` correctly with `pnpm` and Postgres, since the stack is fixed and Strapi's defaults (SQLite, npm) don't match what this project needs.

#### 1. Create the Strapi project with pnpm

From the repo root:
```bash
pnpm dlx create-strapi-app@latest backend --typescript
```
- When prompted, choose **Custom (manual settings)** so you can pick Postgres instead of the SQLite default.
- Database client: **postgres**
- Fill in database name/host/port/username/password when prompted (see step 3 for local Postgres, or skip straight to Railway's values if developing against a remote DB from day one).
- Or non-interactively:
  ```bash
  pnpm dlx create-strapi-app@latest backend --typescript --dbclient=postgres --dbhost=<host> --dbport=<port> --dbname=<dbname> --dbusername=<user> --dbpassword=<password>
  ```

#### 2. Confirm pnpm is the package manager

Inside `/backend`, check `package.json` doesn't assume npm-specific scripts, and always install with:
```bash
pnpm install
```
If Strapi's generated lockfile is `package-lock.json`, delete it and regenerate with `pnpm install` so the whole team/agent is consistently on one lockfile.

#### 3. Local Postgres (for local development)

Option A — Docker (recommended, avoids installing Postgres system-wide):
```bash
docker run --name lms-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=lms -p 5432:5432 -d postgres:16
```

Option B — native Postgres install: create a database and user manually, then use those credentials below.

#### 4. Environment variables

In `/backend/.env` (Strapi generates most of these on scaffold — verify they exist, don't overwrite blindly):
```env
HOST=0.0.0.0
PORT=1337

APP_KEYS=<comma-separated random strings>
API_TOKEN_SALT=<random string>
ADMIN_JWT_SECRET=<random string>
TRANSFER_TOKEN_SALT=<random string>
JWT_SECRET=<random string>

DATABASE_CLIENT=postgres
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=lms
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_SSL=false
```
Generate random secrets quickly with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
Run this once per secret needed (`APP_KEYS` needs 2–4 comma-separated values, the rest need one each).

#### 5. Run and create the first admin user

```bash
cd backend
pnpm develop
```
- Visit `http://localhost:1337/admin` and create the first Strapi **admin panel** user (this is separate from the application-level "Admin" role discussed in Phase 1 — this one is for managing content-types/permissions in the Strapi dashboard itself).

#### 6. Confirm it's wired correctly

- Strapi admin panel loads at `/admin`.
- `Settings → Database` (or the terminal startup log) confirms it's connected to Postgres, not SQLite.
- `pnpm develop` restarts cleanly with no missing-env-var errors.

Once this is confirmed, Phase 0 is done for the backend side — Phase 1 will build the actual content-types and roles on top of this foundation.

---

## Phase 1 — Backend Data Model & Roles

**Goal:** Strapi content-types and custom roles exist, with ownership-aware permission policies in place — the foundation everything else depends on.

### 1a. Content-Types

Create these in Strapi:

- **Course**: `title` (string), `description` (text), `coverImageUrl` (string), `owner` (relation → User, one-to-one or many-to-one, used for Instructor ownership), timestamps.
- **Lesson**: `title` (string), `content` (rich text or long text), `videoUrl` (string, optional), `order` (integer), `course` (relation → Course).
- **Enrollment**: `student` (relation → User), `course` (relation → Course), `enrolledAt` (datetime).
- **LessonProgress**: `student` (relation → User), `lesson` (relation → Lesson), `completed` (boolean), `completedAt` (datetime).
- **Quiz**: `title` (string), `course` (relation → Course).
- **Question**: `text` (string), `options` (JSON array of strings, or a repeatable component), `correctOptionIndex` (integer), `quiz` (relation → Quiz).
- **QuizAttempt**: `student` (relation → User), `quiz` (relation → Quiz), `answers` (JSON), `score` (integer), `submittedAt` (datetime).
- **BlogPost**: `title` (string), `body` (rich text), `coverImageUrl` (string, optional), `author` (relation → User). Enable Strapi's built-in **Draft & Publish** on this content-type to get draft/published state for free.

### 1b. Roles

In Users & Permissions plugin:
- Add three custom roles: `Content Manager`, `Instructor`, `Student`. (Admin can be represented either as a 4th application role or mapped to Strapi's own admin — decide and document the choice; a 4th "Admin" application role is simpler for the "log in as admin on the same frontend" flow the video demo needs.)
- For each role, set base collection-level permissions (find/findOne/create/update/delete) per the matrix above as a first pass.

### 1c. Ownership Policies (the hard/critical part)

- Write a custom Strapi policy (or controller override) for Course/Lesson/Quiz update/delete routes that:
  - Allows Admin and Content Manager through unconditionally (per matrix).
  - For Instructor: fetches the target resource, checks `resource.owner.id === ctx.state.user.id` (for Lesson/Quiz, check the *parent course's* owner), and rejects with 403 if it doesn't match.
  - Rejects Student entirely from these routes.
- Apply the same ownership check pattern to "view student progress" — Instructor can only view progress for students in courses they own.

### 1d. Manual Verification

- Using Strapi's API (Postman/curl/Thunder Client), obtain a JWT for one test user per role and confirm:
  - Admin can do everything.
  - Content Manager can manage all courses/lessons/quizzes/blog but not users.
  - Instructor can only edit/delete a course they own, and gets 403 on one they don't.
  - Student gets 403 on all course/lesson/quiz-management routes.

**STOP. Report the content-types created, the roles configured, and the ownership-policy code written, plus the manual test results above. Wait for explicit confirmation before Phase 2.**

---

## Phase 2 — Authentication & Protected Routing (Frontend)

**Goal:** all 4 roles can sign up/log in, and role-restricted pages are blocked server-side, not just hidden.

Tasks:
1. Build signup and login pages in Next.js hitting Strapi's `/api/auth/local/register` and `/api/auth/local`.
2. Store the JWT in an httpOnly cookie (via a Next.js route handler), not localStorage.
3. Build a server-side auth check (middleware or server component) that reads the current user's role (via a call to Strapi's `/api/users/me`) and redirects/blocks access to pages the role isn't permitted to see.
4. Confirm that a direct API call made as a Student to an Instructor-only backend route still returns 403 — this must hold true even if the frontend route guard were bypassed.
5. Commit.

**STOP. Report the auth flow built and confirm role-gated pages block correctly for each role, at both the frontend-route and backend-API level. Wait for confirmation before Phase 3.**

---

## Phase 3 — Course Management, Enrollment, Lesson Viewing

**Goal:** all 4 core features work end-to-end.

Tasks:
1. Course CRUD UI:
   - Admin/Content Manager: see and manage all courses.
   - Instructor: sees and manages only their own courses (filtered by `owner` both in the UI query and re-checked on the backend).
2. Lesson CRUD nested under a course, respecting the same ownership rules.
3. Public/browsable course catalog for Students.
4. "Enroll" action on a course creates an `Enrollment` record for the logged-in student.
5. "My Courses" view for Student, filtered by their own enrollments.
6. Lesson viewer for enrolled students, listing lessons in `order` sequence; block access to lessons of courses the student is not enrolled in (backend-enforced).
7. Commit.

**STOP. Report what was built and how to manually test the full course → enroll → view-lesson flow per role. Wait for confirmation before Phase 4.**

---

## Phase 4 — Progress Tracking

**Goal:** persisted, accurate, per-student per-course progress.

Tasks:
1. "Mark complete" action on a lesson (Student only, and only for lessons in courses they're enrolled in) that upserts a `LessonProgress` record.
2. Progress percentage calculation: `(completed lessons in course / total lessons in course) * 100`. Prefer computing this via a custom Strapi endpoint (not just client-side math) so it's a clean example for the "data flow" explanation later.
3. Display progress % on both "My Courses" (Student) and the course-view page (Instructor/Content Manager/Admin, per matrix).
4. Explicitly test: complete a lesson, refresh the page, confirm progress persists.
5. Commit.

**STOP. Report the implementation and confirm refresh-persistence works. Wait for confirmation before Phase 5.**

---

## Phase 5 — Quiz with Auto-Grading

**Goal:** server-graded quiz scoring, results stored and viewable later.

Tasks:
1. Quiz builder UI (Admin/Content Manager/Instructor-on-own-course): add a quiz to a course, add MCQ questions with options and a correct-option index.
2. Student-facing quiz-taking UI: renders questions, collects selected answers, submits.
3. **Server-side grading**: a custom Strapi controller/route that receives the student's submitted answers, looks up the real `correctOptionIndex` values from the database (never trusts a score sent from the client), computes the score, and saves a `QuizAttempt`.
4. Student can view their past quiz attempt(s) and scores.
5. Commit.

**STOP. Report the grading endpoint logic and confirm a tampered client-side score would be ignored (grading is server-computed). Wait for confirmation before Phase 6.**

---

## Phase 6 — Admin Panel & Blog

**Goal:** admin-only dashboard with role management + stats; blog with draft/published control.

Tasks:
1. Admin-only dashboard route (blocked for all other roles at both frontend and backend level).
2. User list with current role shown, plus an action to change a user's role (calls Strapi's user-permissions update endpoint).
3. Basic platform stats: count of users per role, total courses, total enrollments — simple aggregate queries, displayed on the dashboard.
4. Blog CRUD for Content Manager/Admin, using Strapi's Draft & Publish state.
5. Public blog list/detail pages that only ever query **published** posts.
6. Admin can edit/delete any blog post, including others' (per matrix); Content Manager manages posts per the matrix.
7. Commit.

**STOP. Report what was built and confirm role-change works and draft posts are invisible to the public blog view. Wait for confirmation before Phase 7.**

---

## Phase 7 — Deployment

**Goal:** both apps live, talking to each other correctly.

Tasks:
1. Deploy Strapi to Railway with a Postgres addon; set required env vars (`APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `JWT_SECRET`, `DATABASE_URL`, `TRANSFER_TOKEN_SALT`, etc.). Confirm Railway's build/start commands use `pnpm` (e.g. build: `pnpm install && pnpm build`, start: `pnpm start`) — set this explicitly in Railway's service settings if it defaults to npm/yarn.
2. Deploy Next.js to Vercel; set the frontend's API base URL env var to point at the live Railway backend URL. In Vercel's project settings, confirm the install/build commands use `pnpm` (Vercel auto-detects this from `pnpm-lock.yaml`, but verify it under Project Settings → General → Build & Development Settings).
3. Configure Strapi CORS to allow the Vercel domain.
4. Re-run the full smoke test (signup → login → course → enroll → lesson → progress → quiz → admin → blog) against the **live URLs**, not localhost.
5. Commit any deployment-config changes.

**STOP. Report the live Vercel and Railway URLs and confirm the smoke test passed against them. Wait for confirmation before Phase 8.**

---

## Phase 8 — README & Repo Hygiene

**Goal:** a reviewer can clone, run locally, and understand what's done.

Tasks:
1. Write the README: local setup instructions for both frontend and backend, required env vars, and a checklist of which features are completed.
2. Review commit history — confirm it reflects incremental work across phases, not a single dump commit.
3. Quick pass on obvious edge cases: empty states (no courses yet), a student trying to access an unenrolled course's lesson directly by URL, a student attempting to retake a quiz.
4. Commit.

**STOP. Report README contents summary and any edge cases found/fixed. Wait for confirmation before Phase 9.**

---

## Phase 9 — Video Walkthrough Prep

**Goal:** a script/checklist so the recording covers every required beat without rereading the spec live.

Tasks:
1. Produce a short recording script/checklist covering, in order:
   - Live demo across all 3 role types (student: enroll → lesson → progress → quiz; instructor/content manager: create course → lesson → quiz → blog post; admin: admin panel → manage a user's role).
   - Data flow for one feature end-to-end (frontend → Strapi → back).
   - Backend-enforced role-based access (show a blocked API call, not just a hidden UI button).
   - Progress tracking logic, explained against the actual code.
   - Quiz auto-grading logic, explained against the actual code.
   - Admin panel + blog draft → publish flow.
   - Deployment setup for Vercel/Railway and how env vars were handled.
2. Do not record yet in this step — just produce the checklist/script and confirm every required beat has a concrete place in the app to demo it.

**STOP. Report the script/checklist. Wait for confirmation before Phase 10.**

---

## Phase 10 — Final Submission Checklist

Confirm all four required items are ready and working:
- [ ] Public GitHub repo link (frontend + backend, real commit history)
- [ ] Live Vercel frontend URL
- [ ] Live Railway backend URL
- [ ] Video walkthrough link (Google Drive/YouTube unlisted, openable by others)

**STOP. Report final checklist status. This is the last phase.**
