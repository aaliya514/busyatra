const Route = require('../models/Route');
const Bus   = require('../models/Bus');

exports.getAllRoutes = async (req, res) => {
  try {
    const filter = {};
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    const routes = await Route.find(filter).sort({ routeNumber: 1 });
    res.json({ data: routes });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch routes' });
  }
};

exports.searchRoutes = async (req, res) => {
  try {
    const { from, to, query } = req.query;
    let filter = { isActive: true };
    if (query) {
      filter.$or = [
        { name:        { $regex: query, $options: 'i' } },
        { routeNumber: { $regex: query, $options: 'i' } },
        { startPoint:  { $regex: query, $options: 'i' } },
        { endPoint:    { $regex: query, $options: 'i' } },
        { 'stops.name':{ $regex: query, $options: 'i' } }
      ];
    }
    if (from) filter.startPoint = { $regex: from, $options: 'i' };
    if (to)   filter.endPoint   = { $regex: to,   $options: 'i' };
    const routes = await Route.find(filter).limit(20);
    res.json({ data: routes });
  } catch (err) {
    res.status(500).json({ message: 'Search failed' });
  }
};

exports.getRouteById = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) return res.status(404).json({ message: 'Route not found' });
    res.json({ data: route });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch route' });
  }
};

exports.getRouteLive = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) return res.status(404).json({ message: 'Route not found' });
    const buses = await Bus.find({ route: req.params.id, status: 'active' })
      .select('busNumber location speed heading currentStop nextStop lastUpdated iotMode');
    res.json({ data: { route, buses } });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch live route data' });
  }
};

// POST /api/routes/:id/calculate-fare
// Returns fields that match what FareCalculator.js expects:
// totalFare, distance, baseFare, farePerKm, from, to, stops
exports.calculateFare = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) return res.status(404).json({ message: 'Route not found' });

    const { fromStop, toStop } = req.body;

    // Nepal DoTM regulated rate
    const FARE_PER_KM = 2.2;
    const MIN_FARE    = 15;

    const sortedStops = [...route.stops].sort((a, b) => a.order - b.order);

    const fromIdx = fromStop
      ? sortedStops.findIndex(s => s.name.toLowerCase().includes(fromStop.toLowerCase()))
      : 0;
    const toIdx = toStop
      ? sortedStops.findIndex(s => s.name.toLowerCase().includes(toStop.toLowerCase()))
      : sortedStops.length - 1;

    const actualFrom = sortedStops[fromIdx >= 0 ? fromIdx : 0];
    const actualTo   = sortedStops[toIdx   >= 0 ? toIdx   : sortedStops.length - 1];

    // Estimate distance from estimatedTime difference (assume ~20 km/h avg)
    const timeDiff = Math.abs(
      (actualTo.estimatedTime   || 0) -
      (actualFrom.estimatedTime || 0)
    );
    const distanceKm = parseFloat(((timeDiff / 60) * 20).toFixed(1)) || 1;

    const distanceCharge = distanceKm * FARE_PER_KM;
    const totalFare = Math.max(MIN_FARE, Math.round(route.baseFare + distanceCharge));

    res.json({
      data: {
        from:       actualFrom.name,
        to:         actualTo.name,
        distance:   distanceKm,
        baseFare:   route.baseFare,
        farePerKm:  FARE_PER_KM,
        totalFare,
        stops:      Math.abs((toIdx >= 0 ? toIdx : sortedStops.length - 1) - (fromIdx >= 0 ? fromIdx : 0)),
        currency:   'NPR'
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Fare calculation failed' });
  }
};

exports.createRoute = async (req, res) => {
  try {
    const route = await Route.create(req.body);
    res.status(201).json({ data: route });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateRoute = async (req, res) => {
  try {
    const route = await Route.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!route) return res.status(404).json({ message: 'Route not found' });
    res.json({ data: route });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteRoute = async (req, res) => {
  try {
    await Route.findByIdAndDelete(req.params.id);
    res.json({ message: 'Route deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete route' });
  }
};
