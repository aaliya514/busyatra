const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);
router.put('/password', auth, userController.changePassword);
router.post('/favorites/:routeId', auth, userController.addFavoriteRoute);
router.delete('/favorites/:routeId', auth, userController.removeFavoriteRoute);

module.exports = router;
