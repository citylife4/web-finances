<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Financial Account Tracker - Copilot Instructions

## Project Overview
A Vue.js financial account tracking application for monitoring wealth progression over time. The project includes a Vue 3 frontend with Vite, Express.js backend, and MongoDB database.

## Tech Stack

### Frontend
- **Vue.js 3** with Options API (not Composition API in views)
- **Vue Router 4** for navigation
- **Vite 7** for build tooling
- **Chart.js** with vue-chartjs for data visualization
- **Axios** for API requests
- **XLSX** for Excel file import/export
- **date-fns** for date manipulation

### Backend
- **Express.js 5** REST API
- **Mongoose** for MongoDB ODM
- **nodemon** for development hot-reload
- **dotenv** for environment configuration
- **CORS** enabled for frontend communication

### Database
- **MongoDB** with collections: accounts, categories, monthlyentries

## Project Structure
```
├── src/                      # Frontend Vue.js application
│   ├── components/          # Reusable Vue components
│   ├── views/               # Page-level Vue components
│   ├── router/              # Vue Router configuration
│   ├── services/            # API service layer (axios)
│   ├── store/               # State management
│   └── utils/               # Utility functions
├── backend/                  # Express.js API server
│   ├── models/              # Mongoose models (Account, Category, MonthlyEntry)
│   ├── routes/              # API routes (accounts, categories, entries)
│   └── server.js            # Main server file
├── docs/                     # Documentation
├── docker-compose.yml        # Production Docker config
├── docker-compose.dev.yml    # Development Docker config
└── Makefile                  # Docker management commands
```

## Development Commands

### Quick Start (Local Development)
```bash
# Frontend
npm install
npm run dev        # Starts on http://localhost:5173

# Backend (separate terminal)
cd backend
npm install
npm run dev        # Starts on http://localhost:3001
```

### Docker Development
```bash
make dev          # Start development environment
make prod         # Start production environment
make logs         # View all service logs
make health       # Check service health
make clean        # Clean up containers and images
```

## API Endpoints

### Accounts
- `GET /api/accounts` - Get all accounts
- `POST /api/accounts` - Create account
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:type` - Get by type (deposits/investments)
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Monthly Entries
- `GET /api/entries` - Get all entries
- `POST /api/entries` - Create/update entries
- `GET /api/entries/month/:month` - Get entries for specific month
- `GET /api/entries/analytics/totals` - Get monthly totals for charts

### Health
- `GET /api/health` - API health check

## Coding Guidelines

### Vue Components
- Use Options API in view components
- Use `<template>`, `<script>`, `<style>` order in SFCs
- Import store from `@/store` for state management
- Use the `api.js` service for all API calls

### Backend
- Use CommonJS require syntax (not ES modules)
- Handle errors with try/catch and return proper HTTP status codes
- Use Mongoose validation for data integrity

### Database
- Account types: 'deposits' or 'investments'
- Categories are linked to types
- MonthlyEntry uses format 'YYYY-MM' for month field

## Environment Variables

### Backend (.env)
```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/finance-tracker
NODE_ENV=development
```

## Common Tasks

### Adding a new API endpoint
1. Create route in `backend/routes/`
2. Register route in `backend/server.js`
3. Add API method in `src/services/api.js`
4. Update store if needed in `src/store/`

### Adding a new view
1. Create component in `src/views/`
2. Add route in `src/router/index.js`
3. Add navigation link in `src/components/NavBar.vue`

### Running tests
Currently no test suite configured. Consider adding:
- Jest for unit tests
- Cypress for E2E tests

## Prerequisites
- Node.js v20.19.0 or higher (recommended)
- npm
- MongoDB (local or Docker)
- Docker & Docker Compose (optional)
