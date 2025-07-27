const asyncHandler = require('express-async-handler');
const Booking = require('../models/Booking');
const Service = require('../models/Service');

// Helper to check for overlapping bookings (simplified)
const checkAvailability = async (serviceId, bookingDate, startTime, endTime) => {
  const startDateTime = new Date(`${bookingDate}T${startTime}`);
  const endDateTime = new Date(`${bookingDate}T${endTime}`);

  // Find bookings for the same service and date
  const existingBookings = await Booking.find({
    service: serviceId,
    bookingDate: {
      $gte: new Date(new Date(bookingDate).setHours(0, 0, 0, 0)),
      $lt: new Date(new Date(bookingDate).setHours(23, 59, 59, 999))
    },
    status: { $in: ['Pending', 'Confirmed'] } // Consider only pending/confirmed bookings
  });

  // Simple overlap check (needs to be more robust for real-world application)
  // This assumes time slots are discrete. For continuous bookings, more complex logic needed.
  for (let booking of existingBookings) {
    const existingStart = new Date(`${booking.bookingDate.toISOString().split('T')[0]}T${booking.startTime}`);
    const existingEnd = new Date(`${booking.bookingDate.toISOString().split('T')[0]}T${booking.endTime}`);

    // Check for overlap: [start, end)
    if (
      (startDateTime < existingEnd && endDateTime > existingStart)
    ) {
      return false; // Overlap found
    }
  }
  return true; // No overlap
};


// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private (requires authentication)
const createBooking = asyncHandler(async (req, res) => {
  const { serviceId, bookingDate, startTime, endTime, occasion, notes } = req.body;
  //const userId = req.user._id; // User ID from authenticated token

  
  if (!serviceId || !bookingDate || !startTime || !endTime || !occasion) {
    res.status(400);
    throw new Error('Please provide all required fields (service, date, time, occasion).');
  }

  const service = await Service.findById(serviceId);
  if (!service) {
    res.status(404);
    throw new Error('Service not found.');
  }

  // Ensure the booking date is not in the past
  const requestedDate = new Date(bookingDate);
  requestedDate.setHours(0,0,0,0); // Normalize to start of day
  const today = new Date();
  today.setHours(0,0,0,0); // Normalize to start of day

  if (requestedDate < today) {
    res.status(400);
    throw new Error('Cannot book for a past date.');
  }

  // Perform availability check
  const isAvailable = await checkAvailability(serviceId, bookingDate, startTime, endTime);
  if (!isAvailable) {
    res.status(409); // Conflict
    throw new Error('The selected time slot is already booked or unavailable.');
  }

  const totalPrice = service.price; // Simple pricing based on service

  const newBooking = new Booking({
    service: serviceId,
    bookingDate: new Date(bookingDate),
    startTime,
    endTime,
    occasion,
    notes,
    totalPrice,
    status: 'Pending',
  });

  const createdBooking = await newBooking.save();
  res.status(201).json({
    message: 'Booking request received successfully. It is currently pending confirmation.',
    booking: createdBooking
  });
});

// @desc    Get all bookings for the authenticated user
// @route   GET /api/bookings/mybookings
// @access  Private
const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate('service', 'name description price') // Populate service details
    .sort({ bookingDate: -1, startTime: -1 }); // Latest bookings first
  res.json(bookings);
});

// @desc    Get all bookings (Admin only)
// @route   GET /api/bookings
// @access  Private/Admin
const getAllBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({})
    .populate('user', 'name email') // Populate user details
    .populate('service', 'name price') // Populate service details
    .sort({ createdAt: -1 });
  res.json(bookings);
});

// @desc    Update booking status (Admin only)
// @route   PUT /api/bookings/:id/status
// @access  Private/Admin
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body; // Expects status: 'Confirmed', 'Cancelled', 'Completed'

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  if (!['Confirmed', 'Cancelled', 'Completed'].includes(status)) {
    res.status(400);
    throw new Error('Invalid booking status provided.');
  }

  booking.status = status;
  const updatedBooking = await booking.save();
  res.json(updatedBooking);
});


module.exports = {
  createBooking,
  getMyBookings,
  getAllBookings, // Admin
  updateBookingStatus, // Admin
};