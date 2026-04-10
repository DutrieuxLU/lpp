# LPP - League Press Poll

An AP Poll-style human-voted ranking system for professional League of Legends esports teams.

## Overview

LPP (League Press Poll) is a weekly human-voted ranking of professional League of Legends teams across all major regions (LCS, LEC, LCK, LPL, CBLOL, LLA). Modeled after the Associated Press college football poll, it provides a credible, journalist-driven alternative to algorithm-based rankings.

## The Problem

- Existing LoL team rankings (LoL Esports Global Power Rankings) are purely algorithmic
- No human-voted poll exists specifically for League of Legends esports
- The AP Poll in college football has been the gold standard since 1936

## Our Solution

A panel of esports journalists and analysts vote weekly, ranking their top 25 teams. Points are awarded 25-1 (1st place = 25 points, 25th = 1 point), and the aggregated results form the official LPP Top 25.

## Features

- **Weekly Rankings**: Published after major region matches each week
- **All Regions**: LCS, LEC, LCK, LPL, CBLOL, LLA coverage
- **Historical Archive**: Browse past rankings by year and split
- **Transparent Process**: Public ballots (future phase)
- **External Data Integration**: Uses Cito API for match data

## Tech Stack

- **Backend**: Go with Gin framework
- **Database**: PostgreSQL with GORM
- **External Data**: Cito API
- **Frontend**: Coming soon

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
