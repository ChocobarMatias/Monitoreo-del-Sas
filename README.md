# Security Workforce Management (Mobile-First)

Full-stack blueprint for managing attendance and payroll for security personnel.

## Stack
- Frontend: React + Zustand + Tailwind + Axios + React Router
- Backend: Node.js + Express + Prisma + MySQL + JWT + Socket.io

## Architecture
- `controllers`: HTTP handling
- `services`: domain logic (attendance engine, salary engine, integrations)
- `repositories`: Prisma persistence layer
- `validators`: DTO input schemas using Zod

## Setup

### Backend
```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## API Overview
- Auth: register/login/refresh/recovery/reset-password
- Attendance: monthly generation, salary calculation, PDF export
- Admin: users, calendar events, salary scale versions, API keys, webhook management
- Internal: API-key-protected webhook trigger endpoint

## Key Features
- JWT auth with refresh tokens, password recovery, reset-password flow, and rate limiting
- Role-based access control (`ADMIN`, `USER`)
- A/B/C/D rotating attendance engine with holiday, strike, rest day, and leave overrides
- Salary engine with versioned scales and detailed monthly breakdown
- Secure PIN validation and API key middleware
- PDF attendance export (PDFKit)
- Telegram notifications and webhook dispatch service
- WebSocket live updates (Socket.io)
