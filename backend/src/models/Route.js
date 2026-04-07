const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number] // [longitude, latitude]
  },
  order: { type: Number, required: true },
  estimatedTime: Number // minutes from start
});

const routeSchema = new mongoose.Schema({
  routeNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  startPoint: { type: String, required: true },
  endPoint:   { type: String, required: true },
  stops: [stopSchema],
  totalDistance: { type: Number, default: 0 }, // km
  estimatedDuration: { type: Number, default: 0 }, // minutes
  baseFare: { type: Number, default: 20 }, // NPR
  color: { type: String, default: '#3B82F6' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

routeSchema.index({ 'stops.location': '2dsphere' });

module.exports = mongoose.model('Route', routeSchema);
