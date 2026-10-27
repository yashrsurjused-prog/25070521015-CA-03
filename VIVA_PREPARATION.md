# Viva Preparation Guide

**Project:** Smart Campus Service Portal

**Stack:** React 19, Vite, Express 5, MongoDB, Mongoose, JWT, bcrypt

This guide explains the project in viva-ready language. Every explanation refers
to the actual implementation in this repository. Use the five demonstration
files at the end to prepare a reliable practical demo.

## How to Use This Guide

1. Read the 60-second pitch and the topic explanations.
2. Practise the 25 questions and answers without reading them.
3. Rehearse the five demonstrations in order.
4. Keep the command sheet open during the demo.
5. Be ready to explain limitations honestly. Do not claim features that are not
   implemented.

## 60-Second Pitch

The Smart Campus Service Portal is a full-stack web application that replaces
scattered campus complaint handling and lost-and-found reporting with one
role-based portal. Students register and log in, submit complaints with unique
ticket IDs, track their status history, report lost or found items, browse other
listings, and submit ownership claims. Administrators use a separate dashboard
to review live analytics, moderate complaints, approve or reject claims, and view
the user directory. The frontend is React and Vite, the backend is Express, and
data is stored in MongoDB through Mongoose. Security is enforced on the server
with JWT authentication, bcrypt password hashing, role checks, ownership checks,
input validation, and allowed status-transition rules.

## The 18 Core Viva Topics

### 1. Problem statement

Campus issues are often reported through informal channels, so students cannot
track progress and administrators cannot prioritise work. Lost-and-found reports
are also fragmented, and ownership is difficult to verify. The project solves
this by providing a single portal with persistent records, controlled workflows,
and role-based access.

### 2. Objectives

The main objectives are:

- Centralise complaint and lost-and-found reporting.
- Give students transparent status tracking.
- Enforce student and administrator permissions.
- Support a safe claim-verification process for lost-and-found items.
- Provide administrators with live statistics and moderation tools.
- Apply secure authentication, validation, and safe data exposure.
- Provide a responsive user interface.

### 3. Main features

Student features:

- Registration, login, session restoration, and logout.
- Complaint creation with a generated ticket ID.
- Complaint search, filtering, pagination, history, edit, and delete rules.
- Lost-and-found reporting with optional date and image URL.
- Listing search and filters.
- Claim submission and claim status visibility.

Administrator features:

- Live analytics from MongoDB.
- Complaint priority updates and status transitions.
- Lost-and-found moderation and claim review.
- Rejection with reasons.
- User directory with safe fields only.

### 4. Technology stack and justification

| Layer | Choice | Reason |
| --- | --- | --- |
| Frontend | React 19 and Vite | Component-based UI with fast development builds |
| Routing | React Router 7 | Client-side routing and protected routes |
| HTTP | Axios | Interceptors for tokens and consistent error handling |
| Backend | Node.js and Express 5 | Lightweight REST API using one language across the stack |
| Database | MongoDB and Mongoose | Flexible documents plus schema validation and population |
| Auth | JWT and bcryptjs | Stateless authentication with salted password hashes |
| Styling | Custom CSS | Full control over responsive layouts and design tokens |
| Linting | oxlint | Fast JavaScript and React linting |

The project deliberately stays with JavaScript/JSX and does not introduce
TypeScript, Firebase, Supabase, or an external backend.

### 5. System architecture

```text
React SPA (Vite, port 5173)
        |
        | Axios + Bearer JWT
        v
Express API (port 5000)
        |
        | Mongoose
        v
MongoDB: smartCampusDB
```

Request lifecycle:

1. A React page calls the shared Axios instance in `client/src/services/api.js`.
2. The request interceptor reads `smartcampus_token` from local storage and adds
   `Authorization: Bearer <token>`.
3. Express routes run `authenticateToken` and, where needed, `authorizeRoles`.
4. The controller validates input, applies ownership and workflow rules, and
   calls a Mongoose model.
