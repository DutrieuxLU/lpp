# LoL Esports Human Poll - Specification

## Project Overview
- **Name**: LPP - League Press Poll
- **Type**: Full-stack web application
- **Core Functionality**: Human-voted weekly Top 15 rankings of professional League of Legends teams
- **Target Users**: Esports fans, journalists, analysts

## Tech Stack
- **Frontend**: Next.js 14 (React) with TypeScript
- **Backend**: Go with Gin framework
- **Database**: PostgreSQL with GORM
- **External Data**: LOLesports API
- **Styling**: Tailwind CSS

## Data Model

### Teams
- id, name, shortName, region, logo, externalId, createdAt

### Voters
- id, name, outlet, email, password, role, region, isActive, createdAt

### Applications
- id, name, email, outlet, region, notes, status, createdAt

### Votes
- id, pollWeekId, voterId, rankings (JSON: [{teamId, rank}])

### PollWeeks
- id, year, split, weekNumber, publishDate, status

### Rankings
- id, pollWeekId, teamId, rank, points, firstPlaceVotes

## Core Features

### 1. Public Poll Display
- Current week Top 15 rankings
- Region filter (Global, LCK, LPL, LEC, LCS, LCP, CBLOL)
- Team logos from LOLesports API

### 2. Vote Submission (Admin)
- Simple 1-15 ranking input
- Team search/filter
- Submit final ballot for week

### 3. Ranking Calculation
- Point system: 15-14-13...-1
- Automatic tabulation from ballots

### 4. Authentication & Roles
- Login page
- Role-based: admin, pollster, general
- Application form for new pollsters

## API Endpoints

### Public
- GET /api/v1/rankings/current
- GET /api/v1/rankings/week/:weekId
- GET /api/v1/teams
- GET /api/v1/weeks
- POST /api/v1/applications

### Auth
- POST /api/v1/auth/login

### Admin
- POST /api/v1/votes
- POST /api/v1/teams/sync
- POST /api/v1/rankings/calculate

## Regions Covered
- LCS (North America)
- LEC (Europe)
- LCK (Korea)
- LPL (China)
- LCP (Pacific/PCS)
- CBLOL (Brazil)
