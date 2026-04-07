// GPS simulation engine — moves buses along their route stops
// Only runs for buses where iotMode = false

const Bus = require('./models/Bus');
const Route = require('./models/Route');

// Interpolate a point between two GPS coords
function interpolate(from, to, t) {
  return {
    lat: from.lat + (to.lat - from.lat) * t,
    lng: from.lng + (to.lng - from.lng) * t
  };
}

function haversineKm(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function bearing(from, to) {
  const dLng = (to.lng - from.lng) * Math.PI / 180;
  const lat1 = from.lat * Math.PI / 180;
  const lat2 = to.lat * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
}

// Step each simulated bus one tick forward along its route
async function tickSimulation(io) {
  try {
    const buses = await Bus.find({ status: 'active', iotMode: false })
      .populate('route');

    for (const bus of buses) {
      const route = bus.route;
      if (!route || !route.stops || route.stops.length < 2) continue;

      const stops = route.stops
        .filter(s => s.location && s.location.coordinates && s.location.coordinates.length === 2)
        .sort((a, b) => a.order - b.order);

      if (stops.length < 2) continue;

      let idx = Math.max(0, Math.min(bus.simIndex || 0, stops.length - 2));
      const fromStop = stops[idx];
      const toStop   = stops[idx + 1];

      const from = { lat: fromStop.location.coordinates[1], lng: fromStop.location.coordinates[0] };
      const to   = { lat: toStop.location.coordinates[1],   lng: toStop.location.coordinates[0] };

      // Move ~15% of the segment per tick (tick runs every 3s)
      const progress = Math.random() * 0.15 + 0.10;
      const pos = interpolate(from, to, progress);

      // Randomise speed between 15-40 km/h to simulate traffic
      const speed = Math.round(15 + Math.random() * 25);
      const head  = Math.round(bearing(from, to));

      // Advance segment index
      let nextIdx = idx + 1;
      if (nextIdx >= stops.length - 1) {
        nextIdx = bus.simForward ? 0 : stops.length - 2;
      }

      await Bus.findByIdAndUpdate(bus._id, {
        location: { type: 'Point', coordinates: [pos.lng, pos.lat] },
        speed,
        heading: head,
        currentStop: fromStop.name,
        nextStop:    toStop.name,
        lastUpdated: new Date(),
        simIndex: nextIdx
      });

      if (io) {
        io.emit('bus_location_update', {
          busId:       bus._id,
          busNumber:   bus.busNumber,
          location:    { latitude: pos.lat, longitude: pos.lng },
          speed,
          heading: head,
          currentStop: fromStop.name,
          nextStop:    toStop.name,
          lastUpdated: new Date(),
          routeColor:  route.color
        });
      }
    }
  } catch (err) {
    console.error('Simulation error:', err.message);
  }
}

module.exports = { tickSimulation };
