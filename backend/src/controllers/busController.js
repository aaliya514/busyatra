const Bus = require('../models/Bus');

// GET /api/buses
exports.getAllBuses = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const buses = await Bus.find(filter)
      .populate('route', 'routeNumber name startPoint endPoint color')
      .populate('driver', 'name phone')
      .sort({ busNumber: 1 });

    res.json({ data: buses });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch buses' });
  }
};

// GET /api/buses/nearby
exports.getNearbyBuses = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 2000 } = req.query;
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'latitude and longitude are required' });
    }

    const buses = await Bus.find({
      status: 'active',
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
          $maxDistance: parseInt(maxDistance)
        }
      }
    }).populate('route', 'routeNumber name color').limit(10);

    res.json({ data: buses });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch nearby buses' });
  }
};

// GET /api/buses/:id
exports.getBusById = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id)
      .populate('route')
      .populate('driver', 'name phone');
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    res.json({ data: bus });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch bus' });
  }
};

// GET /api/buses/:id/location
exports.getBusLocation = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id).select('location speed heading currentStop nextStop lastUpdated busNumber iotMode');
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    res.json({ data: bus });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch bus location' });
  }
};

// GET /api/buses/:id/track  — full tracking info with route
exports.trackBus = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id)
      .populate('route')
      .select('-simIndex -simForward');
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    res.json({ data: bus });
  } catch (err) {
    res.status(500).json({ message: 'Failed to track bus' });
  }
};

// PUT /api/buses/:id/location  — called by driver phone AND ESP32 IoT device
// This is the FIXED endpoint (was /api/gps/:id before which didn't exist)
exports.updateBusLocation = async (req, res) => {
  try {
    const { latitude, longitude, speed, heading } = req.body;
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'latitude and longitude required' });
    }

    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      {
        location: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
        speed:   parseFloat(speed) || 0,
        heading: parseFloat(heading) || 0,
        lastUpdated: new Date(),
        iotMode: true
      },
      { new: true }
    ).populate('route', 'routeNumber name stops color');

    if (!bus) return res.status(404).json({ message: 'Bus not found' });

    // Emit to socket.io so passengers see update in real time
    const io = req.app.get('io');
    if (io) {
      io.emit('bus_location_update', {
        busId:       bus._id,
        busNumber:   bus.busNumber,
        location:    { latitude, longitude },
        speed:       bus.speed,
        heading:     bus.heading,
        currentStop: bus.currentStop,
        nextStop:    bus.nextStop,
        lastUpdated: bus.lastUpdated
      });
    }

    res.json({ message: 'Location updated', data: bus });
  } catch (err) {
    console.error('GPS update error:', err);
    res.status(500).json({ message: 'Failed to update location' });
  }
};

// Admin: POST /api/buses  — create a bus
exports.createBus = async (req, res) => {
  try {
    const bus = await Bus.create(req.body);
    res.status(201).json({ data: bus });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Admin: PUT /api/buses/:id  — update bus info
exports.updateBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('route', 'routeNumber name color');
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    res.json({ data: bus });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Admin: DELETE /api/buses/:id
exports.deleteBus = async (req, res) => {
  try {
    await Bus.findByIdAndDelete(req.params.id);
    res.json({ message: 'Bus deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete bus' });
  }
};
