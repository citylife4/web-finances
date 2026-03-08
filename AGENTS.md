# Financial Account Tracker - Agent Documentation

## Overview

A Vue.js 3 + Express.js financial account tracking application for monitoring wealth progression over time. The application allows users to manage accounts, categories, and track monthly entries with data visualization.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Vue.js 3      │────▶│   Express.js    │────▶│    MongoDB      │
│   Frontend      │     │   Backend API   │     │    Database     │
│   (Vite)        │     │   (Port 3001)   │     │   (Port 27017)  │
│   Port 5173     │     │                 │     │                 │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | Vue.js 3 + Vite | Vue 3.5, Vite 7 |
| Backend | Express.js | 5.x |
| Database | MongoDB + Mongoose | 8.x |
| Charts | Chart.js + vue-chartjs | 4.x |
| Import/Export | XLSX | 0.18.x |

## How to Run

### Prerequisites

- Node.js v24 or higher
- npm
- MongoDB (local installation or Docker)
- Docker & Docker Compose (optional, for containerized development)

### Option 1: Local Development (Without Docker)

**1. Start MongoDB**

Make sure MongoDB is running locally on `localhost:27017`. If using Docker just for MongoDB:

```bash
docker run -d -p 27017:27017 --name mongodb mongo:7
```

**2. Start Backend**

```bash
cd backend
npm install
npm run dev
```

Backend will start on http://localhost:3001

**3. Start Frontend (separate terminal)**

```bash
# From project root
npm install
npm run dev
```

Frontend will start on http://localhost:5173

### Option 2: Docker Development

```bash
# Start all services (frontend, backend, mongodb)
make dev

# View logs
make logs

# Check health
make health

# Stop services
make down
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001 |
| MongoDB | localhost:27017 |

### Option 3: Docker Production

```bash
# Build and start production containers
make prod

# Frontend served via nginx on port 80
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:80 |
| Backend API | http://localhost:3001 |

## API Endpoints

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | API health status |

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout user |
| POST | `/api/auth/logout-all` | Logout from all devices |
| GET | `/api/auth/me` | Get current user |

### Accounts (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/accounts` | Get all accounts |
| POST | `/api/accounts` | Create new account |
| PUT | `/api/accounts/:id` | Update account |
| DELETE | `/api/accounts/:id` | Delete account |

### Categories (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Get all categories |
| GET | `/api/categories/:type` | Get by type (deposits/investments) |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category (blocked if accounts exist) |

### Monthly Entries (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/entries` | Get all entries |
| POST | `/api/entries` | Create/update entries (batch) |
| GET | `/api/entries/month/:month` | Get entries for month (YYYY-MM) |
| GET | `/api/entries/analytics/totals` | Get monthly totals for charts |

## Environment Variables

### Backend (.env)

