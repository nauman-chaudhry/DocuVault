# Part 2 — Feature Pages, Document Workflow, Notifications & Mock Server

## Files in this part

```
backend/
└── mock-server.js        — Local in-memory server: same JWT middleware & role guards
                            as index.js, no MongoDB needed, pre-loaded with 7 sample docs

frontend/src/
├── config/api.js                    — Centralized API base URL (shared with Part 1)
├── layout/Dashboard/Header/HeaderContent/
│   └── Notification.jsx             — Header bell: live unread count from document history
└── pages/
    ├── Upload-document/document-upload.jsx    — Submitter name, approval deadline field,
    │                                            authenticated file upload via fetchWithAuth
    ├── Document-review/document-review.jsx    — Two-panel review UI, approve/reject with
    │                                            reviewer comments saved to status history
    ├── document-tracking/document-tracking.jsx — Full timeline view, deadline warnings,
    │                                             overdue alerts, comments inline in history
    ├── audit-interface/audit-interface.jsx    — Finance workflow (Approved → In Review →
    │                                            Processing Payment → Paid), status filter
    ├── All-notifications/all-notifications.jsx — Full notification log: search + type filter
    └── Add-user/add-user.jsx                  — User management: add/delete users with roles

TESTING.md                — Running guide: how to start mock server + frontend, test
                            accounts for all three roles, per-role test steps, mock data table
```

## What this part covers

### 1. Mock Server (`backend/mock-server.js`)

Express server with in-memory data — runs without MongoDB for local development and testing.

**Same security as `index.js`** (Part 1):
- `verifyToken` middleware validates JWT on all write routes.
- `requireRole()` guards user management (HOD only) and payment routes (Audit Department or HOD).
- CORS restricted to `http://localhost:3000`.

**Pre-loaded sample data** — 7 documents covering every status in the workflow:

| Document | Status | Notes |
|---|---|---|
| Project Proposal Q1 | Pending | Has deadline 2026-04-01 |
| Invoice #2024-001 | Approved | Comment: "Looks good, approved." |
| Budget Report 2026 | In Review by Finance Dept | Multi-step history |
| Vendor Agreement | Rejected | Comment: "Missing vendor registration documents." |
| Office Supplies Invoice | Paid | Full payment details (HBL, TXN-98765) |
| Equipment Request | Pending | Has deadline 2026-03-28 (past — shows overdue) |
| Software License Renewal | Processing Payment | Deadline 2026-04-15 |

**Test accounts**:
```
HOD:              admin@test.com    / admin123
Employee:         employee@test.com / emp123
Audit Department: audit@test.com   / audit123
```

**How to run**:
```bash
cd backend && node mock-server.js    # port 5000
cd frontend && npm run start         # port 3000
```

---

### 2. Document Upload (`pages/Upload-document/document-upload.jsx`)

Form fields: Document Name, Description, Submission Date, **Approval Deadline** (new — optional date picker), Category (Quote / CS / Invoice), Attach File, Extra Notes.

**New in this version**:
- `submittedBy` — automatically set from the logged-in user's name (`user.name` from AuthContext), sent as a form field so the backend records who uploaded each document.
- `deadline` — optional approval deadline date sent to backend and stored in the document.
- File upload uses `fetchWithAuth()` to include the JWT in the multipart POST request.
- On success, all fields reset and a success snackbar appears.

---

### 3. Document Review (`pages/Document-review/document-review.jsx`)

Two-panel layout — document list on the left, review panel on the right.

**Left panel** — fetches pending documents from `GET /docu/status/pending` (authenticated). Each card shows name, category, date, and a Pending chip. Clicking selects it for review.

**Right panel** — shows full document details:
- Name, description, category, submission date.
- **Submitted By** (new) — shows who uploaded the document.
- **Approval Deadline** (new) — shows deadline in red if it has already passed.
- View Attachment button (opens file in new tab).
- **Review Comments / Feedback** — free-text field for the HOD to leave a note.
- Approve / Reject action buttons (disabled if document is not Pending).

**Approve flow**: calls `PUT /docu/:id` with `{ status: 'Approved', comment }` via `fetchWithAuth`. The comment is saved into `statusHistory` on the backend.

**Reject flow**: opens a dialog requiring a rejection reason. Calls `PUT /docu/:id` with `{ status: 'Rejected', comment: rejectReason }`. The reason is stored in status history and shown in Document Tracking.

After either action the document is removed from the left-panel list without a page reload.

---

### 4. Document Tracking (`pages/document-tracking/document-tracking.jsx`)

Full timeline view of every document across all statuses.

**Search & Filter bar** — search by name or description; filter by status dropdown (All / Pending / Approved / Rejected / In Review / Processing Payment / Paid).

**Overdue alert banner** — shown at the top if any documents have been pending >7 days or have a past deadline.

**Document cards** — each card shows:
- Document name, description, category, submission date.
- **Submitted By** (new) — who uploaded it.
- **Deadline** (new) — with clock icon; displayed in red if the deadline has passed.
- Current status chip (colour-coded).
- Overdue chip with warning icon when applicable.
- Expand/collapse button.

**Expanded timeline** — clicking expand reveals the full `statusHistory` as a vertical timeline:
- Each entry shows status, formatted timestamp, and relative time ("2 days ago").
- **Reviewer comments** (new) — displayed in italic below the timestamp when a comment was left during approval or rejection.

**Payment details** — if the document is Paid, a second section shows amount (Rs.), bank name, transaction ID, and payment date.

