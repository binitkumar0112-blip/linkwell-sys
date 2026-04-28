# Linkwell

Linkwell is a real-time coordination system that enables NGOs, volunteers, and citizens to collaboratively identify, prioritize, and resolve local issues through a unified workflow.

## Problem Statement

Community issues often get reported in fragmented places, making it hard for NGOs and volunteers to discover, verify, prioritize, and resolve them. Linkwell provides one workflow for reporting, verification, resource coordination, donation support, and impact visibility.

## Features

- Citizen issue reporting and public community views
- NGO dashboards for verification, resources, and coordination
- Volunteer registration, task discovery, and volunteer dashboards
- Donation flows for community problems and resource needs
- AI-assisted matching, prioritization, and urgency checks
- AI models analyze issue descriptions and images to classify urgency and recommend optimal NGO/volunteer routing.
- Firebase authentication with role-aware frontend routing
- Supabase-backed application data and backend API integration

## Tech Stack

- React (Vite + TypeScript) → scalable frontend
- FastAPI → high-performance backend APIs
- Supabase → managed PostgreSQL with real-time capabilities
- Firebase → authentication and identity management

## Scalability Considerations

- Modular backend services for future microservice migration
- Role-based access control for multi-tenant NGO usage
- Supabase PostgreSQL for structured relational scaling
- Stateless API design for horizontal scaling

## Folder Structure

```text
project-root/
├── frontend/              # React + Vite app
│   ├── public/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/         # React hooks such as auth state
│   │   ├── pages/         # Route-level screens
│   │   ├── services/      # API/Supabase/Firebase client logic
│   │   ├── types/         # Shared TypeScript types
│   │   └── utils/         # UI and helper utilities
│   └── package.json
├── backend/               # FastAPI backend
│   ├── database/          # Database/Firebase client setup
│   ├── routes/            # API endpoint definitions
│   ├── services/          # Business logic
│   ├── main.py
│   └── requirements.txt
├── database/
│   ├── schema.sql
│   └── migrations/
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Setup

### 1. Environment

Copy `.env.example` into local environment files as needed.

Frontend variables usually belong in `frontend/.env.local`:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_KEY=
VITE_API_BASE_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=
```

Backend variables usually belong in `backend/.env`:

```bash
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_ANON_KEY=
FIREBASE_PROJECT_ID=
FIREBASE_ADMIN_PRIVATE_KEY=
FIREBASE_ADMIN_CLIENT_EMAIL=
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Backend

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```

### 4. Root Scripts

From the repository root:

```bash
npm run dev:frontend
npm run dev:backend
npm run build
npm run lint
```

## Architecture Notes

- Frontend screens live in `frontend/src/pages`.
- Reusable UI lives in `frontend/src/components`.
- API calls and external clients live in `frontend/src/services`.
- React stateful helpers live in `frontend/src/hooks`.
- FastAPI route handlers live in `backend/routes`.
- Backend business logic lives in `backend/services`.
- Backend database/client setup lives in `backend/database`.
- Generated folders such as `node_modules`, `dist`, virtual environments, and Python caches are excluded by `.gitignore`.
