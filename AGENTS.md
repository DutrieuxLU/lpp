# AGENTS.md - Instructions for AI Agents

This file contains instructions for AI agents working on the LPP (League Press Poll) project.

## Project Overview

LPP is an AP Poll-style human-voted ranking system for professional League of Legends esports teams. Built with Go/Gin backend and PostgreSQL.

## Key Files

- `lpp-backend/main.go` - Entry point
- `lpp-backend/internal/config/config.go` - Configuration
- `lpp-backend/internal/models/models.go` - Database models
- `lpp-backend/internal/db/database.go` - Database connection
- `lpp-backend/internal/handlers/` - HTTP handlers (to be created)
- `lpp-backend/internal/services/` - Business logic (to be created)

## Important Rules

1. **Always push to GitHub after major changes** - After creating or significantly modifying files, commit and push to GitHub
2. **Keep the scope minimal** - MVP should be as basic as possible
3. **Use existing patterns** - Follow the code style established in existing files

## Current Status

The Go backend is being built with:
- Gin framework for HTTP routing
- GORM for PostgreSQL ORM
- Models for: Team, PollWeek, Voter, Vote, Ranking, Match

## Pending Tasks

1. Install Go dependencies (gin, gorm, postgres driver)
2. Create HTTP handlers for API endpoints
3. Create services for ranking calculation
4. Create initial Go module with dependencies

## Running the Application

```bash
cd lpp-backend
go mod tidy
go run main.go
```

## Environment Variables

Set these before running:
- `PORT` - Server port (default: 8080)
- `DATABASE_URL` - PostgreSQL connection string
- `CITO_API_KEY` - Optional API key for external data

## Git Workflow

1. Make changes to files
2. Run `git add .` to stage
3. Run `git commit -m "description"` to commit
4. Run `git push origin main` to push

## Code Style

- Use Go idioms and conventions
- Use meaningful variable names
- Add comments for complex logic
- Keep functions small and focused

## Important Notes for This Project

- This is a real project, not a portfolio piece
- All regions (LCS, LEC, LCK, LPL, CBLOL, LLA) should be supported from the start
- The voting system is the core feature - keep it simple but functional
- Start as basic as possible, iterate later
