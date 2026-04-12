# LPP - League Press Poll

An AP Poll-style human-voted ranking system for professional League of Legends esports teams.

## Quick Start

```bash
# 1. Clone and setup
git clone https://github.com/DutrieuxLU/lpp.git
cd lpp

# 2. Install dependencies
cd lpp-backend && go mod tidy
cd ../lpp-frontend && npm install

# 3. Set environment variables
export PORT=8080
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/lpp?sslmode=disable"

# 4. Start services
make seed  # Seed database with initial data
make up   # Start frontend and backend
```

The frontend will be at `http://localhost:3000`
The backend API will be at `http://localhost:8080`

## Prerequisites

- Go 1.21+
- PostgreSQL 14+
- (Optional) Cito API key for external match data

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 8080 |
| DATABASE_URL | PostgreSQL connection string | postgres://postgres:postgres@localhost:5432/lpp?sslmode=disable |
| CITO_API_KEY | API key for Cito (external data) | "" |

## Database Setup

1. Install PostgreSQL
2. Create a database named `lpp`
3. Set the DATABASE_URL environment variable
4. Run the application - tables are auto-migrated

```bash
# Example PostgreSQL setup
sudo -u postgres psql
CREATE DATABASE lpp;
```

## API Documentation

### Get Current Rankings
```bash
curl http://localhost:8080/api/v1/rankings/current
```

### Get All Teams
```bash
curl http://localhost:8080/api/v1/teams
```

### Get Poll Weeks
```bash
curl http://localhost:8080/api/v1/weeks
```

### Submit a Vote (Admin)
```bash
curl -X POST http://localhost:8080/api/v1/votes \
  -H "Content-Type: application/json" \
  -d '{
    "pollWeekId": 1,
    "voterId": 1,
    "rankings": [
      {"teamId": 1, "rank": 1},
      {"teamId": 2, "rank": 2},
      {"teamId": 3, "rank": 3}
    ]
  }'
```

### Calculate Rankings (Admin)
```bash
curl -X POST http://localhost:8080/api/v1/rankings/calculate \
  -H "Content-Type: application/json" \
  -d '{"pollWeekId": 1}'
```

## Development

### Running Tests
```bash
go test ./...
```

### Building
```bash
go build -o lpp-server main.go
```

### Code Structure

```
internal/
├── config/     # Configuration (config.go)
├── models/     # GORM database models (models.go)
├── db/         # Database connection (database.go)
├── handlers/   # HTTP request handlers
└── services/   # Business logic services
```

## Architecture

See ARCHITECTURE.md for detailed architecture documentation.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Features

- [x] Backend API with Go/Gin
- [x] PostgreSQL database
- [x] Ranking calculation (Top 15)
- [x] Team sync from LOLesports API (with logos)
- [x] Public poll display
- [x] Admin vote submission panel
- [x] Role-based system (admin/pollster/general)
- [x] Voter application form
- [ ] Historical archive
- [ ] Voter management

## Allowed Regions

LEC, LCS, LCK, LPL, LCP (PCS), CBLOL

## License

MIT