5. The controller returns JSON.
6. The response interceptor handles `401` responses by clearing the session and
   redirecting to login when needed.
7. React updates its state and renders the result.

### 6. Frontend structure and routing

- `client/src/App.jsx` declares all routes.
- `ProtectedRoute` checks authentication and allowed roles.
- `PublicOnlyRoute` prevents logged-in users from opening login or register.
- Student routes are grouped under `allowedRoles={['student']}`.
- Admin routes are grouped under `allowedRoles={['admin']}`.
- `DashboardShell` and `AdminDashboardShell` provide the two portal layouts.
- `AuthShell` provides the login and registration layout.
- `ScrollManager` resets scroll position or scrolls to hash targets.

Main routes:

```text
/                         Public home
/login, /register         Public-only routes
/student/dashboard        Student
/complaints               Student
/complaints/new           Student
/complaints/:id           Student
/lost-found               Student
/lost-found/new           Student
/lost-found/:id           Student
/admin/dashboard          Admin
/admin/complaints         Admin
/admin/lost-found         Admin
/admin/users              Admin
*                         404 page
```

### 7. Authentication state on the frontend

- `AuthContext.jsx` stores the current user, token, and loading state.
- The token and user are persisted in local storage under
  `smartcampus_token` and `smartcampus_user`.
- On startup, the context requests `GET /api/auth/me` to verify the stored token
  and refresh the user profile.
- `useAuth()` exposes the authentication state to components.
- Logout removes both storage keys and clears the context.
- A `401` response clears the session and redirects protected pages to login.

Key files:

- `client/src/context/AuthContext.jsx`
- `client/src/context/authContextValue.js`
- `client/src/context/useAuth.js`
- `client/src/components/ProtectedRoute.jsx`
- `client/src/components/PublicOnlyRoute.jsx`

### 8. Backend structure

- `server/src/app.js` configures middleware and mounts routes.
- `server/src/server.js` loads environment variables, connects to MongoDB, and
  starts or stops the HTTP server.
- `config/db.js` owns the Mongoose connection and health status.
- `routes/` maps URLs to controllers and role middleware.
- `controllers/` contains validation and business logic.
- `models/` defines schemas, enums, indexes, and defaults.
- `middleware/authMiddleware.js` verifies JWT tokens and roles.
- `middleware/errorHandler.js` returns generic server errors.
- `middleware/notFound.js` returns a JSON 404 response.
- `scripts/createAdmin.js` creates administrators safely.

### 9. Database design

Database: `smartCampusDB`

| Collection | Purpose |
| --- | --- |
| `users` | Students and administrators |
| `complaints` | Complaint records and embedded status history |
| `lostfounditems` | Lost-and-found listings and embedded claim |
| `notifications` | Per-user event notifications |

Important relationships:

- `Complaint.createdBy` references `User`.
- `Complaint.assignedTo` optionally references `User`.
- `LostFoundItem.reportedBy` references `User`.
- `LostFoundItem.claim.requestedBy` and `claim.reviewedBy` reference `User`.
- `Notification.userId` references `User`.

Important design choices:

- The claim is embedded because one listing has at most one active claim.
- Complaint history is embedded because it belongs to exactly one complaint.
- `passwordHash` uses `select: false`.
- Enums restrict roles, statuses, priorities, and item types.
- Indexes support common filters and sorts.

### 10. Registration, login, JWT, and bcrypt

Registration:

1. The controller trims and normalises input.
2. It validates name, email, password length, department, and student ID.
3. It checks for an existing email.
4. It hashes the password with bcrypt using 10 salt rounds.
5. It creates a student account. Public registration cannot create an admin.
6. It returns a sanitised user object without the password hash.

Login:

1. The controller requires an email and password.
2. It loads the user with `select('+passwordHash')`.
3. It compares the password with bcrypt.
4. It signs a JWT containing the user ID and role with a one-hour expiry.
5. It returns the token and sanitised user.

