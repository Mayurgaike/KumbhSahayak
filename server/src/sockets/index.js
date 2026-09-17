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
          io.to(`admin:zone_${zoneId}`).emit('alert:zone', {
            zoneId,
            message: 'High density threshold crossed!',
            peopleCount,
            timestamp: ts || new Date()
          });

          // Phase 2: Dispatch Twilio SMS/WhatsApp to Zone Admin and Superadmins
          const { User, Zone } = require('../models');
          const { sendDensityAlert } = require('../services/twilioClient');
          const zone = await Zone.findById(zoneId);
          if (zone) {
            // Find Superadmins and the Zone Admin
            const officials = await User.find({
              $or: [
                { role: 'superadmin' },
                { role: 'admin', zoneId }
              ]
            }).select('phone');
            
            officials.forEach(off => sendDensityAlert(off.phone, zone.name, peopleCount));
          }
        }
      } catch (err) {
        logger.error('Error handling crowd:update', { error: err.message });
      }
    });

    // Handle authentication/room joining for AI service
    socket.on('join:ai-service', () => {
      socket.join('ai-service');
      logger.info('AI Service connected and joined its room', { socketId: socket.id });
    });

    // Handle authentication/room joining for admins/volunteers
    // Clients will emit 'join:zone' with their zoneId and department after authenticating
    socket.on('join:zone', (payload) => {
      const { zoneId, role, department } = payload;
      if (zoneId && role) {
        socket.join(`${role}:zone_${zoneId}`);
        if (department) {
          socket.join(`${role}:zone_${zoneId}:${department}`);
        }
        logger.info(`${role} joined zone room`, { socketId: socket.id, zoneId, department });
      }
    });

    // Handle authentication/room joining for superadmins
    socket.on('join:superadmin', () => {
      socket.join('superadmin');
      logger.info('Superadmin joined global room', { socketId: socket.id });
    });

    // Handle authentication/room joining for standard users (for raising cases)
    socket.on('join:user', (payload) => {
      const { userId } = payload;
      if (userId) {
        socket.join(`user:${userId}`);
        logger.info('User joined personal room', { socketId: socket.id, userId });
      }
    });

    // Handle match_found from AI service
    socket.on('match_found', async (payload) => {
      try {
        const { caseId, zoneId, confidence, ts } = payload;
        
        const { LostPersonCase } = require('../models');
        const lostCase = await LostPersonCase.findById(caseId);
        
        if (lostCase && lostCase.status === 'open') {
          // Update case with match info
          lostCase.matchedZone = zoneId;
          lostCase.matchedAt = ts || new Date();
          await lostCase.save();

          // Alert nearest admins/volunteers and the case raiser
          const alertPayload = {
            caseId,
            zoneId,
            confidence,
            timestamp: ts || new Date(),
            message: 'Potential face match detected!'
          };

          io.to(`admin:zone_${zoneId}`).emit('alert:match', alertPayload);
          io.to(`volunteer:zone_${zoneId}`).emit('alert:match', alertPayload);
          io.to(`user:${lostCase.raisedBy.toString()}`).emit('alert:match', alertPayload);

          logger.info('Face match detected and alerts dispatched', { caseId, zoneId });
        }
      } catch (err) {
        logger.error('Error handling match_found', { error: err.message });
      }
    });

    // Handle two-way chat notifications (Admin <-> Volunteer)
    socket.on('chat:message', (payload) => {
      try {
        const { zoneId, toRole, message, senderName } = payload;
        // Broadcast to the target role's zone room
        const targetRoom = `${toRole}:zone_${zoneId}`;
        io.to(targetRoom).emit('chat:message', {
          senderName,
          message,
          timestamp: new Date()
        });
        logger.info('Chat message dispatched', { zoneId, toRole, senderName });
      } catch (err) {
        logger.error('Error handling chat:message', { error: err.message });
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
