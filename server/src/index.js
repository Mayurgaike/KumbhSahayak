/**
 * Server entry point — Express + MongoDB
 *
 * Module 0: MongoDB connection with retry + graceful shutdown
 * Module 1: Express server, auth routes, middleware stack
 */

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const http = require('http');
const logger = require('./config/logger');
const { connectDB, registerShutdownHandlers } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { initSockets } = require('./sockets');

// Routes
const authRoutes = require('./routes/auth.routes');
const healthRoutes = require('./routes/health.routes');
const zoneRoutes = require('./routes/zone.routes');
const userRoutes = require('./routes/user.routes');
const familyRoutes = require('./routes/family.routes');
const scanRoutes = require('./routes/scan.routes');
const caseRoutes = require('./routes/case.routes');
const sosRoutes = require('./routes/sos.routes');
const volunteerRoutes = require('./routes/volunteer.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const path = require('path');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;

// --- Global middleware ---

// Security headers
app.use(helmet());

// CORS (permissive in dev — lock down in production)
app.use(cors());

// JSON body parser
app.use(express.json({ limit: '1mb' }));

// Request logger (all incoming requests)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode}`, {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
    });
  });
  next();
});

// --- Routes ---

// Public routes (no auth)
app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
app.use(express.static(path.join(__dirname, '../public')));

// Protected routes (require auth)
app.use('/api/zones', zoneRoutes);
app.use('/api/users', userRoutes);
app.use('/api/family-members', familyRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/lost-person-cases', caseRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 handler — must be after all routes, before error handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
});

// Central error handler — must be last
app.use(errorHandler);

// --- Server startup ---

// Register shutdown handlers early (closes DB connection on SIGINT/SIGTERM)
registerShutdownHandlers();

async function start() {
  logger.info('Starting server...');

  // Connect to MongoDB
  await connectDB();

  // Start HTTP server + WebSockets
  const httpServer = http.createServer(app);
  initSockets(httpServer);
  
  const server = httpServer.listen(PORT, () => {
    logger.info(`Server listening on port ${PORT}`, { port: PORT });
  });

  // Handle server errors
  server.on('error', (err) => {
    logger.error('Server error', { error: err.message });
    process.exit(1);
  });
}

start().catch((err) => {
  logger.error('Server startup failed', { error: err.message, stack: err.stack });
  process.exit(1);
});

module.exports = app;
