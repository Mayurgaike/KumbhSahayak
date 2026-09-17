require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const logger = require('../config/logger');
const { connectDB } = require('../config/db');
const { User, Zone } = require('../models');

async function createVolunteer() {
  await connectDB();
  const devPasswordHash = await bcrypt.hash('DevPassword123!', 10);
  
  // Try to find the first zone to assign to the volunteer
  const zone = await Zone.findOne();

  const volunteer = await User.findOneAndUpdate(
    { phone: '+919999000006' },
    {
      role: 'volunteer',
      name: 'Test Volunteer',
      phone: '+919999000006',
      email: 'volunteer@kumbh-dev.local',
      passwordHash: devPasswordHash,
      zoneId: zone ? zone._id : null,
    },
    { upsert: true, new: true }
  );

  logger.info('Created test volunteer', { phone: volunteer.phone, password: 'DevPassword123!' });

  await mongoose.connection.close();
}

createVolunteer().catch(err => {
  console.error(err);
  process.exit(1);
});
