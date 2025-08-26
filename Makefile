# Makefile for Finance Tracker Docker Management

.PHONY: help build up down dev prod logs clean reset

# Default target
help:
	@echo "Finance Tracker Docker Commands:"
	@echo "  make dev      - Start development environment"
	@echo "  make prod     - Start production environment"
	@echo "  make build    - Build all Docker images"
	@echo "  make up       - Start all services"
	@echo "  make down     - Stop all services"
	@echo "  make logs     - View logs from all services"
	@echo "  make clean    - Remove all containers and images"
	@echo "  make reset    - Reset everything (clean + rebuild)"

# Development environment
dev:
	docker-compose -f docker-compose.dev.yml up -d --build
	@echo "Development environment started!"
	@echo "Frontend: http://localhost:5173"
	@echo "Backend: http://localhost:3001"
	@echo "MongoDB: localhost:27018"

# Production environment
prod:
	docker-compose up -d --build
	@echo "Production environment started!"
	@echo "Frontend: http://localhost:80"
	@echo "Backend: http://localhost:3001"
	@echo "MongoDB: localhost:27019"

# Build all images
build:
	docker-compose build --no-cache

# Start services
up:
	docker-compose up -d

# Stop services
down:
	docker-compose down
	docker-compose -f docker-compose.dev.yml down

# View logs
logs:
	docker-compose logs -f

# View logs for specific service
logs-frontend:
	docker-compose logs -f frontend

logs-backend:
	docker-compose logs -f backend

logs-mongo:
	docker-compose logs -f mongodb

# Clean up containers and images
clean:
	docker-compose down -v --rmi all
	docker-compose -f docker-compose.dev.yml down -v --rmi all
	docker system prune -f

# Reset everything
reset: clean build dev

# Database operations
db-reset:
	docker-compose down mongodb
	docker volume rm finance-tracker_mongodb_data finance-tracker_mongodb_data_dev 2>/dev/null || true
	docker-compose up -d mongodb

# Health check
health:
	@echo "Checking service health..."
	@curl -f http://localhost:3001/api/health && echo "Backend: OK" || echo "Backend: Failed"
	@curl -f http://localhost:5173 && echo "Frontend: OK" || echo "Frontend: Failed"

# Enter containers for debugging
shell-backend:
	docker exec -it finance-tracker-backend-dev sh

shell-frontend:
	docker exec -it finance-tracker-frontend-dev sh

shell-mongo:
	docker exec -it finance-tracker-mongo-dev mongosh
