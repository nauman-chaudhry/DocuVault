# Part 1 — Auth System, Routing, Dashboard & Core Infrastructure

## Files in this part

```
frontend/src/
├── App.jsx                          — Wrapped app with AuthProvider
├── config/api.js                    — Centralized API base URL config
├── contexts/AuthContext.jsx         — Auth context (login, logout, JWT decode, localStorage)
├── routes/
│   ├── MainRoutes.jsx               — Added document-tracking route
│   └── index.jsx                    — Router setup (unchanged)
├── layout/Dashboard/
│   ├── index.jsx                    — Added auth guard (redirect to /login if not logged in)
│   ├── Drawer/DrawerContent/Navigation/index.jsx — Role-based menu filtering
│   └── Header/HeaderContent/Profile/index.jsx    — Real user name/role, working logout
├── menu-items/
│   ├── index.jsx                    — Menu items config
│   └── utilities.jsx                — Added roles, tracking & notification menu items, fixed typo
├── pages/
│   ├── authentication/auth-forms/AuthLogin.jsx — Uses AuthContext instead of raw axios
│   └── dashboard/
│       ├── index.jsx                — Enhanced: 6 stat cards, activity log, welcome message
│       └── OrdersTable.jsx          — Updated to use API_BASE_URL
```

## What this part covers

1. **Authentication & Authorization** — JWT-based login, auth context, protected routes
2. **Role-Based Access Control** — Menu items filtered by user role (Employee, HOD, Audit Department)
3. **Enhanced Dashboard** — 6 status cards, activity log from document history
4. **API URL centralization** — All API calls use `config/api.js`

## How to merge

Copy all files into the main `frontend/src/` directory, preserving folder structure. These files either replace existing ones or are new additions.

# Part 2 — Feature Pages, Notifications & Mock Server

## Files in this part

```
frontend/src/
├── config/api.js                    — Centralized API base URL (shared with Part 1)
├── layout/Dashboard/Header/HeaderContent/
│   └── Notification.jsx             — Dynamic notifications from API (replaces static data)
├── pages/
│   ├── Document-review/document-review.jsx   — Two-panel layout, comments/feedback, card-based selection
│   ├── document-tracking/document-tracking.jsx — NEW: timeline tracking, overdue alerts, status filter
│   ├── All-notifications/all-notifications.jsx — Dynamic notifications from document status history
│   ├── Upload-document/document-upload.jsx     — Updated to use API_BASE_URL
│   ├── audit-interface/audit-interface.jsx     — Updated to use API_BASE_URL
│   └── Add-user/add-user.jsx                  — Updated to use API_BASE_URL

backend/
└── mock-server.js                   — Local mock server with test data (no MongoDB needed)

TESTING.md                           — Testing guide with accounts and per-role instructions
```

## What this part covers

1. **Document Review** — Redesigned with two-panel layout, review comments/feedback field
2. **Document Tracking (new page)** — Full timeline view, overdue alerts, search & status filter, payment details
3. **Notification System** — Dynamic notifications derived from document status changes (header + full page)
4. **Mock Server** — Express server with in-memory data for local testing without MongoDB
5. **API URL migration** — All pages updated to use centralized `config/api.js`


# Testing Guide

## Running Locally (without remote backend)

### 1. Start the mock server

```bash
cd backend
npm install
node mock-server.js
```

The mock server runs on `http://localhost:5000` with 6 pre-loaded documents in various statuses and 3 test users.

### 2. Start the frontend

```bash
cd frontend
npm install --legacy-peer-deps
npm run start
```

Opens at `http://localhost:3000`.

### 3. API URL config

The frontend API base URL is configured in `frontend/src/config/api.js`.

- Local mock: `http://localhost:5000` (default)
- Remote: `https://dmsdemo-wt6x.onrender.com`

## Test Accounts

| Role              | Email              | Password   |
|-------------------|--------------------|------------|
| HOD               | admin@test.com     | admin123   |
| Employee          | employee@test.com  | emp123     |
| Audit Department  | audit@test.com     | audit123   |

## What to Test Per Role

### HOD (full access)
- **Dashboard** — View document stats and activity log
- **Upload Document** — Submit a new document
- **Document Review** — Approve or reject pending documents with comments
- **Document Tracking** — View all documents with timeline, filter by status, check overdue alerts
- **Notifications** — View dynamic notifications derived from document status changes
- **Manage Users** — Add and delete users

### Employee
- **Dashboard** — View document stats and activity log
- **Upload Document** — Submit a new document
- **Document Tracking** — Track submitted documents and their approval progress
- **Notifications** — View notifications

### Audit Department
- **Dashboard** — View document stats and activity log
- **Audit & Finance** — Update document status to "In Review by Finance Department", process payments, mark as paid
- **Document Tracking** — View all documents with timeline and payment details
- **Notifications** — View notifications

## Mock Data

The mock server starts with 6 documents:

| Document               | Status                          |
|------------------------|---------------------------------|
| Project Proposal Q1    | Pending                         |
| Invoice #2024-001      | Approved                        |
| Budget Report 2026     | In Review by Finance Department |
| Vendor Agreement       | Rejected                        |
| Office Supplies Invoice| Paid (with payment details)     |
| Equipment Request      | Pending                         |
