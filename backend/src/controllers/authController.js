const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRES_IN || '7d'
});

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Only allow user or driver from public registration; admin must be seeded
    const allowedRoles = ['user', 'driver'];
    const assignedRole = allowedRoles.includes(role) ? role : 'user';

    const user = await User.create({ name, email, password, phone, role: assignedRole });

    const token = signToken(user._id);
    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Registration failed' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    const token = signToken(user._id);
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed' });
  }
};

// GET /api/auth/verify
exports.verifyToken = async (req, res) => {
  try {
    // req.user is set by auth middleware
    res.json({
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Verification failed' });
  }
};

// POST /api/auth/logout  (stateless JWT — just acknowledge)
exports.logout = (req, res) => {
  res.json({ message: 'Logged out successfully' });
};
