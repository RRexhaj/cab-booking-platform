const EventEmitter = require('events');
const fetch = require('node-fetch');

// Central event bus for booking-related domain events
const bookingBus = new EventEmitter();

// Task 5: fire discount notification once when a user completes their 3rd booking
bookingBus.on('booking.completed', async ({ userId, bookingCount }) => {
  if (bookingCount !== 3) return;

  try {
    await fetch(`${process.env.CUSTOMER_SERVICE_URL}/users/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        type: 'discount',
        message: '🎉 Congratulations! You have completed 3 rides and unlocked a 10% discount on your next booking.',
      }),
    });
  } catch (err) {
    console.error('Failed to send discount notification:', err.message);
  }
});

module.exports = bookingBus;
