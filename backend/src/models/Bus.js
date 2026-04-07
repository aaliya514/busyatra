const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  busNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route'
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  busType: {
    type: String,
    enum: ['microbus', 'minibus', 'bus', 'tempo'],
    default: 'microbus'
  },
  capacity: { type: Number, default: 15 },
  currentPassengers: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  // GPS location as GeoJSON point
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number] // [longitude, latitude]
  },
  speed: { type: Number, default: 0 },       // km/h
  heading: { type: Number, default: 0 },     // degrees
  currentStop: { type: String, default: '' },
  nextStop:    { type: String, default: '' },
  lastUpdated: { type: Date, default: Date.now },
  // IoT mode: true = real GPS device / phone; false = simulation
  iotMode: { type: Boolean, default: false },
  // Simulation state
  simIndex:    { type: Number, default: 0 },
  simForward:  { type: Boolean, default: true }
}, { timestamps: true });

busSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Bus', busSchema);
