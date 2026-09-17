const { Server } = require('socket.io');
const { CrowdLog } = require('../models');
const logger = require('../config/logger');

let io;

function initSockets(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*', // For MVP. Restrict in production.
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    logger.info('New socket connection', { socketId: socket.id });

    // AI Service sends crowd updates
    socket.on('crowd:update', async (payload) => {
      try {
        const { zoneId, peopleCount, densityLevel, ts } = payload;
        
        // 1. Store in DB
        await CrowdLog.create({
          zoneId,
          peopleCount,
          densityLevel,
          timestamp: ts || new Date()
        });

        // 2. Broadcast to all connected clients (unauthenticated per spec)
        io.emit('zone:status', {
          zoneId,
          peopleCount,
          densityLevel,
          timestamp: ts || new Date()
        });

        // 3. Fire alert to admins if high density
        if (densityLevel === 'high') {
          // Send to the specific zone's admin room
          // (Requires admins to join 'admin:zone_<zoneId>' room upon connection, which we will handle below)
          io.to(`admin:zone_${zoneId}`).emit('alert:zone', {
            zoneId,
            message: 'High density threshold crossed!',
            peopleCount,
            timestamp: ts || new Date()
          });
        }
      } catch (err) {
        logger.error('Error handling crowd:update', { error: err.message });
      }
    });

    // Handle authentication/room joining for admins
    // Clients will emit 'join:admin' with their zoneId after authenticating
    socket.on('join:admin', (payload) => {
      const { zoneId } = payload;
      if (zoneId) {
        socket.join(`admin:zone_${zoneId}`);
        logger.info('Admin joined zone room', { socketId: socket.id, zoneId });
      }
    });

    socket.on('disconnect', () => {
      logger.info('Socket disconnected', { socketId: socket.id });
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}

module.exports = {
  initSockets,
  getIO
};
