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

