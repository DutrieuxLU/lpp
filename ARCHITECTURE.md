# LPP - League Press Poll

An AP Poll-style human-voted ranking system for professional League of Legends esports teams.

## Overview

LPP (League Press Poll) is a weekly human-voted ranking of professional League of Legends teams across all major regions (LCS, LEC, LCK, LPL, CBLOL, LLA). Modeled after the Associated Press college football poll, it provides a credible, journalist-driven alternative to algorithm-based rankings.

## The Problem

- Existing LoL team rankings (LoL Esports Global Power Rankings) are purely algorithmic
- No human-voted poll exists specifically for League of Legends esports
- The AP Poll in college football has been the gold standard since 1936

## Our Solution

A panel of esports journalists and analysts vote weekly, ranking their top 15 teams. Points are awarded 15-1 (1st place = 15 points, 15th = 1 point), and the aggregated results form the official LPP Top 15.

## Features

- **Weekly Rankings**: Top 15 published after major region matches each week
- **All Regions**: LEC, LCS, LCK, LPL, LCP (PCS), CBLOL coverage
- **Team Sync**: Automatic sync from LOLesports API with team logos
- **Role-Based Access**: admin/pollster/general roles
- **Application System**: Public form to apply to become a pollster

## Tech Stack

- **Backend**: Go with Gin framework
- **Database**: PostgreSQL with GORM
- **External Data**: LOLesports API
- **Frontend**: Next.js with TypeScript

## Project Structure

```
lpp-backend/
├── cmd/server/      # Application entry point
├── internal/
│   ├── config/     # Configuration management
│   ├── models/     # Database models
│   ├── db/         # Database connection
│   ├── handlers/   # HTTP handlers
│   └── services/   # Business logic
└── pkg/            # Shared packages
```

## API Endpoints

### Public
- `GET /api/v1/rankings/current` - Current poll rankings
- `GET /api/v1/rankings/:weekId` - Specific week rankings
- `GET /api/v1/teams` - List all teams
- `GET /api/v1/weeks` - List poll weeks

### Admin
- `POST /api/v1/votes` - Submit voter ballot
- `POST /api/v1/sync/teams` - Sync teams from external API
- `POST /api/v1/rankings/calculate` - Calculate rankings from votes

## Database Schema

- **teams**: Professional LoL teams
- **poll_weeks**: Each voting period
- **voters**: Registered voters (journalists/analysts)
- **votes**: Individual voter ballots
- **rankings**: Published poll results
- **matches**: Cached match results

## Getting Started

See README.md for detailed setup instructions.

## License

MIT
