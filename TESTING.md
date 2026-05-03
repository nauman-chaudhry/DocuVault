# Testing Guide

## Running Locally (without remote backend)

### 1. Start the mock server

```bash
cd backend
npm install
node mock-server.js
```

The mock server runs on `http://localhost:5000` with 7 pre-loaded documents in various statuses and 3 test users.

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

The mock server starts with 7 documents:

| Document                 | Status                          | Notes                                       |
|--------------------------|---------------------------------|---------------------------------------------|
| Project Proposal Q1      | Pending                         | Deadline 2026-04-01                         |
| Invoice #2024-001        | Approved                        | Comment: "Looks good, approved."            |
| Budget Report 2026       | In Review by Finance Department | Multi-step history                          |
| Vendor Agreement         | Rejected                        | Comment: "Missing vendor registration documents." |
| Office Supplies Invoice  | Paid                            | HBL, TXN-98765, Rs. 15,000                 |
| Equipment Request        | Pending                         | Deadline 2026-03-28 (past — shows overdue) |
| Software License Renewal | Processing Payment              | Deadline 2026-04-15                         |
