# LoL Esports Human Poll - MVP Specification

## Project Overview
- **Name**: LoL Top 25 (working title - needs branding)
- **Type**: Full-stack web application
- **Core Functionality**: Human-voted weekly rankings of professional League of Legends teams across all major regions
- **Target Users**: Esports fans, journalists, analysts

## Tech Stack
- **Frontend**: Next.js 14 (React) with TypeScript
- **Backend**: Next.js API routes (or separate Express)
- **Database**: PostgreSQL with Prisma ORM
- **External Data**: Cito API (covers LCS, LEC, LCK, LPL, CBLOL, LLA)
- **Styling**: Tailwind CSS
- **Hosting**: Vercel (frontend + serverless) / Supabase (PostgreSQL)

## Data Model

### Teams
- id, name, shortName, region, logo, createdAt

### Voters
- id, name, outlet, email, region, isActive, createdAt

### Votes
- id, pollWeekId, voterId, rankings (JSON: [{teamId, rank}])

### PollWeeks
- id, year, split (spring/summer), weekNumber, publishDate, status (open/closed/published)

### Rankings (published)
- id, pollWeekId, teamId, rank, points, firstPlaceVotes

### Matches (cached from external API)
- id, externalId, date, team1Id, team2Id, team1Score, team2Score, region, league

## Core Features

### 1. Public Poll Display
- Current week Top 25 rankings
- Teams receiving votes but not ranked
- Week-by-week navigation
- Year/split selector

### 2. Vote Submission (Admin)
- Simple 1-25 ranking input
- Auto-save drafts
- Submit final ballot for week

### 3. Ranking Calculation
- Point system: 25-24-23...-1
- Automatic tabulation from ballots
- Tiebreaker handling

### 4. Historical Archive
- Browse by year/split
- View any past week's rankings

### 5. Data Sync
- Fetch match results from Cito API
- Cache team data locally
- Manual refresh trigger

## API Endpoints

### Public
- GET /api/rankings/current - Get current poll
- GET /api/rankings/:weekId - Get specific week
- GET /api/teams - List teams
- GET /api/weeks - List poll weeks

### Admin
- POST /api/votes - Submit voter ballot
- POST /api/sync/teams - Sync team data from external API
- POST /api/calculate - Calculate rankings from votes

## MVP Scope (Phase 1)
1. Manual voter management (no self-signup)
2. No authentication yet (simple admin routes)
3. Basic team data from external API
4. Simple 1-page public display
5. No email notifications
6. No voter ballot public view yet
7. Single year support initially

## Regions Covered
- LCS (North America)
- LEC (Europe)
- LCK (Korea)
- LPL (China)
- CBLOL (Brazil)
- LLA (Latin America)