JWT verification:

1. `authenticateToken` extracts a single Bearer token.
2. It verifies the signature and expiry with `JWT_SECRET`.
3. It checks that the payload contains a string `id` and `role`.
4. It sets `req.user` from the verified payload.
5. Invalid, malformed, or expired tokens return `401`.

Passwords are never stored or returned in plain text. Password hashes are never
returned by APIs.

### 11. Authorization and ownership

There are two roles: `student` and `admin`.

- `authorizeRoles(...roles)` returns `403` when the authenticated role is not
  allowed.
- Students can list and view only their own complaints.
- Students can edit or delete only their own `pending` complaints.
- Students can edit or delete only their own `open` lost-and-found listings.
- Students cannot claim their own listing.
- Students cannot see rejected listings.
- Claim details are visible only to the claimant, the reporter, and admins.
- Moderation metadata is visible only to admins.
- Admin routes and `/api/admin/*` require the admin role.

Ownership is derived from `req.user.id`, which comes from the verified token,
never from a request body.

### 12. Complaint workflow

Statuses: `pending`, `under_review`, `in_progress`, `resolved`, `rejected`.

Allowed transitions:

| Current | Allowed next |
| --- | --- |
| `pending` | `under_review`, `in_progress`, `rejected` |
| `under_review` | `in_progress`, `rejected` |
| `in_progress` | `resolved`, `rejected` |
| `resolved` | None |
| `rejected` | None |

Rules:

- New complaints start as `pending` with `medium` priority.
- Ticket IDs use `CMP-YYYYMMDD-XXXXXXXX`.
- Students can edit or delete only while pending.
- Admins can update details on any complaint.
- Admins cannot skip invalid transitions.
- Rejection requires remarks.
- Every status change adds a history entry with previous status, new status,
  actor, remark, and timestamp.
- Every status change creates a notification for the student.

### 13. Lost-and-found and claim workflow

Statuses: `open`, `claimed`, `returned`, `rejected`.

Allowed transitions:

| Current | Allowed next | Meaning |
| --- | --- | --- |
| `open` | `claimed`, `rejected` | Approve a pending claim or reject the listing |
| `claimed` | `open`, `returned`, `rejected` | Reject the claim and reopen, mark returned, or reject |
| `returned` | None | Terminal |
| `rejected` | None | Terminal |

Claim rules:

- A claim is allowed only on another student's `open` listing.
- A claim stores the claimant, message, request time, status, reviewer, review
  time, and review note.
- Submitting a claim does not change the listing from `open`.
- Approving a claim requires a pending claim.
- Marking an item `returned` requires an approved claim.
- Moving `claimed` back to `open` rejects the claim and allows another claim.
- Sending `{"status": "open"}` for an open listing with a pending claim rejects
  the claim while keeping the listing open.
- Rejecting a listing requires a reason and hides it from students.

### 14. Administrator analytics

`GET /api/admin/analytics` returns live data from MongoDB:

- Complaint totals and counts by status.
- Complaint counts by category.
- `inProgress` combines `under_review` and `in_progress`.
- Lost-and-found totals by status and type.
- The five most recent complaints and listings.
- Average resolution hours for resolved complaints using valid timestamps.
- `null` when no valid resolved complaint exists.

The dashboard displays real counts only. There are no hardcoded statistics.

### 15. Validation and error handling

Validation is performed in controllers before database writes. It covers:

- Required text fields.
- String types.
- Maximum lengths.
- Allowed enum values.
- Positive integers for pagination.
- Maximum page limits.
- Valid date filters and event dates.
- Valid `http://` or `https://` image URLs.
- Protected fields that clients must not update.
- Allowed status transitions and claim prerequisites.

Error responses use consistent status codes:

- `400` validation, invalid ID, or invalid transition.
- `401` authentication failure.
- `403` role or ownership failure.
- `404` missing resource.
- `409` duplicate email, existing claim, or non-editable state.
- `500` generic server error without internal details.

