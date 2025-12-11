// Bookings Database Repository
const db = require('../config/database');

/**
 * Create a new booking from Stripe session
 */
async function createBooking(bookingData) {
  const {
    bookingNumber,
    hostId,
    cleanerId,
    propertyId,
    checklistId,
    scheduledDate,
    scheduledTime,
    cleaningType,
    propertySize,
    estimatedDuration,
    basePrice,
    addons,
    totalAddonPrice,
    subtotal,
    platformFee,
    tax,
    totalPrice,
    cleanerPayout,
    stripeSessionId,
    stripePaymentIntentId
  } = bookingData;

  const query = `
    INSERT INTO bookings (
      booking_number, host_id, cleaner_id, property_id, checklist_id,
      scheduled_date, scheduled_time, cleaning_type, property_size,
      estimated_duration, base_price, addons, total_addon_price,
      subtotal, platform_fee, tax, total_price, cleaner_payout,
      stripe_session_id, stripe_payment_intent_id, status, payment_status
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
    ) RETURNING *
  `;

  const values = [
    bookingNumber,
    hostId,
    cleanerId,
    propertyId,
    checklistId,
    scheduledDate,
    scheduledTime || null,
    cleaningType,
    propertySize,
    estimatedDuration || null,
    basePrice,
    JSON.stringify(addons || []),
    totalAddonPrice || 0,
    subtotal,
    platformFee,
    tax || 0,
    totalPrice,
    cleanerPayout || null,
    stripeSessionId,
    stripePaymentIntentId || null,
    'pending',
    'pending'
  ];

  try {
    const result = await db.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
}

/**
 * Get booking by ID
 */
async function getBookingById(bookingId) {
  const query = 'SELECT * FROM bookings WHERE id = $1';
  const result = await db.query(query, [bookingId]);
  return result.rows[0];
}

/**
 * Get booking by Stripe session ID
 */
async function getBookingByStripeSessionId(sessionId) {
  const query = 'SELECT * FROM bookings WHERE stripe_session_id = $1';
  const result = await db.query(query, [sessionId]);
  return result.rows[0];
}

/**
 * Get booking by booking number
 */
async function getBookingByNumber(bookingNumber) {
  const query = 'SELECT * FROM bookings WHERE booking_number = $1';
  const result = await db.query(query, [bookingNumber]);
  return result.rows[0];
}

/**
 * Update booking status
 */
async function updateBookingStatus(bookingId, status) {
  const query = 'UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *';
  const result = await db.query(query, [status, bookingId]);
  return result.rows[0];
}

/**
 * Update payment status
 */
async function updatePaymentStatus(bookingId, paymentStatus, paymentIntentId = null) {
  const query = `
    UPDATE bookings 
    SET payment_status = $1, 
        stripe_payment_intent_id = COALESCE($2, stripe_payment_intent_id),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $3 
    RETURNING *
  `;
  const result = await db.query(query, [paymentStatus, paymentIntentId, bookingId]);
  return result.rows[0];
}

/**
 * Get bookings by host ID
 */
async function getBookingsByHostId(hostId, limit = 50, offset = 0) {
  const query = `
    SELECT b.*, p.name as property_name, p.address as property_address
    FROM bookings b
    LEFT JOIN properties p ON b.property_id = p.id
    WHERE b.host_id = $1
    ORDER BY b.scheduled_date DESC, b.created_at DESC
    LIMIT $2 OFFSET $3
  `;
  const result = await db.query(query, [hostId, limit, offset]);
  return result.rows;
}

/**
 * Get bookings by cleaner ID
 */
async function getBookingsByCleanerId(cleanerId, limit = 50, offset = 0) {
  const query = `
    SELECT b.*, p.name as property_name, p.address as property_address
    FROM bookings b
    LEFT JOIN properties p ON b.property_id = p.id
    WHERE b.cleaner_id = $1
    ORDER BY b.scheduled_date DESC, b.created_at DESC
    LIMIT $2 OFFSET $3
  `;
  const result = await db.query(query, [cleanerId, limit, offset]);
  return result.rows;
}

/**
 * Mark booking as completed
 */
async function completeBooking(bookingId, completionData) {
  const { completionNotes, completionPhotos } = completionData;
  
  const query = `
    UPDATE bookings 
    SET status = 'completed',
        completed_at = CURRENT_TIMESTAMP,
        completion_notes = $1,
        completion_photos = $2,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *
  `;
  
  const result = await db.query(query, [
    completionNotes || null,
    JSON.stringify(completionPhotos || []),
    bookingId
  ]);
  
  return result.rows[0];
}

/**
 * Add rating and review
 */
async function addBookingReview(bookingId, reviewData) {
  const { reviewerId, rating, reviewText, isHostReview } = reviewData;
  
  const ratingField = isHostReview ? 'host_rating' : 'cleaner_rating';
  const reviewField = isHostReview ? 'host_review' : 'cleaner_review';
  
  const query = `
    UPDATE bookings 
    SET ${ratingField} = $1,
        ${reviewField} = $2,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *
  `;
  
  const result = await db.query(query, [rating, reviewText, bookingId]);
  return result.rows[0];
}

/**
 * Generate unique booking number
 */
function generateBookingNumber() {
  const prefix = 'HHC';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

module.exports = {
  createBooking,
  getBookingById,
  getBookingByStripeSessionId,
  getBookingByNumber,
  updateBookingStatus,
  updatePaymentStatus,
  getBookingsByHostId,
  getBookingsByCleanerId,
  completeBooking,
  addBookingReview,
  generateBookingNumber
};
