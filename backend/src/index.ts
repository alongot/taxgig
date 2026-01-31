import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { testConnection } from './config/database';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: [
    config.urls.webApp,
    'http://localhost:3000',
    'http://localhost:8081', // React Native Metro bundler
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in development
if (config.nodeEnv === 'development') {
  app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Side Hustle Tax & Income Tracker API',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.warn('Warning: Database connection failed. Some features may not work.');
    }

    app.listen(config.port, () => {
      console.log(`
========================================
  Side Hustle Tax Tracker API
========================================
  Environment: ${config.nodeEnv}
  Port: ${config.port}
  Database: ${dbConnected ? 'Connected' : 'Not connected'}
  Sprint: 4 (Reports & Notifications)

  Endpoints:
  - Health Check: http://localhost:${config.port}/api/health
  - Auth: http://localhost:${config.port}/api/auth
  - Users: http://localhost:${config.port}/api/users
  - Accounts: http://localhost:${config.port}/api/accounts
  - Transactions: http://localhost:${config.port}/api/transactions
  - Expenses: http://localhost:${config.port}/api/expenses
  - Tax: http://localhost:${config.port}/api/tax
  - Reports: http://localhost:${config.port}/api/reports
  - Notifications: http://localhost:${config.port}/api/notifications
========================================
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

startServer();

export default app;
