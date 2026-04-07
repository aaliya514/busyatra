const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title:   { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['bus_arrival', 'delay', 'route_change', 'system'],
    default: 'system'
  },
  isRead:  { type: Boolean, default: false },
  busId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' },
  routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
