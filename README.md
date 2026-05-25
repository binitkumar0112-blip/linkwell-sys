# Linkwell

**Linkwell** is a full-stack civic intelligence platform that connects citizens, NGOs, and volunteers to report, triage, and resolve community issues. Citizens submit problems from their neighbourhood, AI assesses urgency, NGOs claim and coordinate response, and volunteers execute tasks on the ground — all tracked transparently through a live dashboard and impact reports.

---

## Table of Contents

1. [Key Features](#key-features)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Prerequisites](#prerequisites)
5. [Installation](#installation)
6. [Environment Variables](#environment-variables)
7. [Database Setup](#database-setup)
8. [Running the Project](#running-the-project)
9. [User Roles](#user-roles)
10. [Key Routes](#key-routes)
11. [Architecture Overview](#architecture-overview)
12. [Troubleshooting](#troubleshooting)
13. [License](#license)

---

## Key Features

### For Citizens
- **Community Reporting** — Submit issues with title, description, category, photo, and auto-detected GPS location.
- **Live Community Feed** — See real-time updates of reports and resolutions in your area.
- **Issue Tracking** — Follow progress from *reported* → *claimed* → *in-progress* → *resolved*.
- **Donations** — Contribute directly to verified NGOs for specific causes.
- **Impact Reports** — Browse transparent reports on completed work.

### For NGOs
- **NGO Dashboard** — Claim issues, assign volunteers, verify completion, and manage operations.
- **Resource Management** — Track inventory (food, medicine, equipment, etc.) with low-stock alerts.
- **Cross-NGO Alerts** — Escalate overwhelming requests to partner NGOs within the network.
- **OCR Digitization** — Upload handwritten field reports; Gemini OCR converts them into structured data.
- **Verification Workflow** — Review volunteer proof-of-work photos before marking tasks complete.

### For Volunteers
- **Volunteer Portal** — Browse nearby open tasks matching your skills.
- **Task Execution** — Start tasks, submit photographic proof of completion.
- **Personal Dashboard** — View assigned, in-progress, and completed tasks.
- **OCR Document Digitization** — Upload photographed field reports and handwritten surveys for AI extraction.

### Platform-wide
- **AI Urgency Assessment** — Gemini AI scores incoming reports (low / medium / high / critical).
- **Role-based Authentication** — Supabase Auth with email/password and Google OAuth.
- **Real-time Updates** — Supabase realtime subscriptions push new reports and status changes instantly.
- **Interactive Map** — Leaflet-based map view clusters and visualises all active issues.
- **Admin Panel** — Superadmin dashboard for NGO verification and platform oversight.

---

## Technology Stack

### Frontend
| Layer | Tech |
| --- | --- |
| Framework | React 19 + TypeScript |
| Build Tool | Vite 6.2 |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| Auth | Supabase Auth |
| Database Client | Supabase JS v2 |
| Maps | Leaflet + React-Leaflet |
| Icons | Lucide React |
| Dates | date-fns 4 |

### Backend
| Layer | Tech |
| --- | --- |
| Framework | FastAPI 0.110 |
| Server | Uvicorn 0.27 |
| AI | google-generativeai (Gemini) |
| Validation | Pydantic 2.6 |
| File Upload | python-multipart |
| DB Client | supabase-py |

### Database
- **Supabase PostgreSQL** with Row Level Security (RLS) policies.

---

## Project Structure

```
linkwell/
├── backend/                        # FastAPI server
│   ├── routes/
│   │   ├── ai.py                   # Gemini urgency scoring + OCR
│   │   ├── notifications.py        # Notification endpoints
│   │   ├── problems.py             # Issue CRUD
│   │   ├── resources.py            # NGO inventory management
│   │   └── verifications.py        # Volunteer proof review
│   ├── services/
│   │   ├── ai_service.py           # Gemini API integration
│   │   ├── auth_dependency.py      # JWT token verification
│   │   └── problem_service.py      # Issue business logic
│   ├── main.py                     # FastAPI app entry
│   ├── requirements.txt
│   └── .env.example
│
├── src/                            # React frontend
│   ├── components/
│   │   ├── layout/AppLayout.tsx    # Main app shell + navbar
│   │   ├── ui/                     # Button, Card, Skeleton, Badges
│   │   ├── AdminRouteGuard.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── LiveFeed.tsx
│   │   ├── MapView.tsx
│   │   ├── Questionnaire.tsx       # Volunteer onboarding
│   │   └── NGOQuestionnaire.tsx    # NGO onboarding
│   ├── lib/
│   │   ├── supabase.ts             # Supabase client init
│   │   ├── errorMessages.ts        # User-friendly error mapper
│   │   ├── geocode.ts              # Reverse geocoding
│   │   ├── leafletFix.ts           # Leaflet icon fix
│   │   ├── mock-data.ts            # Fallback mock data
│   │   └── utils.ts
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── AdminDashboard.tsx  # Superadmin panel
│   │   │   └── AdminNgoDetail.tsx  # NGO detail/verification
│   │   ├── LandingPage.tsx
│   │   ├── Auth.tsx                # Login / Register
│   │   ├── CommunityReport.tsx     # Submit issue form
│   │   ├── CommunityDashboard.tsx  # Citizen home
│   │   ├── PublicCommunityView.tsx # Public feed
│   │   ├── IssueDetail.tsx         # Single issue view
│   │   ├── CheckStatus.tsx         # Issue status lookup
│   │   ├── NgoDashboard.tsx        # NGO workspace
│   │   ├── NgoRegister.tsx         # NGO signup
│   │   ├── NgoRejected.tsx         # NGO rejection notice screen
│   │   ├── NGOPendingReview.tsx    # Awaiting admin review state
│   │   ├── PendingVerification.tsx # Post-signup verification gate
│   │   ├── NGOResourceDashboard.tsx # Inventory management
│   │   ├── NGOVerifications.tsx    # Proof review page
│   │   ├── NGOList.tsx             # Public NGO directory
│   │   ├── AlertPanel.tsx          # Cross-NGO alerts
│   │   ├── VolunteerPortal.tsx     # Open task board
│   │   ├── VolunteerDashboard.tsx  # Volunteer home
│   │   ├── VolunteerRegister.tsx   # Volunteer signup
│   │   ├── OcrUploadDashboard.tsx  # OCR document scanner
│   │   ├── DonationFlow.tsx        # Donation page
│   │   └── ImpactReports.tsx       # Community impact
│   ├── services/                   # Supabase + API service layer
│   │   ├── useAuth.ts              # Auth hook + session management
│   │   ├── api.ts                  # Backend API client
│   │   ├── citizenReportService.ts
│   │   ├── ngoDashboardService.ts
│   │   ├── ngoNetworkService.ts
│   │   ├── ngoService.ts
│   │   ├── volunteerDashboardService.ts
│   │   ├── volunteerService.ts
│   │   ├── resourceService.ts
│   │   ├── donationService.ts
│   │   ├── issueDetails.ts
│   │   ├── issues.ts
│   │   ├── realtimeService.ts
│   │   ├── smartService.ts
│   │   ├── statsService.ts
│   │   └── adminService.ts
│   ├── types/database.types.ts
│   ├── utils/generateVerificationId.ts
│   ├── App.tsx                     # Route definitions
│   ├── main.tsx                    # React entry point
│   └── index.css                   # Global styles + design tokens
│
├── supabase_schema.sql             # Base tables
├── supabase_migrations.sql         # Core migrations
├── supabase_ngo_verification.sql   # NGO verification system
├── supabase_rls_policies.sql       # Row Level Security policies
├── supabase_seed_data.sql          # Demo seed data
├── .env.example                    # Environment template
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json

---

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- **Supabase** project (free tier works)
- **Google AI Studio** API key (for Gemini)

---

## Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd linkwell
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Install backend dependencies

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
cd ..
```

---

## Environment Variables

### Frontend — `.env` (project root)

Copy the template and fill in your keys:

```bash
cp .env.example .env
```

```env
VITE_API_BASE_URL=http://localhost:8000

VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend — `backend/.env`

```bash
cp backend/.env.example backend/.env
```

```env
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
```

Get your Supabase keys from **Dashboard → Settings → API**.
Get your Gemini key from **[Google AI Studio](https://aistudio.google.com/app/apikey)**.

---

## Database Setup

Run the SQL scripts in your Supabase SQL editor **in this order**:

1. `supabase_schema.sql` — base tables (`issues`, `ngos`, `volunteers`, `users`, …)
2. `supabase_migrations.sql` — core migrations and lifecycle upgrades
3. `supabase_ngo_verification.sql` — NGO verification workflow
4. `supabase_rls_policies.sql` — Row Level Security policies
5. `supabase_seed_data.sql` — *(optional)* demo data for testing

---

## Running the Project

### Start the backend (terminal 1)

```bash
cd backend

# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

uvicorn main:app --reload --port 8000
```

Backend runs at `http://localhost:8000` — API docs at `http://localhost:8000/docs`.

### Start the frontend (terminal 2)

```bash
npm run dev
```

Frontend runs at `http://localhost:5173`.

### Useful scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | TypeScript type-check (no emit) |

---

## User Roles

Linkwell has four user roles:

| Role | Capabilities |
| --- | --- |
| **citizen** | Report issues, browse feed, donate, view public dashboards |
| **ngo_admin** | Claim issues, manage resources, assign volunteers, verify tasks, OCR uploads, cross-NGO alerts |
| **volunteer** | Browse open tasks, accept assignments, submit proof-of-work |
| **superadmin** | Verify/reject NGO applications, platform-wide oversight |

---

## Key Routes

| Path | Page | Access |
| --- | --- | --- |
| `/` | Landing page | Public |
| `/auth` | Login / Register | Public |
| `/report` | Submit community report | Citizen |
| `/citizen-dashboard` | Community dashboard | Citizen |
| `/community` | Public community view | Public |
| `/issue/:id` | Issue detail | All authed |
| `/ngo-dashboard` | NGO workspace | NGO admin |
| `/ngo/resources` | Resource inventory | NGO admin |
| `/ngo/verifications` | Proof review | NGO admin |
| `/ngo/ocr-upload` | OCR document scanner | NGO admin |
| `/ngo/reports` | Impact reports | NGO admin |
| `/alerts` | Cross-NGO alert panel | NGO admin |
| `/ngos` | Directory of NGOs | Public |
| `/volunteer-portal` | Open task board | Volunteer |
| `/volunteer-dashboard` | Volunteer home | Volunteer |
| `/volunteer/ocr-upload` | OCR upload | Volunteer |
| `/donate` | Donation flow | Public |
| `/impact` | Impact reports | Public |
| `/admin` | Superadmin dashboard | Superadmin |

---

## Architecture Overview

```
┌────────────────┐       ┌────────────────┐       ┌────────────────┐
│   React App    │──────▶│   FastAPI      │──────▶│  Gemini AI     │
│   (Vite)       │       │   Backend      │       │  (urgency/OCR) │
└───────┬────────┘       └────────┬───────┘       └────────────────┘
        │                         │
        │  Supabase Auth JWT     │  Verify JWT + service calls
        ▼                         ▼
┌────────────────────────────────────────────┐
│         Supabase PostgreSQL                │
│   (issues, ngos, volunteers, alerts, …)    │
│   + Realtime subscriptions + RLS           │
└────────────────────────────────────────────┘
```

- **Auth flow**: Supabase issues JWTs on login → frontend attaches as `Authorization: Bearer <token>` → backend verifies with Supabase JWT secret.
- **Data flow**: Most reads/writes go directly to Supabase via `@supabase/supabase-js` (RLS enforced). AI-powered endpoints (urgency scoring, OCR) route through the FastAPI backend.
- **Realtime**: `realtimeService.ts` subscribes to Supabase channels for live feed updates and notifications.

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `Failed to load alerts` in Alert Panel | Ensure `supabase_migrations.sql` has been run completely. |
| Supabase join returns arrays instead of objects | Services normalise this (e.g. `ngoNetworkService.getEscalatedAlerts`). |
| Blank Leaflet map tiles | Confirm `leafletFix.ts` is imported and network access to OpenStreetMap tile servers is allowed. |
| Backend CORS error | Verify `VITE_API_BASE_URL` matches the Uvicorn host/port and CORS middleware is configured in `main.py`. |
| Login redirects incorrectly | Check that the user's `role` in the `users` table matches their intended portal. |

---

## License

This project is released under the **MIT License**. See [LICENSE](LICENSE) for details.

---

## Acknowledgements

- **Supabase** — Authentication + PostgreSQL + realtime
- **Google Gemini** — AI urgency assessment and OCR
- **OpenStreetMap / Leaflet** — Maps
- **Lucide** — Icon set

## Contributors
- Binit Kumar Gond
- Rudraksh Chorge
- Nikhil Dhuria