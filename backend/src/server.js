const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { PORT, MONGODB_URI, isProduction } = require('./config');

const app = express();
const MONGODB_RETRY_DELAY_MS = 5000;
const MONGODB_SERVER_SELECTION_TIMEOUT_MS = 5000;

let server;
let isShuttingDown = false;

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 300 : 500,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all requests
app.use(limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 10 : 50,
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS
const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',') 
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS policy violation'), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// MongoDB
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const seedDefaultCategoryTypes = async () => {
  const CategoryType = require('./models/CategoryType');
  const defaultTypes = [
    { name: 'deposits', displayName: 'Deposits', description: 'Savings, checking, and deposit accounts', color: '#4CAF50', icon: '💰', isSystem: true },
    { name: 'investments', displayName: 'Investments', description: 'Stocks, bonds, and investment accounts', color: '#2196F3', icon: '📈', isSystem: true }
  ];

  for (const type of defaultTypes) {
    await CategoryType.findOneAndUpdate({ name: type.name }, { $setOnInsert: type }, { upsert: true });
  }
};

const connectToMongo = async () => {
  let attempt = 0;

  while (!isShuttingDown) {
    try {
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: MONGODB_SERVER_SELECTION_TIMEOUT_MS
      });

      console.log('Connected to MongoDB');
      await seedDefaultCategoryTypes();
      return;
    } catch (error) {
      attempt += 1;
      console.error(`MongoDB connection attempt ${attempt} failed:`, error);

      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }

      if (!isShuttingDown) {
        await delay(MONGODB_RETRY_DELAY_MS);
      }
    }
  }
};

// Routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/entries', require('./routes/entries'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/category-types', require('./routes/category-types'));

app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const isDatabaseConnected = dbStatus === 'connected';
    
    res.status(isDatabaseConnected ? 200 : 503).json({ 
      status: isDatabaseConnected ? 'OK' : 'ERROR', 
      message: isDatabaseConnected ? 'Finance Tracker API is running' : 'Database connection is not ready',
      database: dbStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'ERROR', 
      message: 'Service unhealthy',
      error: error.message 
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: isProduction ? 'Internal server error' : err.message 
  });
});

const startServer = async () => {
  try {
    await connectToMongo();

    if (isShuttingDown) {
      return;
    }

    server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = (signal) => {
  isShuttingDown = true;
  console.log(`\n${signal} received. Shutting down gracefully...`);

  const forceShutdownTimer = setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);

  const closeMongoConnection = async () => {
    if (mongoose.connection.readyState === 0) {
      return;
    }

    await mongoose.connection.close(false);
    console.log('MongoDB connection closed.');
  };

  const finishShutdown = async () => {
    try {
      await closeMongoConnection();
      clearTimeout(forceShutdownTimer);
      process.exit(0);
    } catch (err) {
      console.error('Error closing MongoDB connection:', err);
      clearTimeout(forceShutdownTimer);
      process.exit(1);
    }
  };
  
  if (server) {
    server.close(() => {
      console.log('HTTP server closed.');
      finishShutdown();
    });
    return;
  }

  finishShutdown();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();
