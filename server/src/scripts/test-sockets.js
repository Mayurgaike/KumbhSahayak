const { io } = require('socket.io-client');
const mongoose = require('mongoose');

// Connect to the backend socket server
const socket = io('http://localhost:5000');

socket.on('connect', async () => {
  console.log('Connected to server as AI Camera Simulator');

  // We need a valid Zone ID to test with.
  // We'll hardcode one if we don't query the DB, but it's better to fetch one.
  // For testing purposes, we can just fetch the first zone via HTTP or DB, 
  // but to keep this script simple we'll just connect to the DB directly.
  
  const { connectDB } = require('../config/db');
  const { Zone } = require('../models');
  require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
  
  await connectDB();
  const zone = await Zone.findOne();
  
  if (!zone) {
    console.error('No zones found in DB! Please run the seed script first.');
    process.exit(1);
  }

  const payload = {
    zoneId: zone._id,
    peopleCount: Math.floor(Math.random() * 5000) + 1500, // Large number
    densityLevel: 'high', // This triggers the alert!
    ts: new Date()
  };

  console.log(`\n🚨 Firing HIGH DENSITY alert for Zone: ${zone.name}`);
  console.log('Payload:', payload);

  socket.emit('crowd:update', payload);

  setTimeout(() => {
    console.log('\n✅ Event fired. Check your Admin Command Center browser tab!');
    process.exit(0);
  }, 2000);
});

socket.on('connect_error', (err) => {
  console.error('Connection error:', err.message);
  process.exit(1);
});
