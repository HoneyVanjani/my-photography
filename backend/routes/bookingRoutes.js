const express = require('express');
const router = express.Router();
const { createBooking, getMyBookings, getAllBookings, updateBookingStatus } = require('../controllers/bookingController');
const { protect, admin } = require('../middleware/authMiddleware');

// Client routes
router.route('/')
  .post(createBooking); // Create a booking (protected)

router.route('/mybookings')
  .get(protect, getMyBookings); // Get bookings for the authenticated user

  
// Admin routes
router.route('/')
  .get(protect, admin, getAllBookings); // Get all bookings (admin only)

router.route('/:id/status')
  .put(protect, admin, updateBookingStatus); // Update booking status (admin only)

module.exports = router;