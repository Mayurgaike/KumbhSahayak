/**
 * Seed script — DEV ONLY
 *
 * Creates test data for local development:
 * - 3 zones with boundary polygons and facilities
 * - 1 superadmin
 * - 3 zone admins (one per zone)
 * - 1 test visitor
 *
 * Usage: npm run seed
 * Guard: refuses to run when NODE_ENV=production
 */

require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const logger = require('../config/logger');
const { connectDB } = require('../config/db');
const { User, Zone } = require('../models');

const SALT_ROUNDS = 10;

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    logger.error('Seed script cannot run in production — aborting');
    process.exit(1);
  }

  logger.info('Starting seed script (dev only)');

  await connectDB();

  // Clear existing data (idempotent)
  logger.info('Clearing existing seed data...');
  await Promise.all([
    User.deleteMany({}),
    Zone.deleteMany({}),
  ]);

  // Hash a shared dev password
  const devPasswordHash = await bcrypt.hash('DevPassword123!', SALT_ROUNDS);

  // Create superadmin
  const superadmin = await User.create({
    role: 'superadmin',
    name: 'Super Admin',
    phone: '+919999000001',
    email: 'superadmin@kumbh-dev.local',
    passwordHash: devPasswordHash,
    zoneId: null,
  });
  logger.info('Created superadmin', { id: superadmin._id, name: superadmin.name });

  // Create zone admins
  const adminData = [
    { name: 'Admin — Main Gate', phone: '+919999000002', email: 'admin.maingate@kumbh-dev.local' },
    { name: 'Admin — River Bank', phone: '+919999000003', email: 'admin.riverbank@kumbh-dev.local' },
    { name: 'Admin — Temple Area', phone: '+919999000004', email: 'admin.templearea@kumbh-dev.local' },
  ];

  const admins = await User.insertMany(
    adminData.map((a) => ({
      role: 'admin',
      name: a.name,
      phone: a.phone,
      email: a.email,
      passwordHash: devPasswordHash,
      zoneId: null, // updated after zones are created
    }))
  );
  logger.info(`Created ${admins.length} zone admins`);

  // Create zones (Nashik Kumbh Mela area — approximate coordinates)
  const zoneData = [
    {
      name: 'Zone A — Main Gate',
      boundary: {
        type: 'Polygon',
        coordinates: [[
          [73.7800, 19.9975],
          [73.7850, 19.9975],
          [73.7850, 20.0000],
          [73.7800, 20.0000],
          [73.7800, 19.9975],
        ]],
      },
      zoneAdminId: admins[0]._id,
      facilities: [
        {
          type: 'exit',
          name: 'Main entrance/exit',
          location: { type: 'Point', coordinates: [73.7825, 19.9980] },
        },
        {
          type: 'help_desk',
          name: 'Information desk',
          location: { type: 'Point', coordinates: [73.7830, 19.9985] },
        },
      ],
    },
    {
      name: 'Zone B — River Bank',
      boundary: {
        type: 'Polygon',
        coordinates: [[
          [73.7850, 19.9975],
          [73.7900, 19.9975],
          [73.7900, 20.0000],
          [73.7850, 20.0000],
          [73.7850, 19.9975],
        ]],
      },
      zoneAdminId: admins[1]._id,
      facilities: [
        {
          type: 'medical_camp',
          name: 'River bank medical camp',
          location: { type: 'Point', coordinates: [73.7870, 19.9990] },
        },
        {
          type: 'exit',
          name: 'River bank exit',
          location: { type: 'Point', coordinates: [73.7895, 19.9980] },
        },
      ],
    },
    {
      name: 'Zone C — Temple Area',
      boundary: {
        type: 'Polygon',
        coordinates: [[
          [73.7900, 19.9975],
          [73.7950, 19.9975],
          [73.7950, 20.0000],
          [73.7900, 20.0000],
          [73.7900, 19.9975],
        ]],
      },
      zoneAdminId: admins[2]._id,
      facilities: [
        {
          type: 'medical_camp',
          name: 'Temple area first aid',
          location: { type: 'Point', coordinates: [73.7920, 19.9985] },
        },
        {
          type: 'help_desk',
          name: 'Temple area help desk',
          location: { type: 'Point', coordinates: [73.7940, 19.9990] },
        },
        {
          type: 'exit',
          name: 'Temple area south exit',
          location: { type: 'Point', coordinates: [73.7925, 19.9976] },
        },
      ],
    },
  ];

  const zones = await Zone.insertMany(zoneData);
  logger.info(`Created ${zones.length} zones`);

  // Back-link admins to their zones
  await Promise.all(
    admins.map((admin, i) =>
      User.findByIdAndUpdate(admin._id, { zoneId: zones[i]._id })
    )
  );
  logger.info('Linked admins to their zones');

  // Create a test visitor
  const visitor = await User.create({
    role: 'visitor',
    name: 'Test Visitor',
    phone: '+919999000005',
    email: 'visitor@kumbh-dev.local',
    passwordHash: devPasswordHash,
    zoneId: null,
  });
  logger.info('Created test visitor', { id: visitor._id, name: visitor.name });

  logger.info('Seed complete', {
    superadmin: 1,
    admins: admins.length,
    zones: zones.length,
    visitors: 1,
    devPassword: 'DevPassword123!',
  });

  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
}

seed().catch((err) => {
  logger.error('Seed script failed', { error: err.message, stack: err.stack });
  process.exit(1);
});
