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