Validation responses use an `errors` array. The frontend preserves those specific
messages through `getApiErrorMessage`, which prefers `errors[0]` over the generic
`message` field.

### 16. User interface, responsiveness, and accessibility

- Shared components keep forms and feedback consistent.
- `InputField` connects labels, hints, errors, and `aria-describedby`.
- Selects and textareas have programmatic accessible names.
- `ConfirmDialog` supports Escape, focus trapping, focus restoration, and
  `aria-labelledby` / `aria-describedby`.
- Loading skeletons, empty states, error alerts, and success alerts are used.
- `SafeImage` replaces broken images with a visible fallback.
- Responsive breakpoints adapt navigation, dashboard grids, cards, tables, and
  forms for mobile screens.
- A reduced-motion media query disables animations for users who prefer it.
- Status badges provide text labels, not colour-only meaning.

### 17. Testing and verification evidence

Actual verification results:

| Check | Result |
| --- | --- |
| Backend integration tests | 88 passed, 0 failed |
| Browser end-to-end tests | 25 passed, 0 failed |
| Post-refactor browser smoke tests | 10 passed, 0 failed |
| Final API role and workflow checks | 58 passed, 0 failed |
| Production build | Passed, 118 modules transformed |
| Lint | Passed with 9 non-blocking advisories |
| Health endpoint | 200, database connected |
| Database cleanup | 2 legitimate users and no test records |

The lint warnings are `react(set-state-in-effect)` advisories for the standard
fetch-on-mount pattern. They are reported honestly and were not suppressed.

Temporary test scripts were removed from the repository. The production build
and lint command are available:

```bash
cd client
npm run lint
npm run build
```

### 18. Limitations and future scope

Current limitations:

- One-hour JWT expiry with no refresh token.
- No file upload; images are external URLs.
- No notification centre UI.
- No email verification or password reset.
- No rate limiting.
- No cascading deletion of notifications or history.
- CORS is open when `CORS_ORIGIN` is unset.
- Automated tests are not committed.

Future improvements:

- Notification centre with unread badge.
- Image uploads with storage validation.
- Refresh tokens and session hardening.
- Rate limiting and security headers.
- Email verification and password reset.
- Staff role and complaint assignment workflow.
- Two-way comments on complaints.
- CSV exports and date-range reports.
- Committed automated tests and CI.
- Dark mode and further accessibility testing.

## 25 Viva Questions and Answers

### 1. What problem does your project solve?

It replaces fragmented complaint and lost-and-found handling with one role-based
portal that stores every request, tracks progress, enforces ownership rules, and
gives administrators live moderation and analytics tools.

### 2. Why did you choose the MERN-style stack?

React provides a component-based interface, Express provides a lightweight REST
API, and MongoDB stores flexible documents with embedded history and claims.
Using JavaScript across the stack keeps the project consistent.

### 3. Why is the frontend separate from the backend?

Separation of concerns. The React application handles presentation and routing,
while the Express API owns authentication, business rules, and database access.
The two communicate only through REST endpoints.

### 4. What happens when a user logs in?

The API verifies the email and password with bcrypt, signs a JWT containing the
user ID and role with a one-hour expiry, and returns the token plus a sanitised
user object. The frontend stores them and uses the token on later requests.

### 5. Why use JWT instead of server sessions?

JWT keeps the API stateless: the server verifies the signed token on each request
without storing session state. This suits a separate SPA and API.

### 6. Where is the user's role stored, and can a student fake an admin role?

The role is inside the signed JWT and is also stored in MongoDB. A client cannot
forge a valid token without `JWT_SECRET`, and the server never trusts a role sent
in a request body. Role checks use the verified token payload.

### 7. How are passwords protected?

Passwords are hashed with bcrypt using 10 salt rounds. Only `passwordHash` is
stored, it uses `select: false`, and API responses never include it.

### 8. Why does the login error say "Invalid email or password" instead of saying
which one is wrong?