---

### 5. Audit & Finance Interface (`pages/audit-interface/audit-interface.jsx`)

Purpose-built for the Audit Department role. Shows only documents relevant to the finance workflow.

**Filtered view** — loads only documents with status `Approved`, `In Review by Finance Department`, or `Processing Payment`. Pending and Rejected documents (which belong to the HOD review stage) are intentionally excluded.

**Status filter dropdown** — shows counts per status so the finance user can quickly see the queue.

**Context-aware action buttons** — each card shows only the button appropriate to its current status:

| Document Status | Button Shown |
|---|---|
| Approved | **Start Review** → moves to "In Review by Finance Department" |
| In Review by Finance Department | **Process Payment** → opens payment dialog |
| Processing Payment | **Mark as Paid** → finalises with `PUT /docu/:id` |

All actions use `fetchWithAuth()` to include the JWT. The `PUT /docu/:id/payment` route additionally checks `requireRole('Audit Department', 'HOD')` on the backend.

**Status history display** — shows all history entries with timestamps and any reviewer comments left during the HOD approval stage.

**After payment**: the document disappears from the list (removed from local state). The global notification system will reflect the Paid event.

---

### 6. Notification System

#### Header Bell (`layout/Dashboard/Header/HeaderContent/Notification.jsx`)

- Fetches all documents on load and flattens their `statusHistory` arrays into a sorted notification feed.
- Shows the 5 most recent events with document name, status label, and relative timestamp.
- Badge shows the count of "unread" (most recent 3 by default). Clicking "Mark all as read" clears the badge.
- "View All" button navigates to the full notifications page.
- Each notification has a colour-coded avatar icon matching the status.

#### Full Notifications Page (`pages/All-notifications/all-notifications.jsx`)

- Loads all documents, extracts every `statusHistory` entry, and renders a chronological list.
- Each item shows a human-readable message ("Document X has been approved."), relative + absolute timestamp, and a status chip.
- **Search** — filter by keyword in the notification message.
- **Type filter** — dropdown to filter by event type (Submitted, Approved, Rejected, Review, Payment).

Status → message mapping:

| Status | Message |
|---|---|
| Pending | `Document "X" has been submitted for approval.` |
| Approved | `Document "X" has been approved.` |
| Rejected | `Document "X" has been rejected.` |
| In Review by Finance Department | `Document "X" is under review by the Finance Department.` |
| Paid | `Payment processed for document "X".` |

---

### 7. User Management (`pages/Add-user/add-user.jsx`)

HOD-only page (menu item has `roles: ['HOD']`; backend `GET/POST/DELETE /users` require `requireRole('HOD')`).

**Users table** — lists all users (name, email, role). Password column is never shown — the backend's `select: false` on the password field means it is excluded from every query response.

**Add User popover** — fields: Name, Email (validated format), Password, Role (Employee / HOD / Audit Department). On submit calls `POST /users`. The backend hashes the password with `bcrypt.hash(password, 10)` before saving.

**Delete** — confirmation popover before calling `DELETE /users/:id`. Uses the axios instance (auto-includes Authorization header set by AuthContext).

---

## API Authorization Summary

All state-changing endpoints require a valid JWT (`Authorization: Bearer <token>`). The frontend sends this automatically:

- **axios calls** (dashboard, notifications, user management) — header set globally via `axios.defaults.headers.common['Authorization']` in AuthContext.
- **fetch() calls** (upload, review, audit) — wrapped with `fetchWithAuth()` helper exported from AuthContext.

Attempting any write without a token returns `401 Access denied`. Attempting a role-restricted action with the wrong role returns `403 Requires: HOD`.

---

## Testing Guide (`TESTING.md`)

Step-by-step instructions for running and manually testing the full application without a remote MongoDB connection.

**Starting the stack**:
```bash
cd backend && node mock-server.js   # port 5000 — in-memory data, no MongoDB needed
cd frontend && npm run start        # port 3000
```

**API base URL** is set in `frontend/src/config/api.js` — change the exported constant to switch between local mock (`http://localhost:5000`) and a deployed backend.

**Test accounts**:

| Role             | Email              | Password |
|------------------|--------------------|----------|
| HOD              | admin@test.com     | admin123 |
| Employee         | employee@test.com  | emp123   |
| Audit Department | audit@test.com     | audit123 |

**Per-role test steps**:

- **HOD** — dashboard stats, upload document, approve/reject in Document Review with comments, track all documents, view notifications, manage users (add/delete).
- **Employee** — dashboard, upload document, track own documents, view notifications. Document Review and Manage Users are hidden from the sidebar.
- **Audit Department** — dashboard, Audit & Finance interface (Start Review → Process Payment → Mark as Paid), track documents with payment details, view notifications.

**Pre-loaded mock documents** (7 total, covering every workflow state):

| Document                  | Status                          | Notes                        |
|---------------------------|---------------------------------|------------------------------|
| Project Proposal Q1       | Pending                         | Deadline 2026-04-01          |
| Invoice #2024-001         | Approved                        | Comment: "Looks good, approved." |
| Budget Report 2026        | In Review by Finance Department | Multi-step history           |
| Vendor Agreement          | Rejected                        | Comment: "Missing vendor registration documents." |
| Office Supplies Invoice   | Paid                            | HBL, TXN-98765, Rs. 15,000  |
| Equipment Request         | Pending                         | Deadline 2026-03-28 (past — shows overdue) |
| Software License Renewal  | Processing Payment              | Deadline 2026-04-15          |
