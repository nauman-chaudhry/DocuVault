# Part 1 — Auth, JWT Security, Routing & Dashboard

## Files in this part

```
backend/
├── index.js          — Full Express/MongoDB server: JWT middleware, role guards,
│                       CORS fix, env config, schema improvements, all CRUD routes
└── .env              — Environment variable definitions (JWT_SECRET, MONGODB_URI, etc.)

frontend/src/
├── App.jsx                          — Wrapped with AuthProvider
├── config/api.js                    — Centralized API base URL (shared with Part 2)
├── contexts/AuthContext.jsx         — Auth context: POST /login, JWT storage,
│                                      axios Authorization header, fetchWithAuth helper
├── routes/
│   ├── index.jsx                    — Router root: combines MainRoutes + LoginRoutes
│   ├── MainRoutes.jsx               — All protected routes including document-tracking
│   └── LoginRoutes.jsx              — Public /login route
├── layout/Dashboard/
│   ├── index.jsx                    — Auth guard (redirects to /login if not authenticated)
│   ├── Drawer/DrawerContent/Navigation/index.jsx  — Role-based menu filtering
│   └── Header/HeaderContent/Profile/index.jsx     — Real user name/role, working logout
├── menu-items/
│   ├── index.jsx                    — Menu config root: exports combined items array
│   ├── dashboard.jsx                — Dashboard nav item (Navigation group)
│   └── utilities.jsx                — Document Management group with per-item role arrays
└── pages/
    ├── authentication/auth-forms/AuthLogin.jsx    — Formik login form using AuthContext
    └── dashboard/
        ├── index.jsx                — 6 stat cards, activity log, welcome message
        └── OrdersTable.jsx          — Recent documents table with all status colours
```

## What this part covers

### 1. Backend — Express Server (`backend/index.js`)

Complete Express server connecting to MongoDB Atlas.

**Environment config** (Lecture 14 — Node.js):
All sensitive values read via `process.env` with safe fallbacks. A `.env` file documents the expected keys. In production: install `dotenv` and call `require('dotenv').config()` at the top.

```
JWT_SECRET     = dms-jwt-secret-key-2026
MONGODB_URI    = mongodb+srv://...
PORT           = 5000
CLIENT_ORIGIN  = http://localhost:3000
```

**CORS** (Lecture 25):
Replaced the permissive `cors()` (allows `*`) with:
```js
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
```
Only the frontend origin (`http://localhost:3000`) is permitted.

**Mongoose Schemas** (Lecture 17 — MongoDB):

`docuSchema` — name, description, date, category (`enum`), extranotes, attachment, `submittedBy`, `deadline`, status (`enum`), `statusHistory[]` (status + timestamp + comment), paymentDetails. Option `{ timestamps: true }` adds `createdAt`/`updatedAt` automatically.

`userSchema` — name, email (unique), role (`enum`), password with `select: false` so the hashed password is never returned in queries unless explicitly requested with `.select('+password')`. Also uses `{ timestamps: true }`.

**JWT Middleware** (Lecture 16 — Authentication vs Authorisation):
```js
function verifyToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1]; // "Bearer <token>"
    if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });
    try { req.user = jwt.verify(token, JWT_SECRET); next(); }
    catch { return res.status(403).json({ message: 'Invalid or expired token.' }); }
}

function requireRole(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.role))
            return res.status(403).json({ message: `Requires: ${roles.join(', ')}` });
        next();
    };
}
```

**Protected Routes**:
| Route | Middleware |
|---|---|
| `POST /docu` | `verifyToken` |
| `PUT /docu/:id` | `verifyToken` |
| `PUT /docu/:id/payment` | `verifyToken`, `requireRole('Audit Department', 'HOD')` |
| `DELETE /docu/:id` | `verifyToken`, `requireRole('HOD')` |
| `GET /users` | `verifyToken`, `requireRole('HOD')` |
| `POST /users` | `verifyToken`, `requireRole('HOD')` |
| `DELETE /users/:id` | `verifyToken`, `requireRole('HOD')` |

Public (no token needed): `POST /login`, `GET /docu`, `GET /docu/status/pending`, `GET /docu/:id`.

**Login** (`POST /login`):
- Queries with `.select('+password')` to override `select: false`.
- `bcrypt.compare()` to verify. Includes a legacy fallback for any plain-text passwords saved before hashing was added — upgrades them to bcrypt on first successful login.
- Returns `{ token, user: { id, name, email, role } }`.

