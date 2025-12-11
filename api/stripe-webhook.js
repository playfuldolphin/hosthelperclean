// Stripe Webhook Handler
// This file processes Stripe webhook events

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Import database repositories
const bookingsDb = require('../db/bookings');
const webhookEventsDb = require('../db/webhook-events');

// Import email service
const emailService = require('../services/email');

/**
 * Main webhook handler
 * Verifies signature and processes events
 */
async function handleStripeWebhook(request) {
  const signature = request.headers['stripe-signature'];
  const rawBody = request.rawBody; // Raw body needed for signature verification

  let event;

  try {
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error('⚠️  Webhook signature verification failed:', err.message);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Webhook Error: ${err.message}` })
    };
  }

  console.log('✅ Webhook verified:', event.type);

  // Check for idempotency - has this event already been processed?
  try {
    const alreadyProcessed = await webhookEventsDb.isEventProcessed(event.id);
    if (alreadyProcessed) {
      console.log('ℹ️  Event already processed:', event.id);
      return {
        statusCode: 200,
        body: JSON.stringify({ received: true, note: 'Already processed' })
      };
    }

    // Record the event
    await webhookEventsDb.recordWebhookEvent(event.id, event.type, event);
  } catch (error) {
    console.error('Error checking event idempotency:', error);
    // Continue processing anyway to avoid losing events
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error processing webhook' })
    };
  }
}

/**
 * Handle successful checkout session
 */
async function handleCheckoutCompleted(session) {
  console.log('💰 Checkout completed:', session.id);

  const metadata = session.metadata;

  try {
    // Check if booking already exists (idempotency)
    const existingBooking = await bookingsDb.getBookingByStripeSessionId(session.id);
    if (existingBooking) {
      console.log('ℹ️  Booking already exists for session:', session.id);
      await webhookEventsDb.markEventProcessed(session.id);
      return;
    }

    // Parse addons from metadata
    let addons = [];
    try {
      addons = metadata.addons ? JSON.parse(metadata.addons) : [];
    } catch (e) {
      console.warn('Could not parse addons:', e);
    }

    // Create booking record in database
    const bookingData = {
      bookingNumber: bookingsDb.generateBookingNumber(),
      hostId: metadata.userId,
      cleanerId: metadata.cleanerId !== 'unassigned' ? metadata.cleanerId : null,
      propertyId: metadata.propertyId,
      checklistId: null, // Will be created later
      scheduledDate: metadata.scheduledDate,
      scheduledTime: metadata.scheduledTime || null,
      cleaningType: metadata.cleaningType,
      propertySize: metadata.propertySize,
      estimatedDuration: metadata.estimatedDuration || null,
      basePrice: parseFloat(metadata.basePrice || 0),
      addons: addons,
      totalAddonPrice: parseFloat(metadata.totalAddonPrice || 0),
      subtotal: parseFloat(metadata.subtotal || 0),
      platformFee: parseFloat(metadata.platformFee || 0),
      tax: session.total_details?.amount_tax ? session.total_details.amount_tax / 100 : 0,
      totalPrice: session.amount_total / 100,
      cleanerPayout: parseFloat(metadata.cleanerPayout || 0),
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent
    };

    const booking = await bookingsDb.createBooking(bookingData);
    console.log('✅ Booking created:', booking.booking_number);

    // Update booking status to confirmed and payment to paid
    await bookingsDb.updateBookingStatus(booking.id, 'confirmed');
    await bookingsDb.updatePaymentStatus(booking.id, 'paid', session.payment_intent);

    // Send confirmation emails
    const bookingWithEmail = {
      ...booking,
      userEmail: metadata.userEmail || session.customer_email,
      propertyName: metadata.propertyName
    };
    
    await emailService.sendBookingConfirmation(bookingWithEmail);
    await emailService.sendPaymentReceipt(bookingWithEmail);

    // If cleaner is assigned, notify them
    if (booking.cleaner_id) {
      console.log('📧 Notifying cleaner:', booking.cleaner_id);
      // TODO: Fetch cleaner email from database
      // const cleaner = await db.query('SELECT email, full_name FROM users WHERE id = $1', [booking.cleaner_id]);
      // await emailService.sendCleanerNotification(bookingWithEmail, cleaner.email, cleaner.full_name);
    }

    // Mark webhook event as processed
    await webhookEventsDb.markEventProcessed(session.id);

    console.log('✅ Booking created and notifications queued');
  } catch (error) {
    console.error('Error handling checkout completed:', error);
    await webhookEventsDb.markEventFailed(session.id, error.message);
    throw error;
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(paymentIntent) {
  console.log('✅ Payment succeeded:', paymentIntent.id);

  try {
    // Find booking by payment intent ID
    const booking = await bookingsDb.getBookingByStripeSessionId(paymentIntent.id);
    
    if (booking) {
      await bookingsDb.updatePaymentStatus(booking.id, 'paid', paymentIntent.id);
      console.log('✅ Payment status updated for booking:', booking.booking_number);
    } else {
      console.warn('⚠️  No booking found for payment intent:', paymentIntent.id);
    }

    // TODO: Send receipt email
    // await sendPaymentReceipt(paymentIntent);
    
    await webhookEventsDb.markEventProcessed(paymentIntent.id);
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
    await webhookEventsDb.markEventFailed(paymentIntent.id, error.message);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent) {
  console.log('❌ Payment failed:', paymentIntent.id);

  const metadata = paymentIntent.metadata;

  // Update booking status
  await updateBookingPaymentStatus(metadata.propertyId, {
    status: 'payment_failed',
    paymentIntentId: paymentIntent.id,
    failureReason: paymentIntent.last_payment_error?.message
  });

  // Notify user of payment failure
  await sendPaymentFailureNotification(paymentIntent);
}

/**
 * Handle subscription creation
 */
async function handleSubscriptionCreated(subscription) {
  console.log('📅 Subscription created:', subscription.id);

  // This would be used if you offer subscription plans
  const customerId = subscription.customer;
  const priceId = subscription.items.data[0].price.id;

  // Update user's subscription status in database
  await updateUserSubscription({
    customerId,
    subscriptionId: subscription.id,
    priceId,
    status: subscription.status,
    currentPeriodEnd: subscription.current_period_end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end
  });
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdated(subscription) {
  console.log('🔄 Subscription updated:', subscription.id);

  await updateUserSubscription({
    subscriptionId: subscription.id,
    status: subscription.status,
    currentPeriodEnd: subscription.current_period_end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end
  });
}

/**
 * Handle subscription deletion
 */
async function handleSubscriptionDeleted(subscription) {
  console.log('🗑️ Subscription deleted:', subscription.id);

  await updateUserSubscription({
    subscriptionId: subscription.id,
    status: 'canceled',
    canceledAt: new Date().toISOString()
  });

  // Downgrade user to free plan or send notification
  await handleSubscriptionCancellation(subscription);
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaymentSucceeded(invoice) {
  console.log('💵 Invoice paid:', invoice.id);

  if (invoice.subscription) {
    // This is a subscription renewal
    await recordSubscriptionPayment({
      subscriptionId: invoice.subscription,
      invoiceId: invoice.id,
      amount: invoice.amount_paid / 100,
      paidAt: new Date(invoice.status_transitions.paid_at * 1000).toISOString()
    });
  }
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice) {
  console.log('❌ Invoice payment failed:', invoice.id);

  if (invoice.subscription) {
    // Notify user about failed payment
    await sendSubscriptionPaymentFailure({
      subscriptionId: invoice.subscription,
      invoiceId: invoice.id,
      attemptCount: invoice.attempt_count,
      nextRetry: invoice.next_payment_attempt
    });
  }
}

// Helper functions (replace with actual implementations)

function generateId() {
  return 'id_' + Math.random().toString(36).substr(2, 9);
}

async function saveBooking(booking) {
  // Implement database save logic
  console.log('Saving booking to database:', booking.id);
  // In production: await db.bookings.create(booking);
}

async function updateBookingPaymentStatus(bookingId, updates) {
  // Implement database update logic
  console.log('Updating booking payment status:', bookingId, updates);
  // In production: await db.bookings.update(bookingId, updates);
}

async function updateUserSubscription(subscriptionData) {
  // Implement subscription update logic
  console.log('Updating user subscription:', subscriptionData);
  // In production: await db.subscriptions.upsert(subscriptionData);
}

async function sendBookingConfirmation(booking) {
  // Implement email sending logic
  console.log('Sending booking confirmation:', booking.id);
  // In production: await emailService.send({ template: 'booking-confirmation', data: booking });
}

async function notifyCleaner(booking) {
  // Implement cleaner notification
  console.log('Notifying cleaner:', booking.cleanerId);
  // In production: await notificationService.send({ type: 'new-booking', cleanerId: booking.cleanerId, booking });
}

async function createAutomatedChecklist(booking) {
  // Implement automated checklist creation
  console.log('Creating automated checklist for booking:', booking.id);
  // In production: await checklistService.createFromTemplate({ booking });
}

async function sendPaymentReceipt(paymentIntent) {
  // Implement receipt email
  console.log('Sending payment receipt:', paymentIntent.id);
  // In production: await emailService.sendReceipt({ paymentIntent });
}

async function sendPaymentFailureNotification(paymentIntent) {
  // Implement failure notification
  console.log('Sending payment failure notification:', paymentIntent.id);
  // In production: await emailService.send({ template: 'payment-failed', data: paymentIntent });
}

async function recordSubscriptionPayment(paymentData) {
  // Implement subscription payment recording
  console.log('Recording subscription payment:', paymentData);
  // In production: await db.payments.create(paymentData);
}

async function sendSubscriptionPaymentFailure(failureData) {
  // Implement subscription failure notification
  console.log('Sending subscription payment failure notification:', failureData);
  // In production: await emailService.send({ template: 'subscription-payment-failed', data: failureData });
}

async function handleSubscriptionCancellation(subscription) {
  // Implement subscription cancellation handling
  console.log('Handling subscription cancellation:', subscription.id);
  // In production: await subscriptionService.handleCancellation(subscription);
}

module.exports = {
  handleStripeWebhook
};