It prevents account enumeration. An attacker should not learn whether an email
exists by reading different error messages.

### 9. How do you prevent a student from editing another student's complaint?

The controller compares the complaint's `createdBy` with `req.user.id`, which
comes from the verified token. A mismatch returns `403`. It also requires the
complaint to be `pending` for student edits.

### 10. How do you prevent a student from deleting a non-pending complaint?

The delete controller checks ownership and status. A student receives `403` for
another user's complaint and `409` when the complaint is not pending.

### 11. How is a complaint ticket ID generated?

The server generates `CMP-YYYYMMDD-XXXXXXXX` using the current date and random
bytes. The ticket ID is unique, and creation retries if a duplicate-key error
occurs.

### 12. Why can't an administrator skip from pending to resolved?

The backend defines an allowed-transition map. Skipping states would hide the
review and work-progress stages. Invalid transitions return `400`.

### 13. Why is complaint history embedded instead of a separate collection?

History belongs to exactly one complaint and is always read with it. Embedding
keeps reads simple and preserves the sequence of status changes.

### 14. Why is the claim embedded in the lost-and-found item?

One listing has at most one active claim, and the claim is always displayed with
its listing. Embedding avoids an unnecessary join for this project's scale.

### 15. Why does submitting a claim not change the listing to claimed?

A claim is only a request. The listing stays `open` until an administrator
verifies ownership. This prevents an unverified student from blocking an item.

### 16. How is the "returned" state protected?

The backend requires the embedded claim status to be `approved` before allowing
`returned`. The frontend also disables or rejects invalid choices, but the
server is the authority.

### 17. How can an administrator reject a pending claim without rejecting the
listing?

They send `PATCH /api/lost-found/:id/status` with `{"status": "open"}`. The
controller rejects the pending claim and keeps the listing open for other
students.

### 18. How are rejected lost-and-found listings hidden from students?

The list and detail queries add a non-admin filter that excludes `rejected`
items. Students receive `403` if they try to open one directly.

### 19. Where do admin analytics come from?

They come from MongoDB aggregation and count queries in
`admin.controller.js`. There are no hardcoded numbers. The dashboard displays the
real response.

### 20. How is average resolution time calculated?

The controller selects resolved complaints with valid `createdAt` and `updatedAt`
timestamps, calculates the duration in hours, ignores invalid ranges, and
returns the average rounded to two decimals. It returns `null` when no valid
records exist.

### 21. What is the purpose of the Axios interceptors?

The request interceptor attaches the stored JWT. The response interceptor clears
the stored session and redirects protected pages to login after a `401`.

### 22. How are validation errors shown to the user?

The backend returns a `message` and an `errors` array. The frontend helper
`getApiErrorMessage` prefers the first specific validation error so the user sees
a useful message instead of only "Validation failed".

### 23. What did you do for accessibility and responsive design?

Forms have connected labels and error descriptions, dialogs support Escape and
focus management, status badges include text, images have a fallback, and CSS
breakpoints adapt navigation, grids, tables, and forms to small screens.

### 24. What testing did you perform?

A backend integration suite passed 88 tests, a browser end-to-end suite passed 25
tests, a post-refactor smoke suite passed 10 tests, and a final API role and
workflow check passed 58 checks. The production build also
passed. Lint completes with nine non-blocking advisories. Test data was removed
after verification.

### 25. What are the main limitations, and what would you improve next?

The main limitations are no refresh token, no image uploads, no notification
centre, no rate limiting, and no committed automated tests. The next improvements
would be a notification centre, uploads, refresh tokens, rate limiting, stronger
deployment security, and a CI test suite.

## Common Trap Questions

### Is MongoDB schema-less? Why use Mongoose?

MongoDB is flexible at the database level, but this project uses Mongoose schemas
to enforce required fields, enums, lengths, defaults, and indexes. Validation is
also performed in controllers so users get clear error messages.

### Is the frontend secure by itself?

