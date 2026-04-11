.PHONY: all up down help install install-fe install-be dev

help:
	@echo "Available targets:"
	@echo "  all        - Install all dependencies"
	@echo "  up         - Start both frontend and backend"
	@echo "  down       - Stop all services"
	@echo "  install    - Install all dependencies"
	@echo "  install-fe - Install frontend dependencies"
	@echo "  install-be - Install backend dependencies"
	@echo "  dev        - Start development mode (both services)"

install: install-fe install-be

install-fe:
	cd lpp-frontend && npm install

install-be:
	cd lpp-backend && go mod download

all: install up

up:
	@echo "Starting frontend..."
	cd lpp-frontend && npm run dev &
	@echo "Starting backend..."
	cd lpp-backend && go run main.go &
	@echo "Both services started!"

down:
	@pkill -f "next dev" 2>/dev/null || true
	@pkill -f "go run main.go" 2>/dev/null || true
	@pkill -f "lpp-backend" 2>/dev/null || true
	@echo "All services stopped!"

dev: up