const mongoose = require('mongoose');
const logger = require('./logger');

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;

/**
 * Connect to MongoDB with retry logic and connection pooling.
 * Retries up to MAX_RETRIES times with exponential backoff on startup failure.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    logger.error('MONGODB_URI is not defined in environment variables');
    process.exit(1);
  }

  const options = {
    maxPoolSize: parseInt(process.env.MONGO_POOL_SIZE, 10) || 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(uri, options);
      logger.info('MongoDB connected successfully', {
        host: mongoose.connection.host,
        name: mongoose.connection.name,
      });
      return;
    } catch (err) {
      logger.error(`MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed`, {
        error: err.message,
      });

      if (attempt === MAX_RETRIES) {
        logger.error('All MongoDB connection attempts exhausted — exiting');
        process.exit(1);
      }

      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
      logger.info(`Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

/**
 * Register graceful shutdown handlers.
 * Closes the Mongoose connection before process exit on SIGINT / SIGTERM.
 */
function registerShutdownHandlers() {
  const shutdown = async (signal) => {
    logger.info(`${signal} received — closing MongoDB connection`);
    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
    } catch (err) {
      logger.error('Error closing MongoDB connection', { error: err.message });
    }
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

// Log connection events
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error', { error: err.message });
});

module.exports = { connectDB, registerShutdownHandlers };