**User creation** (`POST /users`): `bcrypt.hash(password, 10)` before saving.

---

### 2. Auth Context (`contexts/AuthContext.jsx`)

Central auth state used by the entire app.

**`login(email, password)`**:
- `POST /login` with JSON body — passwords never appear in the URL.
- Stores `token` and `user` in `localStorage`.
- Calls `applyToken(token)` → sets `axios.defaults.headers.common['Authorization'] = 'Bearer <token>'` so every axios call in the app automatically sends the header.

**`fetchWithAuth(url, options)`** — exported named export:
Wraps native `fetch()`, reads the token from localStorage and injects `Authorization: Bearer <token>`. Used by pages that call `fetch()` directly (upload, review, audit).

**On page refresh**: `useEffect` restores `user` from localStorage and calls `applyToken()` to re-apply the axios header so axios calls still work after a reload.

**`logout()`**: Clears localStorage, calls `applyToken(null)` to remove the header from axios.

---

### 3. Routing (`routes/index.jsx`, `routes/MainRoutes.jsx`, `routes/LoginRoutes.jsx`)

**`routes/index.jsx`** — root router, combines both route trees:
```js
const router = createBrowserRouter([MainRoutes, LoginRoutes]);
```

**`routes/LoginRoutes.jsx`** — public routes under `MinimalLayout`: `/login`, `/register`.

**`routes/MainRoutes.jsx`** — all routes under `Dashboard` layout (auth-guarded). Includes:
```
/                      → Dashboard
/dashboard/default     → Dashboard
/document-upload       → DocumentUploadPage
/document-review       → DocumentReviewPage
/document-tracking     → DocumentTrackingPage   ← new
/audit-finance-interface → AuditInterface
/all-notifications     → AllNotifications
/add-user              → Adduser
```

---

### 4. Auth Guard (`layout/Dashboard/index.jsx`)

```jsx
if (!isAuthenticated) return <Navigate to="/login" replace />;
```
Any unauthenticated visit to a dashboard route is redirected to `/login`.

---

### 5. Navigation & Menu (`menu-items/`, `layout/Dashboard/Drawer/DrawerContent/Navigation/index.jsx`)

**`menu-items/index.jsx`** — exports `{ items: [dashboard, utilities] }` consumed by the navigation component.

**`menu-items/dashboard.jsx`** — single Dashboard item pointing to `/dashboard/default`, visible to all roles.

**`menu-items/utilities.jsx`** — Document Management group. Each item has a `roles` array (or none for all-role access):

| Menu Item | URL | Roles |
|---|---|---|
| Upload Document | `/document-upload` | Employee, HOD |
| Document Review | `/document-review` | HOD |
| Document Tracking | `/document-tracking` | All |
| Audit & Finance | `/audit-finance-interface` | Audit Department |
| Notifications | `/all-notifications` | All |
| Manage Users | `/add-user` | HOD |

**`Navigation/index.jsx`** — reads `user.role` from `useAuth()` and filters:
```js
const filteredChildren = group.children.filter(item =>
    !item.roles || item.roles.includes(userRole)
);
```

---

### 6. Header Profile (`layout/Dashboard/Header/HeaderContent/Profile/index.jsx`)

Shows the logged-in user's name and role from `useAuth()`. Logout button calls `logout()` from AuthContext then navigates to `/login`.

---

### 7. Dashboard (`pages/dashboard/index.jsx` + `OrdersTable.jsx`)

**Stat cards** — 6 cards with role-appropriate MUI colours: Total (primary), Pending (warning), Approved (success), Rejected (error), In Review (info), Paid (success). Counts computed by filtering the document list.

**`OrdersTable.jsx`** — fetches all documents via axios (auto-includes auth header), renders status with a coloured `Dot` component for all six statuses: Pending, Approved, Rejected, In Review by Finance Department, Processing Payment, Paid. Also displays payment amount where available.

**Activity Log** — flattens `statusHistory` from every document, sorts by timestamp descending, shows last 10 events with colour-coded avatar icon and relative timestamp (`formatDistanceToNow`).

**Welcome message** — `Welcome back, {user.name}` from AuthContext.

---

### 8. Login Form (`pages/authentication/auth-forms/AuthLogin.jsx`)

Formik + Yup validated form (`email` format, `password` required). On submit calls `login()` from AuthContext. Displays server-side error messages (wrong password, user not found) inline. On success navigates to `/dashboard/default`.
