const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  passenger: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus'
  },
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route'
  },
  startStop:  { type: String, default: '' },
  endStop:    { type: String, default: '' },
  startTime:  { type: Date, default: Date.now },
  endTime:    { type: Date },
  fare:       { type: Number, default: 0 },
  distance:   { type: Number, default: 0 }, // km
  status: {
    type: String,
    enum: ['planned', 'ongoing', 'completed', 'cancelled'],
    default: 'planned'
  },
  rating: { type: Number, min: 1, max: 5 }
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);
