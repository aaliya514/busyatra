const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const auth = require('../middleware/auth');

router.post('/', auth, tripController.createTrip);
router.get('/user', auth, tripController.getUserTrips);
router.get('/:id', auth, tripController.getTripById);
router.put('/:id/status', auth, tripController.updateTripStatus);
router.delete('/:id', auth, tripController.cancelTrip);

module.exports = router;
