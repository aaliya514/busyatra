const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');
const auth = require('../middleware/auth');

router.get('/',            routeController.getAllRoutes);
router.get('/search',      routeController.searchRoutes);
router.get('/:id',         routeController.getRouteById);
router.get('/:id/live',    routeController.getRouteLive);
router.post('/:id/calculate-fare', routeController.calculateFare);

// Admin
router.post('/',    auth, auth.requireRole('admin'), routeController.createRoute);
router.put('/:id',  auth, auth.requireRole('admin'), routeController.updateRoute);
router.delete('/:id', auth, auth.requireRole('admin'), routeController.deleteRoute);

module.exports = router;