No. The frontend improves the user experience, but all important rules are
enforced by the backend. A user could bypass the UI, so role, ownership, and
status rules must exist in the API.

### Why not store the JWT in a cookie?

The project uses a Bearer token in local storage because it is a learning project
with a separate SPA and API. A production system should consider HttpOnly,
Secure, SameSite cookies or another hardened token strategy.

### Why are there no tests in the repository?

The suites were executed locally against MongoDB and cleaned up, but the test
scripts were not committed. This is a limitation. A future version should commit
repeatable API and browser tests and run them in CI.

### Why does lint report warnings if it passes?

The linter exits successfully because the warnings are non-blocking advisories.
They relate to the standard fetch-on-mount pattern. They were reported rather
than suppressed, and the runtime flows were verified in the browser.

### Why not implement file uploads?

Supporting uploads requires storage, file-type validation, size limits, and
cleanup. The project uses validated external image URLs to stay within scope.

## Five Demonstration Files

Prepare these five demonstrations. Each one exercises a different part of the
system and can be shown independently.

### Demonstration 1: Student registration and complaint submission

**Goal:** Show authentication, ticket generation, and student ownership.

**Files involved:**

- `client/src/pages/Register.jsx`
- `client/src/pages/CreateComplaint.jsx`
- `server/src/controllers/auth.controller.js`
- `server/src/controllers/complaint.controller.js`
- `server/src/models/Complaint.js`

**Steps:**

1. Open `/register` and create a student account.
2. Show the automatic redirect or login.
3. Open `/complaints/new`.
4. Submit a complaint with a clear title, description, category, and location.
5. Point out the generated `CMP-YYYYMMDD-XXXXXXXX` ticket ID.
6. Open `/complaints` and show the new complaint with status `pending`.
7. Open the details page and show the initial history entry.

**What to say:**

- Registration always creates a student.
- The password is hashed with bcrypt.
- The ticket ID is generated on the server.
- Ownership and initial status are set from the verified session, not the form.

**Cleanup:** Delete the demonstration complaint and student after the viva if
required.

### Demonstration 2: Administrator complaint moderation

**Goal:** Show role-based access, priority updates, status transitions, history,
and notifications.

**Files involved:**

- `client/src/pages/AdminComplaints.jsx`
- `server/src/controllers/complaint.controller.js`
- `server/src/middleware/authMiddleware.js`
- `server/src/models/Notification.js`

**Steps:**

1. Log in as an administrator.
2. Open `/admin/complaints`.
3. Search for the ticket created in Demonstration 1.
4. Open the complaint.
5. Change priority to `high`.
6. Change status from `pending` to `under_review`, then to `in_progress`.
7. Show the confirmation dialog and the history timeline.
8. Log back in as the student and show the updated status.

**What to say:**

- Only admins can change status.
- The backend validates every transition.
- Each transition stores a history entry and creates a notification.
- The UI only offers allowed next statuses, but the server enforces them too.

### Demonstration 3: Lost-and-found reporting and claim submission

**Goal:** Show two-student interaction and claim protection.

**Files involved:**

- `client/src/pages/CreateLostFoundItem.jsx`
- `client/src/pages/LostFound.jsx`
- `client/src/pages/LostFoundDetails.jsx`
- `server/src/controllers/lostFound.controller.js`

**Steps:**

1. Log in as Student A and report a found item at `/lost-found/new`.
2. Log out and log in as Student B.
3. Open `/lost-found` and find the item.
4. Open the details page and submit a claim with a message.
5. Show that the listing remains `open` with a `pending` claim.
6. Attempt to claim it again and show the conflict message.
7. Optionally log back in as Student A and show that the reporter cannot claim
   their own listing.

**What to say:**

- A claim is a request, not an approval.
- A user cannot claim their own listing.
- A listing can have only one active claim.
- The claimant, reporter, and administrator have different visibility rules.

### Demonstration 4: Administrator claim approval and return

