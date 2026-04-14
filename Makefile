.PHONY: all up down help install install-fe install-be dev seed test

help:
	@echo "Available targets:"
	@echo "  all        - Install dependencies and start services"
	@echo "  up         - Start docker and services"
	@echo "  down       - Stop all services and docker"
	@echo "  install    - Install all dependencies"
	@echo "  install-fe - Install frontend dependencies"
	@echo "  install-be - Install backend dependencies"
	@echo "  dev        - Start development mode (both services)"
	@echo "  seed       - Seed the database with initial data"
	@echo "  test       - Run tests"

install: install-fe install-be

start:
	opencode -s ses_27cad670bffeP9xO0LrTBkcZTi
push:
	git add .
	git commit -m "additions"
	git push

install-fe:
	cd lpp-frontend && npm install

install-be:
	cd lpp-backend && go mod download

all: install up

seed:
	@echo "Seeding database..."
	cd lpp-backend && go run cmd/seed/main.go

up:
	@echo "Starting docker services..."
	docker compose up -d
	@echo "Waiting for database to be ready..."
	@for i in 1 2 3 4 5 6 7 8 9 10; do \
		if docker compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then \
			echo "Database is ready!"; \
			break; \
		fi; \
		echo "Waiting for database... ($$i/10)"; \
		sleep 2; \
	done
	@echo "Starting backend..."
	@cd lpp-backend && (source .env && nohup go run main.go > /tmp/backend.log 2>&1 &)
	@echo "Waiting for backend to be ready..."
	@sleep 3
	@echo "Starting frontend..."
	@cd lpp-frontend && nohup npm run dev > /tmp/frontend.log 2>&1 &
	@echo "Both services started!"

down:
	@pkill -f "next dev" 2>/dev/null || true
	@pkill -f "go run main.go" 2>/dev/null || true
	@pkill -f "lpp-backend" 2>/dev/null || true
	@echo "Stopping docker services..."
	docker compose down -v 2>/dev/null || true
	@echo "All services stopped!"

dev: up

test:
	cd lpp-backend && go test -v ./...