Create `backend/.env`:

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/finance-tracker
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-token-secret-change-in-production
```

### Frontend (.env)

Create `.env` in project root:

```env
VITE_API_URL=http://localhost:3001/api
```

### Docker Environment

For Docker, credentials are in `.env` file (do not commit to git):

```env
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=your-secure-password
```

## Project Structure

```
web-finances/
├── src/                          # Frontend Vue.js application
│   ├── components/              # Reusable Vue components
│   │   ├── NavBar.vue          # Navigation bar
│   │   └── HelloWorld.vue      # Template component
│   ├── views/                   # Page-level Vue components
│   │   ├── Dashboard.vue       # Main dashboard with charts
│   │   ├── AccountManager.vue  # Account CRUD
│   │   ├── CategoryManager.vue # Category CRUD
│   │   ├── MonthlyEntry.vue    # Monthly data entry
│   │   └── ImportData.vue      # XLSX import functionality
│   ├── router/                  # Vue Router configuration
│   │   └── index.js
│   ├── services/                # API service layer
│   │   └── api.js              # Axios HTTP client with auth interceptors
│   ├── store/                   # State management
│   │   └── api-store.js        # Reactive store
│   ├── types/                   # TypeScript type definitions
│   │   ├── models.ts           # Data model types
│   │   ├── api.ts              # API response types
│   │   └── store.ts            # Store types
│   ├── utils/                   # Utility functions
│   ├── App.vue                  # Root component
│   ├── main.js                  # App entry point
│   └── style.css               # Global styles
│
├── backend/                      # Express.js API server
│   ├── src/                     # Source files (after restructure)
│   │   ├── models/             # Mongoose models
│   │   │   ├── Account.js
│   │   │   ├── Category.js
│   │   │   ├── MonthlyEntry.js
│   │   │   └── User.js
│   │   ├── routes/             # API routes
│   │   │   ├── accounts.js
│   │   │   ├── categories.js
│   │   │   ├── entries.js
│   │   │   └── auth.js
│   │   ├── middleware/         # Express middleware
│   │   │   └── auth.js
│   │   ├── types/              # TypeScript types
│   │   └── server.js           # Main server file
│   ├── healthcheck.js
│   ├── package.json
│   ├── Dockerfile
│   └── Dockerfile.dev
│
├── docs/                         # Documentation
├── mongo-init/                   # MongoDB initialization scripts
├── public/                       # Static assets
│
├── docker-compose.yml           # Production Docker config
├── docker-compose.dev.yml       # Development Docker config
├── Dockerfile.frontend          # Frontend Docker build
├── nginx.conf                   # Nginx config for production
├── Makefile                     # Docker management commands
├── package.json                 # Frontend dependencies
├── vite.config.js               # Vite build configuration
└── AGENTS.md                    # This file
```

## Data Models

### Account

```javascript
{
  _id: ObjectId,
  name: String,           // Required, e.g., "Savings Account"
  type: String,           // Required, enum: ['deposits', 'investments']
  categoryId: ObjectId,   // Reference to Category
  description: String,    // Optional
  createdAt: Date,
  updatedAt: Date
}
```

### Category

```javascript
{
  _id: ObjectId,
  name: String,           // Required, e.g., "Bank Accounts"
  type: String,           // Required, enum: ['deposits', 'investments']
  description: String,    // Optional
  createdAt: Date,
  updatedAt: Date
}
```

### MonthlyEntry

```javascript
{
  _id: ObjectId,
  accountId: ObjectId,    // Reference to Account
  month: String,          // Format: 'YYYY-MM', e.g., '2026-01'
  amount: Number,         // Balance amount
  createdAt: Date,
  updatedAt: Date
}
```

## Common Development Tasks

### Adding a New API Endpoint

1. Create or update route file in `backend/routes/`
2. Register route in `backend/server.js`
3. Add API method in `src/services/api.js`
4. Update store if needed in `src/store/api-store.js`

### Adding a New View

1. Create component in `src/views/`
2. Add route in `src/router/index.js`
3. Add navigation link in `src/components/NavBar.vue`

### Importing Data from Excel

1. Navigate to Import Data page
2. Upload XLSX file with columns: Account Name, Type, Category, Month (YYYY-MM), Amount
3. Review parsed data and confirm import

## Known Issues & Technical Debt

### Critical (Fixed ✅)

- [x] ~~No authentication/authorization~~ - JWT auth with refresh tokens implemented
- [x] ~~Hardcoded API URL in frontend~~ - Now uses `VITE_API_URL` environment variable
- [x] ~~No rate limiting~~ - Added express-rate-limit with 100 req/15min
- [x] ~~Database credentials in Docker Compose files~~ - Now uses environment variables

### High Priority (Fixed ✅)

- [x] ~~N+1 query problem in entries POST endpoint~~ - Fixed with batch fetch
- [x] ~~Orphaned data when deleting categories~~ - Now blocks deletion if accounts exist
- [x] ~~Missing MongoDB indexes~~ - Added indexes on MonthlyEntry (month, accountId)
- [x] ~~Duplicate store files~~ - Removed legacy index.js store

### Medium Priority (Fixed ✅)

- [x] ~~Chart.js memory leaks~~ - Added onUnmounted cleanup in Dashboard.vue
- [x] ~~No graceful shutdown handling~~ - Added SIGTERM/SIGINT handlers

### Remaining (Low Priority)

- [ ] Console.log statements in production - Consider using a logger
- [ ] Missing input sanitization - Consider adding express-validator
- [ ] Missing error boundaries - Add Vue error boundary component
- [x] ~~Using alert()/confirm() instead of modals~~ - ConfirmModal component created and used throughout

### Implemented Features

- [x] TypeScript configurations and type definitions
- [x] Testing framework (Vitest + Jest + Cypress)
- [x] Backend restructured to src/ directory
- [x] CORS configuration with allowed origins
- [x] Improved health check with DB status

## Makefile Commands

```bash
make dev          # Start development environment
make prod         # Start production environment
make down         # Stop all containers
make logs         # View all service logs
make health       # Check service health
make clean        # Clean up containers and images
make rebuild      # Rebuild and restart containers
```

## Testing

### Running Tests (after setup)

```bash
# Frontend unit tests
npm run test

# Frontend E2E tests
npm run test:e2e

# Backend tests
cd backend && npm run test
```

## Deployment Notes

1. Change all default passwords and secrets
2. Set `NODE_ENV=production`
3. Configure proper CORS origins
4. Enable HTTPS (via reverse proxy or load balancer)
5. Set up MongoDB authentication and backups
6. Configure rate limiting for production traffic

## Contributing

1. Create feature branch from `main`
2. Follow existing code patterns
3. Add tests for new functionality
4. Update documentation as needed
5. Submit PR for review