**Goal:** Show moderation, approved claim rules, and terminal states.

**Files involved:**

- `client/src/pages/AdminLostFound.jsx`
- `server/src/controllers/lostFound.controller.js`

**Steps:**

1. Log in as the administrator and open `/admin/lost-found`.
2. Open the item from Demonstration 3.
3. Select `claimed` and add a review note.
4. Confirm the moderation and show that the claim is approved.
5. Select `returned` and confirm.
6. Show that no further status changes are offered.
7. Optionally show the student's view of the final status.

**What to say:**

- `claimed` requires a pending claim.
- `returned` requires an approved claim.
- Terminal states cannot be changed.
- The UI filters allowed transitions, and the backend validates them.

### Demonstration 5: Security and role enforcement

**Goal:** Show that client-side changes cannot bypass backend rules.

**Files involved:**

- `server/src/middleware/authMiddleware.js`
- `server/src/controllers/complaint.controller.js`
- `server/src/controllers/lostFound.controller.js`
- `client/src/components/ProtectedRoute.jsx`
- `client/src/services/api.js`

**Steps:**

1. As a student, try to open `/admin/dashboard`; show the redirect.
2. Show that a student token receives `403` from `/api/admin/analytics`.
3. Try to edit another student's complaint or listing and show `403`.
4. Try to delete a non-pending complaint and show `409`.
5. Try a forbidden status transition through an API client and show `400`.
6. Show that password hashes never appear in login, profile, or user directory
   responses.
7. Optionally wait for token expiry or use an invalid token to show `401`.

**What to say:**

- Frontend route guards improve the experience, but API middleware and
  controller rules are the real security boundary.
- The server derives identity from the token, validates roles, checks ownership,
  and enforces workflow rules.

## Command Sheet

### Start the project

```bash
# Terminal 1
cd server
npm run dev

# Terminal 2
cd client
npm run dev
```

### Health check

```bash
curl http://localhost:5000/api/health
```

### Create an administrator

```powershell
cd server
$env:ADMIN_NAME = "Campus Administrator"
$env:ADMIN_EMAIL = "admin@yourcollege.edu"
$securePassword = Read-Host "Admin password" -AsSecureString
$env:ADMIN_PASSWORD = [System.Net.NetworkCredential]::new("", $securePassword).Password
npm run create-admin
Remove-Item Env:ADMIN_NAME, Env:ADMIN_EMAIL, Env:ADMIN_PASSWORD
```

### Verify the build and lint

```bash
cd client
npm run lint
npm run build
```

### Inspect the database

Connect MongoDB Compass to:

```text
mongodb://127.0.0.1:27017/smartCampusDB
```

Collections to show:

- `users`
- `complaints`
- `lostfounditems`
- `notifications`

## Demo Do's and Don'ts

Do:

- Start MongoDB before the backend.
- Use two browser profiles or one normal and one private window for two students.
- Prepare one student account and one administrator account in advance.
- Keep the API error messages visible when demonstrating security rules.
- Explain that temporary test data is removed after verification.
- Mention limitations honestly.

Do not:

- Claim that email notifications are sent; notifications are stored in MongoDB.
- Claim that file uploads exist; the project uses image URLs.
- Claim that automated tests are committed; they were run locally and removed.
- Claim that rate limiting exists; it does not.
- Say that the frontend enforces security by itself.
- Reveal `JWT_SECRET` or a real administrator password.

## Final Revision Checklist

- Can you explain the problem in one minute?
- Can you draw the three-tier architecture?
- Can you name all four collections and their relationships?
- Can you explain registration, login, JWT verification, and bcrypt?
- Can you list both status-transition tables from memory?
- Can you explain why a claim does not immediately change the listing status?
- Can you explain how ownership is enforced?
- Can you explain where analytics come from?
- Can you state the actual test results and the lint caveat?
- Can you demonstrate all five flows without reading this document?

If all ten answers are ready, the viva preparation is complete.
