const User = require('../models/User');
const bcrypt = require('bcryptjs');

// GET /api/user/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('favoriteRoutes', 'routeNumber name color');
    res.json({ data: user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
};

// PUT /api/user/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone },
      { new: true }
    ).populate('favoriteRoutes', 'routeNumber name color');
    res.json({ data: user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/user/password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// POST /api/user/favorites/:routeId
exports.addFavoriteRoute = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { favoriteRoutes: req.params.routeId }
    });
    res.json({ message: 'Route added to favourites' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add favourite' });
  }
};

// DELETE /api/user/favorites/:routeId
exports.removeFavoriteRoute = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { favoriteRoutes: req.params.routeId }
    });
    res.json({ message: 'Route removed from favourites' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove favourite' });
  }
};
