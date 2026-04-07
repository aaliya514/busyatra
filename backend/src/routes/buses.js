const express = require('express');
const router = express.Router();
const busController = require('../controllers/busController');
const auth = require('../middleware/auth');

router.get('/',           busController.getAllBuses);
router.get('/nearby',     busController.getNearbyBuses);
router.get('/:id',        busController.getBusById);
router.get('/:id/location', busController.getBusLocation);
router.get('/:id/track',  busController.trackBus);

// Driver/IoT GPS update — FIXED path (frontend was calling /api/gps/:id)
router.put('/:id/location', auth, busController.updateBusLocation);

// Admin routes
router.post('/', auth, auth.requireRole('admin'), busController.createBus);
router.put('/:id', auth, auth.requireRole('admin'), busController.updateBus);
router.delete('/:id', auth, auth.requireRole('admin'), busController.deleteBus);

module.exports = router;
