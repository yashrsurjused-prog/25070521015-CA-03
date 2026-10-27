# Smart Campus Service Portal

A full-stack campus service portal for managing **complaints** and
**lost-and-found items** in one place. Students can report problems, track their
status, browse found items, and submit ownership claims. Administrators get a
separate portal for moderation, analytics, and user oversight.

The application is a JavaScript-only MERN-style project built with React,
Express, MongoDB, and Mongoose. It uses real REST APIs and a local MongoDB
database; there are no mock APIs or external backend services.

## Table of Contents

- [Problem Statement](#problem-statement)
- [Objectives](#objectives)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Creating an Administrator](#creating-an-administrator)
- [Running the Application](#running-the-application)
- [Core Workflows](#core-workflows)
- [API Reference](#api-reference)
- [Database Design](#database-design)
- [Frontend Routes and Access](#frontend-routes-and-access)
- [Security Practices](#security-practices)
- [Testing and Verification](#testing-and-verification)
- [Screenshots](#screenshots)
- [Limitations](#limitations)
- [Future Enhancements](#future-enhancements)
- [Documentation](#documentation)

## Problem Statement

Campus services are often handled through scattered messages, paper forms, or
informal conversations. Students cannot easily track whether an issue was
received or resolved, and staff cannot easily prioritise or review requests.
Lost-and-found items face a similar problem: reports are fragmented and there is
no controlled way to verify ownership before an item is returned.

The Smart Campus Service Portal addresses these problems with a single,
role-based web application that records every request, preserves status history,
enforces ownership rules, and provides administrators with a live operational
view.

## Objectives

- Provide one portal for campus complaints and lost-and-found reporting.
- Give students a transparent view of request status and history.
- Enforce clear role-based permissions for students and administrators.
- Support a controlled lost-and-found claim and verification process.
- Give administrators live analytics and moderation tools.
- Apply secure authentication, input validation, and safe data exposure.
- Deliver a responsive interface that works on desktop and mobile screens.

## Key Features

### Student features

- Register, log in, restore a session, and log out.
- Submit complaints and receive a unique ticket ID.
- Track complaint status, priority, remarks, and status history.
- Edit or delete their own complaints while the status is `pending`.
- Search and filter complaints by status, category, priority, and keyword.
- Report lost or found items with optional event date and image URL.
- Browse non-rejected listings with search, type, category, location, and date
  filters.
- Edit or delete their own listings while they are `open`.
- Submit a claim on another student's open listing for administrator review.
- View claim outcomes and moderation notes where permitted.

### Administrator features

- Dedicated administrator dashboard with live MongoDB statistics.
- Search, filter, and paginate all complaints.
- Update complaint priority and move complaints through allowed status
  transitions.
- Reject complaints with a required reason and review status history.
- Review all lost-and-found listings, including rejected items.
- Approve or reject claims, reject a pending claim while keeping the listing
  open, mark items as returned after approval, and delete listings.
- Search and filter the user directory without exposing password hashes.
- Protected admin routes and API endpoints.

### Quality and security features

- JWT authentication with one-hour expiry.
- bcrypt password hashing; password hashes are excluded from API responses.
- Ownership checks on student edits, deletes, and claims.
- Server-side validation for text lengths, filters, pagination, dates, and URLs.
- Allowed status-transition rules enforced by the backend.
- Responsive navigation, loading skeletons, empty states, error messages, and
  accessible confirmation dialogs.
- Optional CORS origin allowlist through `CORS_ORIGIN`.
- JSON request body size limit of `100kb`.

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite 8, React Router 7, JavaScript/JSX |
| Styling | Hand-written CSS with responsive breakpoints and design tokens |
| HTTP client | Axios |
| Backend | Node.js, Express 5, JavaScript ES modules |
| Database | MongoDB with Mongoose |
| Authentication | JSON Web Tokens (JWT) and bcryptjs |
| Database tool | MongoDB Compass |
| Linting | oxlint |
| Build tool | Vite |

## System Architecture

```text
Browser
  |
  |  React single-page application (Vite, React Router, Axios)
  v
Frontend at http://localhost:5173
  |
  |  REST requests with "Authorization: Bearer <JWT>"
  v
Express API at http://localhost:5000
  |
  +-- Auth middleware (JWT verification and role checks)
  +-- Controllers (validation, ownership rules, status transitions)
  +-- Mongoose models
  |
  v
MongoDB database: smartCampusDB
```

The frontend and backend are separate applications. The API is stateless: the
JWT identifies the user on each protected request, and all business rules are
enforced on the server.

## Repository Structure

```text
25070521015/
|-- client/                          React + Vite frontend
|   |-- public/
|   |   `-- favicon.svg              Branded SC favicon
|   |-- src/
|   |   |-- components/              Shared UI, shells, guards, dialogs
|   |   |   |-- AdminDashboardShell.jsx
|   |   |   |-- AdminSidebar.jsx
|   |   |   |-- AuthShell.jsx
|   |   |   |-- Button.jsx
|   |   |   |-- ConfirmDialog.jsx
|   |   |   |-- ConnectionStatus.jsx
|   |   |   |-- DashboardShell.jsx
|   |   |   |-- EmptyState.jsx
|   |   |   |-- ErrorMessage.jsx
|   |   |   |-- Footer.jsx
|   |   |   |-- InputField.jsx
|   |   |   |-- Navbar.jsx
|   |   |   |-- PageLoader.jsx
|   |   |   |-- ProtectedRoute.jsx
|   |   |   |-- PublicOnlyRoute.jsx
|   |   |   |-- SafeImage.jsx
|   |   |   |-- Sidebar.jsx
|   |   |   |-- Skeleton.jsx
|   |   |   |-- StatusBadge.jsx
|   |   |   `-- SuccessMessage.jsx
|   |   |-- context/                 Auth context and useAuth hook
|   |   |-- pages/                   Public, student, and admin pages
|   |   |-- services/
|   |   |   `-- api.js               Axios instance and error helpers
|   |   |-- App.css                  Layout, components, responsive rules
|   |   |-- App.jsx                  Routes and route guards
|   |   |-- index.css                Design tokens and shared styles
|   |   `-- main.jsx                 React entry point
|   |-- .gitignore
|   |-- .oxlintrc.json
|   |-- index.html
|   |-- package.json
|   `-- vite.config.js
|-- server/                          Express backend (ES modules)
|   |-- src/
|   |   |-- config/
|   |   |   `-- db.js                MongoDB connection and status helpers
|   |   |-- controllers/
|   |   |   |-- admin.controller.js
|   |   |   |-- auth.controller.js
|   |   |   |-- complaint.controller.js
|   |   |   |-- health.controller.js
|   |   |   `-- lostFound.controller.js
|   |   |-- middleware/
|   |   |   |-- authMiddleware.js    JWT verification and role checks
|   |   |   |-- errorHandler.js
|   |   |   `-- notFound.js
|   |   |-- models/
|   |   |   |-- Complaint.js
|   |   |   |-- LostFoundItem.js
|   |   |   |-- Notification.js
|   |   |   `-- User.js
|   |   |-- routes/
|   |   |   |-- admin.routes.js
|   |   |   |-- auth.routes.js
|   |   |   |-- complaint.routes.js
|   |   |   |-- health.routes.js
|   |   |   `-- lostFound.routes.js
|   |   |-- scripts/
|   |   |   `-- createAdmin.js       Controlled admin account creation
|   |   |-- app.js                   Express app and middleware
|   |   `-- server.js                Server startup and shutdown
|   |-- .env.example
|   `-- package.json
|-- .gitignore
|-- PROJECT_REPORT.md
|-- README.md
`-- VIVA_PREPARATION.md
```

## Prerequisites

- Node.js **20.19 or newer**, or **22.12 or newer** (required by Vite 8).
- npm.
- MongoDB Community Server installed and running locally.
- MongoDB Compass, or another MongoDB client, for inspecting data.
- A modern web browser.

### Start MongoDB

- **Windows:** start the **MongoDB** service from Services, or run
  `net start MongoDB` in an Administrator terminal.
- **macOS (Homebrew):** `brew services start mongodb-community`
- **Linux:** `sudo systemctl start mongod`

Confirm MongoDB is listening on the default port `27017`.

## Local Setup

Dependencies are separate for the frontend and backend.

### 1. Install backend dependencies

```bash
cd server
npm install
```

### 2. Create the backend environment file

Windows:

```bash
copy .env.example .env
```

macOS or Linux:

```bash
cp .env.example .env
```

Edit `server/.env` and set a strong `JWT_SECRET`. Keep the database name as
`smartCampusDB`.

### 3. Install frontend dependencies

```bash
cd client
npm install
```

### 4. Optional frontend API URL

The frontend defaults to `http://localhost:5000`. To use a different backend
URL, create `client/.env`:

```env
VITE_API_URL=http://localhost:5000
```

Never place `JWT_SECRET`, `MONGODB_URI`, or administrator credentials in
frontend environment files.

## Environment Variables

### Backend (`server/.env`)

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | API port. Defaults to `5000` in the example file. |
| `MONGODB_URI` | Yes | MongoDB connection string. Must target the local database. |
| `JWT_SECRET` | Yes | Long random secret used to sign and verify tokens. |
| `CORS_ORIGIN` | No | Comma-separated allowed frontend origins. If unset, CORS allows all origins for local development. |

Example:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/smartCampusDB
JWT_SECRET=replace_with_a_long_random_secret
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
```

The database name used by the application is always `smartCampusDB`.

### Frontend (`client/.env`)

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | No | Backend base URL. Defaults to `http://localhost:5000`. |

Real `.env` files are ignored by Git. Only `.env.example` is committed.

## Creating an Administrator

Public registration always creates a `student` account. Administrators are
created with a controlled command-line script that validates the input, hashes
the password, and never prints secrets.

Run the command from `server/` with MongoDB running.

### Windows PowerShell

```powershell
cd server
$env:ADMIN_NAME = "Campus Administrator"
$env:ADMIN_EMAIL = "admin@yourcollege.edu"
$securePassword = Read-Host "Admin password" -AsSecureString
$env:ADMIN_PASSWORD = [System.Net.NetworkCredential]::new("", $securePassword).Password
npm run create-admin
Remove-Item Env:ADMIN_NAME, Env:ADMIN_EMAIL, Env:ADMIN_PASSWORD
```

### macOS or Linux

```bash
cd server
read -s -p "Admin password: " ADMIN_PASSWORD; echo
ADMIN_NAME="Campus Administrator" \
ADMIN_EMAIL="admin@yourcollege.edu" \
ADMIN_PASSWORD="$ADMIN_PASSWORD" \
npm run create-admin
unset ADMIN_PASSWORD
```

Requirements:

- `ADMIN_NAME`: 2 to 100 characters.
- `ADMIN_EMAIL`: valid and not already registered.
- `ADMIN_PASSWORD`: at least 8 characters and no more than 72 bytes.

Do not commit administrator credentials. The local demonstration account used
during development is not part of the repository configuration.

## Running the Application

Use two terminals.

### Terminal 1: backend

```bash
cd server
npm run dev
```

The API runs at `http://localhost:5000`. The server connects to MongoDB before
it starts listening and exits if the initial connection fails.

### Terminal 2: frontend

```bash
cd client
npm run dev
```

The frontend runs at `http://localhost:5173`.

### Health check

```bash
curl http://localhost:5000/api/health
```

A healthy response includes `"status": "healthy"`, `"database.status":
"connected"`, and `"database.name": "smartCampusDB"`.

## Core Workflows

### Complaint lifecycle

```text
Student submits complaint
  -> pending
  -> under_review (optional)
  -> in_progress
  -> resolved

Any non-terminal complaint can be rejected with a reason.
resolved and rejected are terminal states.
```

1. A student submits a complaint and receives a ticket ID in the format
   `CMP-YYYYMMDD-XXXXXXXX`.
2. The complaint starts as `pending` with `medium` priority.
3. An administrator reviews it and moves it through allowed status transitions.
4. Every transition is appended to the complaint history and creates a
   notification for the student.
5. Students can edit or delete only their own `pending` complaints.

### Lost-and-found lifecycle

```text
Student reports item -> open
Student submits claim -> claim pending (listing stays open)
Admin approves claim -> claimed
Admin marks item returned -> returned
```

- A student cannot claim their own listing.
- Only other students can claim an `open` listing.
- A listing can have only one active claim.
- Marking an item `returned` requires an approved claim.
- A pending claim can be rejected while the listing remains `open`.
- Rejected listings are hidden from students.
- Students can edit or delete only their own `open` listings.

## API Reference

All endpoints return JSON. Protected endpoints require:

```text
Authorization: Bearer <token>
```

Tokens expire after **1 hour**. There is no refresh-token endpoint.

### Common responses

| Status | Meaning |
| --- | --- |
| `400` | Invalid input, ID, filter, or status transition |
| `401` | Missing, invalid, or expired token; bad login |
| `403` | Authenticated but not allowed by role or ownership |
| `404` | Resource not found |
| `409` | Conflict, such as duplicate email, active claim, or non-pending edit |
| `500` | Unexpected server error |

Validation errors include an `errors` array:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["Title is required"]
}
```

### Authentication endpoints

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Register a student |
| `POST` | `/api/auth/login` | Public | Log in and receive a JWT |
| `GET` | `/api/auth/me` | Authenticated | Get the current user's profile |

Registration body:

```json
{
  "name": "Asha Sharma",
  "email": "asha@example.com",
  "password": "StrongPass123!",
  "department": "Computer Science",
  "studentId": "STU-2026-001"
}
```

`department` and `studentId` are optional. Passwords must be at least 8
characters and no more than 72 bytes. A client-supplied `role` is ignored.

### Complaint endpoints

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/complaints` | Student | Create a complaint |
| `GET` | `/api/complaints` | Authenticated | List own complaints (student) or all (admin) |
| `GET` | `/api/complaints/:id` | Owner or admin | Get one complaint |
| `PATCH` | `/api/complaints/:id` | Owner (pending) or admin | Update complaint details |
| `PATCH` | `/api/complaints/:id/status` | Admin | Change status |
| `DELETE` | `/api/complaints/:id` | Owner (pending) or admin | Delete a complaint |

Create body:

```json
{
  "title": "Broken lab light",
  "description": "The tube light in Lab 101 is not working.",
  "category": "Maintenance",
  "location": "Lab 101"
}
```

Complaint list filters: `status`, `priority`, `category`, `search`, `page`, and
`limit` (maximum 50).

Allowed status transitions:

| Current | Allowed next |
| --- | --- |
| `pending` | `under_review`, `in_progress`, `rejected` |
| `under_review` | `in_progress`, `rejected` |
| `in_progress` | `resolved`, `rejected` |
| `resolved` | None |
| `rejected` | None |

A rejection requires remarks. Successful transitions add a history entry and a
notification for the complaint owner.

### Lost-and-found endpoints

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/lost-found` | Student | Create a listing |
| `GET` | `/api/lost-found` | Authenticated | Browse listings |
| `GET` | `/api/lost-found/:id` | Authorised viewer | Get one listing |
| `PATCH` | `/api/lost-found/:id` | Owner (open) or admin | Update listing details |
| `DELETE` | `/api/lost-found/:id` | Owner (open) or admin | Delete a listing |
| `POST` | `/api/lost-found/:id/claim` | Student | Claim another user's open listing |
| `PATCH` | `/api/lost-found/:id/status` | Admin | Moderate status and claims |

Create body:

```json
{
  "title": "Lost black phone",
  "type": "lost",
  "category": "Electronics",
  "description": "Black phone with a cracked screen and a blue case.",
  "location": "Central Library",
  "eventDate": "2026-10-20T10:00:00.000Z",
  "imageUrl": "https://example.com/lost-phone.jpg"
}
```

Required fields: `title`, `type` (`lost` or `found`), `category`, `description`,
and `location`. `eventDate` and `imageUrl` are optional. Event dates cannot be
in the future, and image URLs must use `http://` or `https://`. File uploads are
not implemented.

List filters: `search`, `type`, `category`, `location`, `status`, `dateFrom`,
`dateTo`, `page`, and `limit` (maximum 50). Students never receive rejected
listings; administrators do.

Claim body:

```json
{
  "message": "The phone has my blue case and a cracked corner."
}
```

Allowed moderation transitions:

| Current | Allowed next | Effect |
| --- | --- | --- |
| `open` | `claimed`, `rejected` | Approve a pending claim or reject the listing |
| `claimed` | `open`, `returned`, `rejected` | Reject the claim and reopen, mark returned, or reject |
| `returned` | None | Terminal |
| `rejected` | None | Terminal |

Sending `{"status": "open"}` for an open listing with a pending claim rejects
that claim while keeping the listing open.

### Administrator endpoints

Both endpoints require an `admin` token. Students receive `403`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin/analytics` | Live counts, breakdowns, recent activity, average resolution time |
| `GET` | `/api/admin/users` | Paginated user directory with safe fields |

User directory filters: `search`, `role`, `page`, and `limit` (maximum 100).
Responses never include `passwordHash`.

### Health endpoint

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | Server and database health |

## Database Design

Database name: `smartCampusDB`.

### Collections

| Collection | Key fields | Notes |
| --- | --- | --- |
| `users` | `name`, `email`, `passwordHash`, `role`, `department`, `studentId` | Email is unique and lowercase. Password hash is excluded by default. |
| `complaints` | `ticketId`, `title`, `description`, `category`, `location`, `priority`, `status`, `createdBy`, `assignedTo`, `history` | Unique ticket ID; history stores actor, status, remark, and timestamp. |
| `lostfounditems` | `title`, `type`, `category`, `description`, `location`, `eventDate`, `imageUrl`, `status`, `reportedBy`, `claim`, moderation fields | Claims are embedded documents with their own review state. |
| `notifications` | `userId`, `title`, `message`, `read` | Created automatically for relevant status and claim events. |

### Relationships

- A user creates many complaints (`complaints.createdBy`).
- A user creates many lost-and-found listings (`lostfounditems.reportedBy`).
- A complaint optionally references an assigned user (`assignedTo`).
- A lost-and-found listing embeds one claim with a claimant and reviewer.
- Notifications reference the recipient user.

### Indexes

- `users.role`
- `complaints`: `(createdBy, createdAt)`, `(status, createdAt)`, `assignedTo`
- `lostfounditems`: `(type, status, createdAt)`, `(reportedBy, status,
  createdAt)`, `(category, status, createdAt)`, `claim.requestedBy`
- `notifications`: `(userId, read, createdAt)`

## Frontend Routes and Access

### Public routes

| Route | Page |
| --- | --- |
| `/` | Home |
| `/login` | Login (authenticated users are redirected) |
| `/register` | Register (authenticated users are redirected) |
| `*` | Not found |

### Student routes

| Route | Page |
| --- | --- |
| `/student/dashboard` | Student overview |
| `/complaints` | Complaint list and filters |
| `/complaints/new` | Create complaint |
| `/complaints/:id` | Complaint details |
| `/complaints/:id/edit` | Edit pending complaint |
| `/lost-found` | Lost-and-found list |
| `/lost-found/new` | Report item |
| `/lost-found/:id` | Item details and claim |

### Administrator routes

| Route | Page |
| --- | --- |
| `/admin/dashboard` | Analytics overview |
| `/admin/complaints` | Complaint management |
| `/admin/lost-found` | Lost-and-found management |
| `/admin/users` | User directory |

`ProtectedRoute` checks authentication and role. `PublicOnlyRoute` prevents
logged-in users from opening the login and registration pages.

## Security Practices

- Passwords are hashed with bcrypt using 10 salt rounds.
- Plain-text passwords are never stored or returned.
- `passwordHash` uses `select: false` and is also explicitly excluded from user
  directory queries.
- JWT payloads contain only the user ID and role; user identity is never taken
  from an unverified request body.
- Protected routes require a valid Bearer token; administrator endpoints also
  require the `admin` role.
- Ownership checks prevent students from editing, deleting, or claiming records
  that do not belong to them.
- The backend enforces allowed status transitions rather than trusting the UI.
- Validation covers required fields, string types, maximum lengths, pagination,
  dates, and image URLs.
- Rejected lost-and-found listings are hidden from students.
- The server returns generic `500` messages without internal details.
- CORS can be restricted with `CORS_ORIGIN`; JSON bodies are limited to `100kb`.
- `.env` files and build output are ignored by Git.

## Testing and Verification

The following checks were run against the local MongoDB database during final
verification. Temporary test scripts and test records were removed afterward.

| Check | Result |
| --- | --- |
| Backend integration suite | **88 passed, 0 failed** |
| Browser end-to-end suite | **25 passed, 0 failed** |
| Post-refactor browser smoke suite | **10 passed, 0 failed** |
| Final API role and workflow checks | **58 passed, 0 failed** |
| Production build | **Passed** (118 modules transformed) |
| Lint | **Passed** with 9 non-blocking advisories |
| Health endpoint | `200`, database `connected` |
| Database cleanup | 2 legitimate users; 0 test complaints, listings, notifications |

### Commands

```bash
cd client
npm run lint
npm run build
```

The lint advisories are `react(set-state-in-effect)` notices for the standard
fetch-on-mount pattern used by the data pages. They do not block the build or
runtime, and they were not suppressed.

### Manual acceptance checks

- Register a new student, reject a duplicate email, log in, refresh, and log out.
- Confirm invalid credentials and invalid tokens are rejected.
- Submit a complaint, verify its ticket ID in Compass, and moderate it as an
  administrator.
- Confirm the student sees the updated status, remarks, and history.
- Report a lost-and-found item and submit a claim from a second student account.
- Confirm a student cannot claim their own listing or claim twice.
- Approve the claim, mark the item returned, and verify the returned state.
- Confirm return is blocked without an approved claim.
- Confirm rejected listings are hidden from students.
- Verify admin analytics against MongoDB Compass.
- Check desktop and mobile layouts, loading states, empty states, errors, and
  confirmation dialogs.

## Screenshots

Screenshots are intentionally not committed as placeholder images. Capture them
locally after starting both applications, then place them in a `docs/screenshots`
folder and update the paths below.

| Screen | Suggested file |
| --- | --- |
| Public homepage | `docs/screenshots/home.png` |
| Login | `docs/screenshots/login.png` |
| Student dashboard | `docs/screenshots/student-dashboard.png` |
| Complaint list | `docs/screenshots/complaints.png` |
| Complaint details | `docs/screenshots/complaint-details.png` |
| Lost-and-found list | `docs/screenshots/lost-found.png` |
| Item details and claim | `docs/screenshots/lost-found-details.png` |
| Admin dashboard | `docs/screenshots/admin-dashboard.png` |
| Admin complaint management | `docs/screenshots/admin-complaints.png` |
| Admin lost-and-found management | `docs/screenshots/admin-lost-found.png` |
| User directory | `docs/screenshots/admin-users.png` |

Example markdown after adding the files:

```markdown
![Student dashboard](docs/screenshots/student-dashboard.png)
```

## Limitations

- JWTs expire after one hour and there is no refresh-token flow.
- Lost-and-found images are external URLs; file uploads are not supported.
- Notifications are stored in MongoDB, but there is no dedicated notification
  centre in the UI.
- There is no email verification, password reset, or account deletion flow.
- Rate limiting is not implemented.
- Deleting a user or record does not cascade-delete related notifications or
  history.
- The backend allows all origins when `CORS_ORIGIN` is unset, which is convenient
  for local development but should be restricted in production.
- There is no automated test suite committed to the repository. Integration and
  browser checks were executed locally with temporary scripts.

## Future Enhancements

- Add a notification centre and unread-count badge.
- Add image uploads with storage validation and thumbnails.
- Add refresh tokens and stronger session management.
- Add rate limiting and security headers.
- Add email verification and password reset.
- Add complaint assignment to staff accounts with a staff role.
- Add comments or two-way communication on complaints.
- Add CSV export and date-range reports for administrators.
- Add automated API and browser tests in CI.
- Add pagination and sorting to the user directory UI.
- Add dark mode and additional accessibility audits.

## Documentation

- [PROJECT_REPORT.md](PROJECT_REPORT.md): academic report with architecture,
  design, testing results, and conclusions.
- [VIVA_PREPARATION.md](VIVA_PREPARATION.md): presentation guide, 20+ questions
  and answers, and a five-demonstration plan.
