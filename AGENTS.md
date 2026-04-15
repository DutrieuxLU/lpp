# AGENTS.md - Instructions for AI Agents

This file contains instructions for AI agents working on the LPP (League Press Poll) project.

## Project Overview

LPP is an AP Poll-style human-voted ranking system for professional League of Legends esports teams. Built with Go/Gin backend, Next.js frontend, and PostgreSQL.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Go 1.25 + Gin + GORM |
| Frontend | Next.js 16.2.3 + React 19 + Tailwind 4 |
| Database | PostgreSQL |
| Auth | JWT + Argon2id + 2FA via Resend |
| Monitoring | Sentry |
| Email | Resend |

## Key Files

### Backend
- `lpp-backend/main.go` - Entry point
- `lpp-backend/cmd/server/server.go` - HTTP server setup
- `lpp-backend/internal/config/config.go` - Configuration
- `lpp-backend/internal/models/models.go` - Database models
- `lpp-backend/internal/db/database.go` - Database connection
- `lpp-backend/internal/handlers/` - HTTP handlers
- `lpp-backend/internal/services/` - Business logic
- `lpp-backend/internal/security/` - JWT, password hashing, Turnstile
- `lpp-backend/internal/middleware/` - Auth & rate limiting
- `lpp-backend/internal/email/` - Resend email service
- `lpp-backend/cmd/seed/main.go` - Database seeding

### Frontend
- `lpp-frontend/src/app/` - Next.js pages (page.tsx, login, vote, admin, apply, pollsters)
- `lpp-frontend/src/lib/api.ts` - API client
- `lpp-frontend/src/lib/jwt.ts` - JWT handling
- `lpp-frontend/src/types/api.ts` - TypeScript types
- `lpp-frontend/src/middleware.ts` - Route protection

## Important Rules

1. **Always push to GitHub after major changes**
2. **Keep the scope minimal** - MVP should be as basic as possible
3. **Use existing patterns** - Follow the code style established in existing files

## Current Status

The application includes:
- Full authentication system with Argon2id password hashing
- JWT-based sessions with refresh token rotation
- Email-based 2FA (6-digit codes, 2-min expiry) via Resend
- Role-based access control (admin, pollster, general)
- Voting form with exactly 15 team rankings, no duplicates
- Admin dashboard for managing poll weeks, voters, applications
- Team sync from LOLesports API (206 teams)
- Rankings calculation from votes

## Environment Variables

### Backend (`lpp-backend/.env`)
```
PORT=8080
DATABASE_URL=postgres://postgres:postgres@localhost:5432/lpp?sslmode=disable
JWT_SECRET=<32+ character secret>
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=ldutrie@purdue.edu
TURNSTILE_SECRET=<optional>
SENTRY_DSN=<optional>
```

### Frontend (`lpp-frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
JWT_SECRET=<same as backend>
```

## Deployment

The app is configured for deployment on Render:
- Backend: Go/Gin web service
- Frontend: Next.js web service
- Database: Render PostgreSQL

## Allowed Regions

LEC, LCS, LCK, LPL, LCP (PCS), CBLOL

## External APIs

### LOLesports API (Team Data)

**Base URL**: `https://esports-api.lolesports.com/persisted/gw/getTeams`  
**Alternative**: `https://prod-relapi.ewp.gg/persisted/gw/getTeams`  
**API Key** (public): `0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z`  
**Headers**: `x-api-key: 0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z`  
**Query Params**: `hl=en-US`

## Running Locally

```bash
# Backend
cd lpp-backend
go run main.go

# Frontend
cd lpp-frontend
npm run dev
```

## Git Workflow

1. Make changes to files
2. Run `git add .` to stage
3. Run `git commit -m "description"` to commit
4. Run `git push origin master` to push

## Code Style

- Use Go idioms and conventions
- Use meaningful variable names
- Add comments for complex logic
- Keep functions small and focused

## Important Notes

- This is a real project, not a portfolio piece
- The voting system is the core feature
- 2FA codes are sent via Resend email