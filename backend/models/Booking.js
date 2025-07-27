const mongoose = require('mongoose');

const bookingSchema = mongoose.Schema({
  user: { // The client who made the booking
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: 'User',
  },
  service: { // The photography service booked
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Service',
  },
  photographer: { // Optional: If you have multiple photographers
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Could be another User marked as isAdmin/isPhotographer
    default: null, // No specific photographer assigned initially
  },
  bookingDate: { // Date of the session
    type: Date,
    required: true,
  },
  startTime: { // Start time of the session (e.g., '10:00 AM')
    type: String,
    required: true,
  },
  endTime: { // End time of the session (e.g., '12:00 PM')
    type: String,
    required: true,
  },
  occasion: { // Type of occasion (e.g., Birthday, Anniversary)
    type: String,
    required: true,
  },
  notes: { // Any special requests from the user
    type: String,
  },
  status: { // Status of the booking
    type: String,
    enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed'],
    default: 'Pending',
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  // You might add fields like: paymentStatus, paymentId, location, etc.
}, {
  timestamps: true,
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;