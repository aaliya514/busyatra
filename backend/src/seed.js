require('dotenv').config();
const mongoose     = require('mongoose');
const User         = require('./models/User');
const Route        = require('./models/Route');
const Bus          = require('./models/Bus');
const Notification = require('./models/Notification');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  await Promise.all([
    User.deleteMany(),
    Route.deleteMany(),
    Bus.deleteMany(),
    Notification.deleteMany()
  ]);
  console.log('Cleared existing data');

  // ── Users ────────────────────────────────────────────────────
  const admin = await User.create({
    name: 'Admin BusYatra', email: 'admin@busyatra.com',
    password: 'admin123', role: 'admin'
  });
  const driver1 = await User.create({
    name: 'Ram Bahadur', email: 'driver1@busyatra.com',
    password: 'driver123', role: 'driver', phone: '9841000001'
  });
  const driver2 = await User.create({
    name: 'Sita Devi', email: 'driver2@busyatra.com',
    password: 'driver123', role: 'driver', phone: '9841000002'
  });
  const passenger = await User.create({
    name: 'Demo Passenger', email: 'passenger@busyatra.com',
    password: 'pass123', role: 'user', phone: '9841000003'
  });
  console.log('✓ Users seeded');

  // ── Routes ───────────────────────────────────────────────────
  const route1 = await Route.create({
    routeNumber: 'R01',
    name: 'Ratnapark - Kalanki',
    startPoint: 'Ratnapark', endPoint: 'Kalanki',
    color: '#3B82F6', baseFare: 25,
    totalDistance: 7.2, estimatedDuration: 35,
    stops: [
      { name: 'Ratnapark',    order: 0, estimatedTime: 0,  location: { type: 'Point', coordinates: [85.3135, 27.7041] } },
      { name: 'Bag Bazar',    order: 1, estimatedTime: 4,  location: { type: 'Point', coordinates: [85.3170, 27.7065] } },
      { name: 'Putali Sadak', order: 2, estimatedTime: 8,  location: { type: 'Point', coordinates: [85.3205, 27.7089] } },
      { name: 'Dilli Bazar',  order: 3, estimatedTime: 12, location: { type: 'Point', coordinates: [85.3244, 27.7101] } },
      { name: 'Naxal',        order: 4, estimatedTime: 16, location: { type: 'Point', coordinates: [85.3270, 27.7135] } },
      { name: 'Maharajgunj',  order: 5, estimatedTime: 21, location: { type: 'Point', coordinates: [85.3290, 27.7208] } },
      { name: 'Samakhusi',    order: 6, estimatedTime: 26, location: { type: 'Point', coordinates: [85.3210, 27.7302] } },
      { name: 'Balaju',       order: 7, estimatedTime: 30, location: { type: 'Point', coordinates: [85.3105, 27.7361] } },
      { name: 'Kalanki',      order: 8, estimatedTime: 35, location: { type: 'Point', coordinates: [85.2801, 27.6935] } },
    ]
  });

  const route2 = await Route.create({
    routeNumber: 'DEMO',
    name: 'Bag Bazar - Koteshwor',
    startPoint: 'Bag Bazar (Islington)', endPoint: 'Koteshwor',
    color: '#10B981', baseFare: 20,
    totalDistance: 5.4, estimatedDuration: 28,
    stops: [
      { name: 'Islington College, Bag Bazar', order: 0, estimatedTime: 0,  location: { type: 'Point', coordinates: [85.3178, 27.7068] } },
      { name: 'Dilli Bazar Petrol Pump',      order: 1, estimatedTime: 5,  location: { type: 'Point', coordinates: [85.3244, 27.7101] } },
      { name: 'Dilli Bazar Chowk',            order: 2, estimatedTime: 9,  location: { type: 'Point', coordinates: [85.3261, 27.7095] } },
      { name: 'Naxal Bhagawati',              order: 3, estimatedTime: 13, location: { type: 'Point', coordinates: [85.3276, 27.7132] } },
      { name: 'Chakrapath',                   order: 4, estimatedTime: 17, location: { type: 'Point', coordinates: [85.3301, 27.7180] } },
      { name: 'Maitidevi',                    order: 5, estimatedTime: 21, location: { type: 'Point', coordinates: [85.3340, 27.7050] } },
      { name: 'Koteshwor',                    order: 6, estimatedTime: 28, location: { type: 'Point', coordinates: [85.3560, 27.6867] } },
    ]
  });

  const route3 = await Route.create({
    routeNumber: 'R03',
    name: 'Kalanki - Suryabinayak',
    startPoint: 'Kalanki', endPoint: 'Suryabinayak',
    color: '#F59E0B', baseFare: 30,
    totalDistance: 9.1, estimatedDuration: 45,
    stops: [
      { name: 'Kalanki',      order: 0, estimatedTime: 0,  location: { type: 'Point', coordinates: [85.2801, 27.6935] } },
      { name: 'Kalimati',     order: 1, estimatedTime: 7,  location: { type: 'Point', coordinates: [85.2980, 27.6950] } },
      { name: 'Tripureshwor', order: 2, estimatedTime: 14, location: { type: 'Point', coordinates: [85.3102, 27.6958] } },
      { name: 'Ratnapark',    order: 3, estimatedTime: 20, location: { type: 'Point', coordinates: [85.3135, 27.7041] } },
      { name: 'New Baneshwor',order: 4, estimatedTime: 27, location: { type: 'Point', coordinates: [85.3382, 27.6920] } },
      { name: 'Koteshwor',    order: 5, estimatedTime: 33, location: { type: 'Point', coordinates: [85.3560, 27.6867] } },
      { name: 'Suryabinayak', order: 6, estimatedTime: 45, location: { type: 'Point', coordinates: [85.3851, 27.6607] } },
    ]
  });
  console.log('✓ Routes seeded');

  // ── Buses ────────────────────────────────────────────────────
  await Bus.create([
    {
      busNumber: 'BA 1 KHA 2021',
      route: route1._id, driver: driver1._id,
      busType: 'microbus', capacity: 15, status: 'active',
      location: { type: 'Point', coordinates: [85.3135, 27.7041] }, simIndex: 0
    },
    {
      busNumber: 'BA 2 KHA 3045',
      route: route1._id,
      busType: 'microbus', capacity: 15, status: 'active',
      location: { type: 'Point', coordinates: [85.3244, 27.7101] }, simIndex: 3
    },
    {
      busNumber: 'DEMO-001',
      route: route2._id, driver: driver2._id,
      busType: 'microbus', capacity: 12, status: 'active',
      location: { type: 'Point', coordinates: [85.3178, 27.7068] }, simIndex: 0,
      iotMode: false
    },
    {
      busNumber: 'BA 3 JA 1188',
      route: route3._id,
      busType: 'minibus', capacity: 25, status: 'active',
      location: { type: 'Point', coordinates: [85.3102, 27.6958] }, simIndex: 2
    },
  ]);
  console.log('✓ Buses seeded');

  // ── Seed notifications so the page is not empty ───────────────
  await Notification.create([
    {
      user: passenger._id,
      title: 'Welcome to BusYatra! 🚌',
      message: 'Track buses in real time across Kathmandu. Open the Live Map to see buses moving now.',
      type: 'system',
      isRead: false
    },
    {
      user: passenger._id,
      title: 'Route R01 is Live',
      message: 'Ratnapark–Kalanki route is now active with 2 buses. Expected wait time: ~8 minutes.',
      type: 'bus_arrival',
      isRead: false
    },
    {
      user: passenger._id,
      title: 'DEMO Route Active',
      message: 'Bus DEMO-001 is running on Bag Bazar–Koteshwor route. Next stop: Dilli Bazar.',
      type: 'bus_arrival',
      isRead: true
    },
  ]);
  // Also give admin a notification
  await Notification.create({
    user: admin._id,
    title: 'System Ready',
    message: 'BusYatra backend is running. 4 buses are active across 3 routes.',
    type: 'system',
    isRead: false
  });
  console.log('✓ Notifications seeded');

  console.log('\n=== Seed complete ===');
  console.log('Admin:     admin@busyatra.com     / admin123');
  console.log('Driver 1:  driver1@busyatra.com   / driver123');
  console.log('Driver 2:  driver2@busyatra.com   / driver123');
  console.log('Passenger: passenger@busyatra.com / pass123');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
