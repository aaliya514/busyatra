const Trip = require('../models/Trip');

// POST /api/trips
exports.createTrip = async (req, res) => {
  try {
    const trip = await Trip.create({ ...req.body, passenger: req.user._id });
    res.status(201).json({ data: trip });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET /api/trips/user
exports.getUserTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ passenger: req.user._id })
      .populate('bus', 'busNumber')
      .populate('route', 'routeNumber name color')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ data: trips });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch trips' });
  }
};

// GET /api/trips/:id
exports.getTripById = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, passenger: req.user._id })
      .populate('bus')
      .populate('route');
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json({ data: trip });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch trip' });
  }
};

// PUT /api/trips/:id/status
exports.updateTripStatus = async (req, res) => {
  try {
    const trip = await Trip.findOneAndUpdate(
      { _id: req.params.id, passenger: req.user._id },
      { status: req.body.status, ...(req.body.status === 'completed' ? { endTime: new Date() } : {}) },
      { new: true }
    );
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json({ data: trip });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/trips/:id
exports.cancelTrip = async (req, res) => {
  try {
    await Trip.findOneAndUpdate(
      { _id: req.params.id, passenger: req.user._id },
      { status: 'cancelled' }
    );
    res.json({ message: 'Trip cancelled' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to cancel trip' });
  }
};
