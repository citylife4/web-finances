# Financial Account Tracker

A Vue.js application for tracking your financial accounts and monitoring wealth progression over time.

## Features

- **Account Management**: Add and organize deposit and investment accounts with categories
- **Monthly Entries**: Record account balances on a monthly basis
- **Dashboard**: Visualize your wealth progression with interactive charts
- **Database Support**: Choose between MongoDB or Oracle Autonomous Database
- **REST API**: Backend API built with Express.js with database abstraction layer

## Account Types & Categories

### Deposits
- Checking Account
- Savings Account
- Money Market
- Certificate of Deposit (CD)
- High Yield Savings

### Investments
- Stock Portfolio
- Mutual Funds
- ETFs
- Bonds
- 401(k)
- IRA
- Roth IRA
- Crypto
- Real Estate

## 🚀 Quick Start

### Option 1: Docker (Recommended)
```bash
# Development environment
make dev

# Production environment
make prod
```

### Option 2: Manual Setup

#### Prerequisites
- Node.js (v20.19.0 or higher recommended)
- npm
- MongoDB

#### Installation

1. Clone the repository
2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd backend
npm install
```

4. Start MongoDB service (or configure Oracle - see below)
5. Start the backend server:
```bash
cd backend
npm run dev
```

6. Start the frontend development server:
```bash
npm run dev
```

### 🗄️ Database Configuration

#### MongoDB (Default)
The application uses MongoDB by default. Follow the installation steps above.

#### Oracle Autonomous Database
To use Oracle Autonomous Database instead:

1. Set environment variable: `DB_TYPE=oracle`
2. Configure Oracle connection parameters in your `.env` file
3. Run the Oracle initialization script: `oracle-init/init.sql`

For detailed Oracle setup instructions, see [ORACLE.md](./ORACLE.md).

## 🐳 Docker Setup

This application includes complete Docker configuration for easy deployment:

- **Development**: Hot-reload enabled, volume mounts for live editing
- **Production**: Optimized builds, Nginx reverse proxy, health checks

### Quick Commands
```bash
make dev          # Start development environment
make prod         # Start production environment
make logs         # View all service logs
make health       # Check service health
make clean        # Clean up containers and images
```

For detailed Docker documentation, see [DOCKER.md](./DOCKER.md).

## 🌐 Application URLs

### Development
- **Frontend**: http://localhost:5173/
- **Backend API**: http://localhost:3001/api/
- **MongoDB**: localhost:27017

### Production (Docker)
- **Frontend**: http://localhost/
- **Backend API**: http://localhost:3001/api/

## 📖 Usage

1. **Add Accounts**: Go to "Manage Accounts" to add your deposit and investment accounts
2. **Monthly Entries**: Use "Monthly Entry" to record your account balances each month
3. **Dashboard**: View your financial progression and account breakdowns on the main dashboard

## 🏗️ Architecture

### Frontend
- **Vue.js 3** with Composition API
- **Vue Router 4** for navigation
- **Chart.js** for data visualization
- **Axios** for API requests
- **Vite** for build tooling

### Backend
- **Express.js** REST API server
- **Database Abstraction Layer** supporting multiple database types
- **MongoDB Support** with Mongoose ODM
- **Oracle Autonomous Database Support** with native Oracle driver
- **CORS** enabled for frontend communication
- **Environment-based configuration**

### Database
- **MongoDB**: Document-based storage with collections and indexes
- **Oracle Autonomous Database**: Relational database with tables and SQL queries
- **Database Adapter Pattern**: Seamless switching between database types
- **Schema validation** for data integrity
- **Optimized indexes** for performance
- **Schema validation** for data integrity

## 🔧 API Endpoints

### Accounts
- `GET /api/accounts` - Get all accounts
- `POST /api/accounts` - Create account
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account

### Monthly Entries
- `GET /api/entries` - Get all entries
- `POST /api/entries` - Create/update entries
- `GET /api/entries/month/:month` - Get entries for specific month
- `GET /api/entries/analytics/totals` - Get monthly totals for charts

## 🔒 Data Security

- **Local Development**: Data stored in local MongoDB instance
- **Docker Deployment**: Isolated containers with network security
- **No External Dependencies**: Your financial data stays within your infrastructure

## 🛠️ Development

### Project Structure
```
├── src/                    # Frontend Vue.js application
├── backend/               # Express.js API server
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   └── server.js         # Main server file
├── docker-compose.yml    # Production Docker config
├── docker-compose.dev.yml # Development Docker config
└── Makefile             # Docker management commands
```

### Environment Variables
See `backend/.env.development` and `backend/.env.production` for configuration options.

## 🤝 Contributing

This is a personal finance tracking tool. Feel free to fork and customize for your own needs.

## 📄 License

MIT License
