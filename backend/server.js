const express = require('express');
const cors = require('cors');
const DatabaseFactory = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
// Allow larger request bodies for import operations (adjust as needed)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database connection
let dbAdapter;

async function initializeDatabase() {
  try {
    dbAdapter = await DatabaseFactory.createAdapter();
    
    // Make adapter available to routes even before connection
    app.locals.db = dbAdapter;
    
    await dbAdapter.connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection error:', error);
    console.log('Server will continue running without database connection');
    
    // Create a mock adapter for testing if connection fails
    if (!app.locals.db) {
      app.locals.db = {
        getAccounts: async () => [],
        createAccount: async () => ({ _id: 'mock', message: 'Database not connected' }),
        updateAccount: async () => null,
        deleteAccount: async () => null,
        getEntries: async () => [],
        getEntriesByMonth: async () => [],
        createOrUpdateEntry: async () => ({ _id: 'mock', message: 'Database not connected' }),
        deleteEntry: async () => null,
        getMonthlyTotals: async () => []
      };
    }
  }
}

// Routes
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/entries', require('./routes/entries'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Finance Tracker API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Initialize database and start server
initializeDatabase().then(() => {
  console.log('Database initialization completed');
}).catch((error) => {
  console.error('Failed to initialize database:', error);
  console.log('Server will continue running in mock mode');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  if (dbAdapter) {
    await dbAdapter.disconnect();
  }
  process.exit(0);
});
