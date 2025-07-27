import { useState } from 'react';
import CalendarPicker from './CalendarPicker';
import SectionHeader from './SectionHeader';
import axiosClient from '../api/axiosClient'; // Keep this uncommented, it's used in handleSubmit

const BookingForm = () => {
    const occasionTypes = ['Birthday', 'Anniversary', 'Engagement', 'Family Gathering', 'Corporate', 'Other'];

    // --- STATIC SERVICES DATA (with REAL MongoDB _id values) ---
    // IMPORTANT: REPLACE THESE PLACEHOLDERS WITH THE ACTUAL _idS YOU COPIED FROM MONGODB ATLAS
    const services = [
        { _id: '6886297912080466b8ca9b67', name: 'Wedding Photography', price: 50000, duration: '8 Hours', durationMinutes: 480 },
        { _id: '6886298c12080466b8ca9b68', name: 'Portrait Session', price: 15000, duration: '2 Hours', durationMinutes: 120 },
        { _id: '6886299a12080466b8ca9b69', name: 'Event Coverage', price: 30000, duration: '4 Hours', durationMinutes: 240 },
        { _id: '688629a912080466b8ca9b6a', name: 'Commercial Shoot', price: 75000, duration: 'Full Day', durationMinutes: 480 },
    ];
    // --- END STATIC SERVICES DATA ---

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        selectedService: '',
        selectedDate: null,
        selectedTime: '',
        occasion: '',
        notes: '',
    });

    const [formErrors, setFormErrors] = useState({});
    const [formMessage, setFormMessage] = useState({ type: '', text: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleDateSelect = (date) => {
        setFormData((prevData) => ({ ...prevData, selectedDate: date }));
        setFormErrors((prevErrors) => ({ ...prevErrors, selectedDate: '' }));
    };

    const validateForm = () => {
        let errors = {};
        if (!formData.name) errors.name = 'Name is required';
        if (!formData.email) errors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email is invalid';
        if (!formData.phone) errors.phone = 'Phone number is required';
        if (!formData.selectedService) errors.selectedService = 'Please select a service';
        if (!formData.selectedDate) errors.selectedDate = 'Please select a date';
        if (!formData.selectedTime) errors.selectedTime = 'Please select a time slot';
        if (!formData.occasion) errors.occasion = 'Please select an occasion type';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormMessage({ type: '', text: '' }); // Clear message on new submit
        if (validateForm()) {
            try {
                const selectedServiceObj = services.find(s => s._id === formData.selectedService);
                if (!selectedServiceObj) {
                    setFormMessage({ type: 'error', text: 'Selected service not found.' });
                    return;
                }

                if (typeof selectedServiceObj.durationMinutes !== 'number' || isNaN(selectedServiceObj.durationMinutes)) {
                    setFormMessage({ type: 'error', text: 'Invalid service duration. Please select a valid service.' });
                    return;
                }

                const timeParts = formData.selectedTime.split(' ');
                const [hourStr, minuteStr] = timeParts[0].split(':');
                let hour = parseInt(hourStr, 10);
                const minute = parseInt(minuteStr, 10);

                if (timeParts.length > 1) { // Check for AM/PM if present
                    if (timeParts[1].toUpperCase() === 'PM' && hour < 12) {
                        hour += 12;
                    } else if (timeParts[1].toUpperCase() === 'AM' && hour === 12) { // Midnight (12 AM)
                        hour = 0;
                    }
                }

                const bookingDateTime = new Date(formData.selectedDate);
                bookingDateTime.setHours(hour, minute, 0, 0);

                const endTimeDate = new Date(bookingDateTime.getTime() + selectedServiceObj.durationMinutes * 60 * 1000);
                const endTime = `${String(endTimeDate.getHours()).padStart(2, '0')}:${String(endTimeDate.getMinutes()).padStart(2, '0')}`;

                const bookingData = {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    serviceId: formData.selectedService, // This will now be the real MongoDB _id
                    bookingDate: formData.selectedDate.toISOString().split('T')[0],
                    startTime: formData.selectedTime,
                    endTime: endTime,
                    occasion: formData.occasion,
                    notes: formData.notes,
                };

                console.log('Booking data to be sent:', bookingData);

                // This line will now correctly send a real MongoDB _id to your backend
                const response = await axiosClient.post('/bookings', bookingData);
                setFormMessage({ type: 'success', text: response.data.message || 'Booking request sent successfully!' });

                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    selectedService: '',
                    selectedDate: null,
                    selectedTime: '',
                    occasion: '',
                    notes: '',
                });
                setFormErrors({});
            } catch (error) {
                console.error('Booking failed:', error);
                const errorMessage = error.response && error.response.data && error.response.data.message
                                     ? error.response.data.message
                                     : error.message || 'Something went wrong.';
                setFormMessage({ type: 'error', text: `Booking failed: ${errorMessage}` });
            }
        }
    };

    const generateTimeSlots = () => {
        const slots = [];
        for (let i = 9; i <= 17; i++) {
            const hour = i % 12 === 0 ? 12 : i % 12;
            const ampm = i < 12 ? 'AM' : 'PM';
            slots.push(`${String(hour).padStart(2, '0')}:00 ${ampm}`);
        }
        return slots;
    };

    return (
        <div className="container mx-auto px-4 py-16">
            <SectionHeader
                title="Book Your Photography Session"
                subtitle="Let's capture your moments beautifully. Fill out the form below to request a booking."
            />

            {formMessage.text && (
                <div className={`mb-6 p-4 rounded-lg text-center font-semibold ${
                    formMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                    {formMessage.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-2xl max-w-3xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Name */}
                    <div>
                        <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            autoComplete="name"
                            className={`shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${formErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder="Your Full Name"
                        />
                        {formErrors.name && <p className="text-red-500 text-xs italic mt-1">{formErrors.name}</p>}
                    </div>

                    {/* Email */}
                    <div>
                        <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            autoComplete="email"
                            className={`shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${formErrors.email ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder="you@example.com"
                        />
                        {formErrors.email && <p className="text-red-500 text-xs italic mt-1">{formErrors.email}</p>}
                    </div>

                    {/* Phone */}
                    <div>
                        <label htmlFor="phone" className="block text-gray-700 text-sm font-bold mb-2">Phone Number</label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            autoComplete="tel"
                            className={`shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${formErrors.phone ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder="+91 12345 67890"
                        />
                        {formErrors.phone && <p className="text-red-500 text-xs italic mt-1">{formErrors.phone}</p>}
                    </div>

                    {/* Select Service */}
                    <div className="mb-6">
                        <label htmlFor="selectedService" className="block text-gray-700 text-lg font-semibold mb-3">
                            Select Service <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="selectedService"
                            name="selectedService"
                            value={formData.selectedService}
                            onChange={handleChange}
                            className={`shadow border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-white ${formErrors.selectedService ? 'border-red-500' : 'border-gray-300'}`}
                        >
                            <option value="">Select a service</option>
                            {services.map((service) => (
                                <option key={service._id} value={service._id}>
                                    {service.name} (₹{service.price.toLocaleString()})
                                </option>
                            ))}
                        </select>
                        {formErrors.selectedService && (
                            <p className="text-red-500 text-sm mt-1">{formErrors.selectedService}</p>
                        )}
                    </div>
                </div>

                {/* Date and Time Selection */}
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Preferred Date & Time</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="bookingDate" className="block text-gray-700 text-sm font-bold mb-2">Preferred Date</label>
                            <CalendarPicker
                                id="bookingDate"
                                selectedDate={formData.selectedDate}
                                onDateChange={handleDateSelect}
                            />
                            {formErrors.selectedDate && <p className="text-red-500 text-xs italic mt-1">{formErrors.selectedDate}</p>}
                        </div>
                        <div>
                            <label htmlFor="selectedTime" className="block text-gray-700 text-sm font-bold mb-2">Select Time Slot</label>
                            <select
                                id="selectedTime"
                                name="selectedTime"
                                value={formData.selectedTime}
                                onChange={handleChange}
                                className={`shadow border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-white ${formErrors.selectedTime ? 'border-red-500' : 'border-gray-300'}`}
                            >
                                <option value="">Select a time</option>
                                {generateTimeSlots().map((slot, index) => (
                                    <option key={`${slot}-${index}`} value={slot}>{slot}</option>
                                ))}
                            </select>
                            {formErrors.selectedTime && <p className="text-red-500 text-xs italic mt-1">{formErrors.selectedTime}</p>}
                        </div>
                    </div>
                </div>

                {/* Occasion Type */}
                <div className="mb-6">
                    <label htmlFor="occasion" className="block text-gray-700 text-sm font-bold mb-2">Type of Occasion</label>
                    <select
                        id="occasion"
                        name="occasion"
                        value={formData.occasion}
                        onChange={handleChange}
                        className={`shadow border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-white ${formErrors.occasion ? 'border-red-500' : 'border-gray-300'}`}
                    >
                        <option value="">Select occasion</option>
                        {occasionTypes.map((type, index) => (
                            <option key={`${type}-${index}`} value={type}>{type}</option>
                        ))}
                    </select>
                    {formErrors.occasion && <p className="text-red-500 text-xs italic mt-1">{formErrors.occasion}</p>}
                </div>

                {/* Notes/Special Requests */}
                <div className="mb-6">
                    <label htmlFor="notes" className="block text-gray-700 text-sm font-bold mb-2">Additional Notes / Special Requests</label>
                    <textarea
                        id="notes"
                        name="notes"
                        rows="4"
                        value={formData.notes}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline border-gray-300"
                        placeholder="Any specific poses, themes, or details you'd like us to know?"
                    ></textarea>
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-center">
                    <button
                        type="submit"
                        className="bg-primary-purple hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-full focus:outline-none focus:shadow-outline text-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                        Request Booking
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BookingForm;