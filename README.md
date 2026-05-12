# SentinelAR — Maintenance OS

An AR-assisted fault detection and maintenance management system for transport infrastructure. Built with React + Express + SQLite — fully local, self-hosted, no external services required.

**Live Demo:** [https://technical-innovations-ar-coursework.onrender.com](https://technical-innovations-ar-coursework.onrender.com)
*(Note: As this is hosted on a free Render tier, the backend may take 30-50 seconds to spin up from sleep).*

---

## Key Features
- **Live AR Fault Detection:** Uses on-device TensorFlow.js (COCO-SSD) to scan, identify, and track physical objects in real-time via the browser camera.
- **Machine Learning Analytics:** Integrated Node.js linear regression model generating 7-day predictive failure risk forecasts.
- **True Dataset Integration:** The SQLite database is automatically seeded using the `maintenance_dataset.csv` pipeline, allowing the frontend to natively reflect real historical faults.
- **Role-Based Access Control:** Secure JWT authentication with Admin, Supervisor, and Technician roles.

---

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** (v18 or higher) — [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** — [Download](https://git-scm.com/)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/JustVic19/Technical-Innovations-AR-Coursework.git
cd Technical-Innovations-AR-Coursework
```

### 2. Install dependencies

```bash
npm install
```

### 3. Seed the database

This creates a local SQLite database (`sentinel.db`) and populates it with demo data — sample users, sites, faults, tools, and audit logs.

```bash
npm run seed
```

### 4. Start the backend API server

```bash
npm run server
```

You should see:

```
🛡️  SentinelAR API running at http://localhost:3001
   Health check: http://localhost:3001/api/health
```

### 5. Start the frontend (in a separate terminal)

```bash
npm run dev
```

You should see:

```
VITE v6.x.x  ready in XXXms

➜  Local:   http://localhost:5173/
```

### 6. Open the app

Go to **http://localhost:5173** in your browser. You'll see the login screen.

---

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@sentinel.local` | `admin123` |
| **Supervisor** | `supervisor@sentinel.local` | `super123` |
| **Technician** | `tech@sentinel.local` | `tech123` |

> Each role has different permissions. Admin has full access, Supervisors can approve/reject faults, and Technicians can report faults and run tool checks.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite frontend dev server (port 5173) |
| `npm run server` | Start the Express API server (port 3001) |
| `npm run seed` | Seed the database with demo data |
| `npm run build` | Build the frontend for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

---

## Project Structure

```
├── server/                  # Express API backend
│   ├── index.js             # Server entry point
│   ├── db.js                # SQLite database initialisation & schema
│   ├── seed.js              # Demo data seeder
│   ├── middleware/
│   │   └── auth.js          # JWT authentication middleware
│   └── routes/
│       ├── auth.js          # Login & session endpoints
│       ├── faults.js        # Fault CRUD
│       ├── sites.js         # Site CRUD
│       ├── tools.js         # Tool CRUD
│       ├── toolChecks.js    # Tool check CRUD
│       ├── auditLogs.js     # Audit log list & create
│       └── users.js         # User management & invite
│
├── src/                     # React frontend
│   ├── api/
│   │   ├── client.js        # Fetch wrapper with JWT injection
│   │   └── entities.js      # Entity abstractions (Fault, Site, Tool, etc.)
│   ├── components/          # Reusable UI components
│   ├── lib/
│   │   ├── AuthContext.jsx   # Authentication context & provider
│   │   ├── permissions.js    # Role-based permission helpers
│   │   └── audit.js          # Audit logging utility
│   └── pages/               # Page-level components
│       ├── Login.jsx         # Login screen
│       ├── Dashboard.jsx     # Operations overview
│       ├── Faults.jsx        # Fault register
│       ├── Sites.jsx         # Site registry
│       ├── Tools.jsx         # Tool inventory & AR checks
│       ├── ARView.jsx        # AR inspection view
│       ├── AuditLog.jsx      # Security audit trail
│       └── Admin.jsx         # User administration
│
├── index.html               # HTML entry point
├── vite.config.js            # Vite config (proxy + aliases)
├── package.json              # Dependencies & scripts
└── sentinel.db               # SQLite database (auto-generated, git-ignored)
```

---

## Architecture

```
┌──────────────────────┐       HTTP/JSON       ┌──────────────────────┐
│   React SPA (Vite)   │  ◄──────────────────►  │  Express API Server  │
│   localhost:5173      │                        │  localhost:3001       │
│                       │                        │                      │
│  • TanStack Query     │                        │  • CRUD routes per   │
│  • TailwindCSS        │                        │    entity            │
│  • Radix UI           │                        │  • JWT auth          │
│  • Framer Motion      │                        │  • SQLite via        │
│  • Recharts           │                        │    better-sqlite3    │
└──────────────────────┘                        └──────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite |
| UI Components | Radix UI, Lucide Icons |
| Styling | TailwindCSS |
| State Management | TanStack Query |
| Routing | React Router v6 |
| Charts | Recharts |
| Animation | Framer Motion |
| Backend | Express (Node.js) |
| Database | SQLite (better-sqlite3) |
| Authentication | JSON Web Tokens (JWT) |

---

## Troubleshooting

**"Access token required" on login**
Make sure you're running the latest version of the server code. The auth middleware should not be applied to the login endpoint.

**Database doesn't exist**
Run `npm run seed` to create and populate the database.

**Port already in use**
If port 3001 or 5173 is already in use, kill the process using it:
```bash
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

**Starting fresh**
Delete the database and re-seed:
```bash
rm sentinel.db
npm run seed
```
