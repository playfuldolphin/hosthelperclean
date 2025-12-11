// Webhook Events Database Repository (for idempotency)
const db = require('../config/database');

/**
 * Check if webhook event has already been processed
 */
async function isEventProcessed(stripeEventId) {
  const query = 'SELECT processed FROM webhook_events WHERE stripe_event_id = $1';
  const result = await db.query(query, [stripeEventId]);
  
  if (result.rows.length === 0) {
    return false;
  }
  
  return result.rows[0].processed;
}

/**
 * Record a new webhook event
 */
async function recordWebhookEvent(stripeEventId, eventType, payload) {
  const query = `
    INSERT INTO webhook_events (stripe_event_id, event_type, payload, processed)
    VALUES ($1, $2, $3, FALSE)
    ON CONFLICT (stripe_event_id) DO NOTHING
    RETURNING *
  `;
  
  try {
    const result = await db.query(query, [
      stripeEventId,
      eventType,
      JSON.stringify(payload)
    ]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error recording webhook event:', error);
    throw error;
  }
}

/**
 * Mark webhook event as processed
 */
async function markEventProcessed(stripeEventId) {
  const query = `
    UPDATE webhook_events 
    SET processed = TRUE, 
        processed_at = CURRENT_TIMESTAMP
    WHERE stripe_event_id = $1
    RETURNING *
  `;
  
  const result = await db.query(query, [stripeEventId]);
  return result.rows[0];
}

/**
 * Mark webhook event as failed
 */
async function markEventFailed(stripeEventId, errorMessage) {
  const query = `
    UPDATE webhook_events 
    SET error_message = $1,
        retry_count = retry_count + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE stripe_event_id = $2
    RETURNING *
  `;
  
  const result = await db.query(query, [errorMessage, stripeEventId]);
  return result.rows[0];
}

/**
 * Get unprocessed webhook events for retry
 */
async function getUnprocessedEvents(limit = 100) {
  const query = `
    SELECT * FROM webhook_events 
    WHERE processed = FALSE 
      AND retry_count < 5
      AND created_at > NOW() - INTERVAL '24 hours'
    ORDER BY created_at ASC
    LIMIT $1
  `;
  
  const result = await db.query(query, [limit]);
  return result.rows;
}

module.exports = {
  isEventProcessed,
  recordWebhookEvent,
  markEventProcessed,
  markEventFailed,
  getUnprocessedEvents
};
