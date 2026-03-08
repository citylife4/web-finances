const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { PORT, MONGODB_URI, isProduction } = require('./config');

const app = express();

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
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    const CategoryType = require('./models/CategoryType');
    const defaultTypes = [
      { name: 'deposits', displayName: 'Deposits', description: 'Savings, checking, and deposit accounts', color: '#4CAF50', icon: '💰', isSystem: true },
      { name: 'investments', displayName: 'Investments', description: 'Stocks, bonds, and investment accounts', color: '#2196F3', icon: '📈', isSystem: true }
    ];
    for (const type of defaultTypes) {
      await CategoryType.findOneAndUpdate({ name: type.name }, { $setOnInsert: type }, { upsert: true });
    }
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/entries', require('./routes/entries'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/category-types', require('./routes/category-types'));

app.get('/api/health', async (req, res) => {
  try {
    // Check MongoDB connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    res.json({ 
      status: 'OK', 
      message: 'Finance Tracker API is running',
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

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  
  server.close(() => {
    console.log('HTTP server closed.');
    
    mongoose.connection.close(false).then(() => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    }).catch((err) => {
      console.error('Error closing MongoDB connection:', err);
      process.exit(1);
    });
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
