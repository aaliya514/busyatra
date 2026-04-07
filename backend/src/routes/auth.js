const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login',    authController.login);
router.post('/logout',   authController.logout);
router.get('/verify',    auth, authController.verifyToken);

module.exports = router;
