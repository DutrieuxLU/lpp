.PHONY: all up down help install install-fe install-be dev seed

help:
	@echo "Available targets:"
	@echo "  all        - Install all dependencies"
	@echo "  up         - Start both frontend and backend"
	@echo "  down       - Stop all services"
	@echo "  install    - Install all dependencies"
	@echo "  install-fe - Install frontend dependencies"
	@echo "  install-be - Install backend dependencies"
	@echo "  dev        - Start development mode (both services)"
	@echo "  seed       - Seed the database with initial data"

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
	@echo "Starting backend..."
	cd lpp-backend && go run main.go &
	@echo "Waiting for backend to be ready..."
	@sleep 3
	@echo "Starting frontend..."
	cd lpp-frontend && npm run dev &
	@echo "Both services started!"

down:
	@pkill -f "next dev" 2>/dev/null || true
	@pkill -f "go run main.go" 2>/dev/null || true
	@pkill -f "lpp-backend" 2>/dev/null || true
	@echo "All services stopped!"

dev: up
