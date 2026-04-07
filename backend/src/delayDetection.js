// Delay detection — runs every 60 seconds
// If a bus has speed=0 for 5+ minutes, it sends SMS alerts to passengers
// who have an ongoing trip on that bus

const Bus          = require('./models/Bus');
const Trip         = require('./models/Trip');
const User         = require('./models/User');
const Notification = require('./models/Notification');
const { sendDelayAlert } = require('./smsService');

// Track how long each bus has been stationary
// { busId: { firstStationaryAt: Date, alerted: bool } }
const stationaryTracker = {};

const DELAY_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

async function checkDelays(io) {
  try {
    const buses = await Bus.find({ status: 'active' })
      .populate('route', 'name routeNumber');

    const now = Date.now();

    for (const bus of buses) {
      const id = bus._id.toString();

      if (bus.speed <= 2) {
        // Bus is stationary
        if (!stationaryTracker[id]) {
          stationaryTracker[id] = { firstStationaryAt: now, alerted: false };
        }

        const stationaryMs = now - stationaryTracker[id].firstStationaryAt;
        const minutesDelayed = Math.floor(stationaryMs / 60000);

        // Alert once after threshold
        if (stationaryMs >= DELAY_THRESHOLD_MS && !stationaryTracker[id].alerted) {
          stationaryTracker[id].alerted = true;
          console.log(`[Delay] Bus ${bus.busNumber} stationary for ${minutesDelayed} mins`);

          await notifyPassengersOnBus(bus, minutesDelayed, io);
        }
      } else {
        // Bus is moving — clear tracker and reset alert
        if (stationaryTracker[id]) {
          delete stationaryTracker[id];
        }
      }
    }
  } catch (err) {
    console.error('[Delay detection error]', err.message);
  }
}

async function notifyPassengersOnBus(bus, minutesDelayed, io) {
  try {
    // Find all ongoing trips for this bus
    const trips = await Trip.find({
      bus: bus._id,
      status: 'ongoing'
    }).populate('passenger');

    const routeName = bus.route?.name || 'Unknown Route';
    const title   = `Bus Delayed — ${bus.busNumber}`;
    const message = `Bus ${bus.busNumber} on ${routeName} is stuck near ${bus.currentStop || 'en route'}. Delay: ~${minutesDelayed} min.`;

    for (const trip of trips) {
      const passenger = trip.passenger;
      if (!passenger) continue;

      // Create in-app notification
      await Notification.create({
        user:    passenger._id,
        title,
        message,
        type:    'delay',
        busId:   bus._id,
        routeId: bus.route?._id
      });

      // Push via socket.io for instant in-app alert
      if (io) {
        io.emit(`notification_${passenger._id}`, { title, message, type: 'delay' });
      }

      // Send SMS if passenger has a phone number
      if (passenger.phone) {
        await sendDelayAlert(passenger.phone, bus.busNumber, routeName, minutesDelayed);
      }
    }

    console.log(`[Delay] Notified ${trips.length} passenger(s) on bus ${bus.busNumber}`);
  } catch (err) {
    console.error('[Delay notify error]', err.message);
  }
}

module.exports = { checkDelays };
