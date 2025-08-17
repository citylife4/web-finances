# 🐳 Docker Configuration for Finance Tracker

This directory contains Docker configuration files to run the Finance Tracker application in containerized environments.

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Make (optional, for using Makefile commands)

## 🚀 Quick Start

### Development Environment
```bash
# Start development environment
make dev

# Or manually with docker-compose
docker-compose -f docker-compose.dev.yml up -d --build
```

### Production Environment
```bash
# Start production environment
make prod

# Or manually with docker-compose
docker-compose up -d --build
```

## 📁 File Structure

```
├── docker-compose.yml          # Production configuration
├── docker-compose.dev.yml      # Development configuration
├── Dockerfile.frontend         # Frontend multi-stage build
├── backend/
│   ├── Dockerfile              # Backend production build
│   ├── Dockerfile.dev          # Backend development build
│   ├── healthcheck.js          # Health check script
│   ├── .env.production         # Production environment variables
│   └── .env.development        # Development environment variables
├── nginx.conf                  # Nginx configuration for production
├── mongo-init/
│   └── init.js                 # MongoDB initialization script
├── .dockerignore               # Docker ignore file
├── Makefile                    # Docker management commands
└── DOCKER.md                   # This file
```

## 🔧 Available Services

| Service  | Development Port | Production Port | Description |
|----------|------------------|-----------------|-------------|
| Frontend | 5173            | 80              | Vue.js application |
| Backend  | 3001            | 3001            | Express.js API |
| MongoDB  | 27017           | 27017           | Database |

## 🛠️ Make Commands

```bash
make help         # Show all available commands
make dev          # Start development environment
make prod         # Start production environment
make build        # Build all Docker images
make up           # Start all services
make down         # Stop all services
make logs         # View logs from all services
make clean        # Remove all containers and images
make reset        # Reset everything (clean + rebuild)
make health       # Check service health
make db-reset     # Reset database
```

## 🐛 Debugging

### View Logs
```bash
# All services
make logs

# Specific service
make logs-frontend
make logs-backend
make logs-mongo
```

### Access Container Shells
```bash
# Backend container
make shell-backend

# Frontend container
make shell-frontend

# MongoDB shell
make shell-mongo
```

### Health Checks
```bash
# Check all services
make health

# Manual health check
curl http://localhost:3001/api/health
curl http://localhost:5173  # or :80 for production
```

## 🔒 Environment Variables

### Backend Environment Variables

**Development (.env.development):**
- `NODE_ENV=development`
- `MONGODB_URI=mongodb://admin:password123@mongodb:27017/finance-tracker?authSource=admin`
- `PORT=3001`

**Production (.env.production):**
- `NODE_ENV=production`
- `MONGODB_URI=mongodb://admin:password123@mongodb:27017/finance-tracker?authSource=admin`
- `PORT=3001`

### Frontend Environment Variables
- `VITE_API_URL=http://localhost:3001/api` (development)
- API URL is proxied through Nginx in production

## 🗄️ Database Configuration

### MongoDB Credentials
- **Username:** `admin`
- **Password:** `password123`
- **Database:** `finance-tracker`

### Data Persistence
- Development: `mongodb_data_dev` volume
- Production: `mongodb_data` volume

### Database Initialization
The `mongo-init/init.js` script automatically:
- Creates required collections with validation
- Sets up indexes for performance
- Configures proper schema validation

## 🌐 Network Configuration

### Development
- Network: `finance-tracker-dev`
- All services communicate via container names

### Production
- Network: `finance-tracker-network`
- Frontend proxy requests to backend through Nginx

## 🔄 Development Workflow

1. **Start development environment:**
   ```bash
   make dev
   ```

2. **Make changes to code** (files are mounted as volumes)

3. **View logs for debugging:**
   ```bash
   make logs
   ```

4. **Reset if needed:**
   ```bash
   make reset
   ```

## 🚀 Production Deployment

1. **Build and start production environment:**
   ```bash
   make prod
   ```

2. **The production setup includes:**
   - Nginx reverse proxy
   - Optimized Vue.js build
   - Production MongoDB configuration
   - Health checks and restart policies

## 🛡️ Security Features

### Production Security
- Non-root users in containers
- Nginx security headers
- Environment-specific configurations
- Network isolation
- Volume mounting restrictions

### Development Security
- Isolated development network
- Development-only credentials
- Hot-reload with volume mounts

## 📊 Monitoring

### Health Checks
- Backend: HTTP health endpoint
- Frontend: Nginx status
- MongoDB: Connection monitoring

### Logs
All services provide structured logging accessible via Docker logs.

## 🔧 Customization

### Environment Variables
Modify `.env.development` or `.env.production` files for custom configurations.

### Nginx Configuration
Edit `nginx.conf` to customize frontend serving and API proxying.

### MongoDB Initialization
Modify `mongo-init/init.js` to customize database setup.

## ❗ Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   # Stop conflicting services
   sudo systemctl stop mongod
   sudo systemctl stop nginx
   ```

2. **Permission issues:**
   ```bash
   # Fix permissions
   sudo chown -R $USER:$USER .
   ```

3. **Database connection issues:**
   ```bash
   # Reset database
   make db-reset
   ```

4. **Container build issues:**
   ```bash
   # Clean rebuild
   make reset
   ```

### Getting Help
- Check logs: `make logs`
- Health check: `make health`
- Reset everything: `make reset`
