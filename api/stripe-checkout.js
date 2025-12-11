// Stripe Checkout Session Handler
// This file handles creating Stripe checkout sessions for bookings

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Create a Stripe Checkout Session for a cleaning booking
 * @param {Object} bookingData - The booking information
 * @returns {Object} - The checkout session
 */
async function createCheckoutSession(bookingData) {
  const {
    propertyId,
    propertyName,
    cleaningType,
    propertySize,
    scheduledDate,
    addons = [],
    userId,
    userEmail,
    cleanerId
  } = bookingData;

  // Calculate pricing
  const pricing = calculatePricing(cleaningType, propertySize, addons);

  try {
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: userEmail,
      client_reference_id: userId,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${cleaningType.charAt(0).toUpperCase() + cleaningType.slice(1)} Cleaning - ${propertyName}`,
              description: `Scheduled for ${new Date(scheduledDate).toLocaleDateString()}`,
              images: ['https://your-domain.com/images/cleaning-service.jpg'],
            },
            unit_amount: Math.round(pricing.totalPrice * 100), // Convert to cents
          },
          quantity: 1,
        },
        ...addons.map(addon => ({
          price_data: {
            currency: 'usd',
            product_data: {
              name: addon.name,
              description: `Add-on service for ${propertyName}`,
            },
            unit_amount: Math.round(addon.price * 100),
          },
          quantity: 1,
        }))
      ],
      metadata: {
        propertyId,
        propertyName,
        cleaningType,
        propertySize,
        scheduledDate,
        userId,
        cleanerId: cleanerId || 'unassigned',
        bookingType: 'cleaning',
        platformFee: pricing.platformFee.toFixed(2),
        cleanerPayout: pricing.cleanerPayout.toFixed(2)
      },
      payment_intent_data: {
        metadata: {
          propertyId,
          userId,
          cleanerId: cleanerId || 'unassigned',
          scheduledDate
        }
      },
      success_url: `${process.env.SITE_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_URL}/booking/cancel`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      automatic_tax: {
        enabled: true,
      },
    });

    return {
      success: true,
      sessionId: session.id,
      url: session.url
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Calculate pricing based on booking details
 */
function calculatePricing(cleaningType, propertySize, addons = []) {
  const BASE_PRICES = {
    standard: {
      studio: 75,
      oneBed: 95,
      twoBed: 120,
      threeBed: 150,
      fourBed: 180
    },
    deep: {
      studio: 110,
      oneBed: 140,
      twoBed: 180,
      threeBed: 220,
      fourBed: 260
    },
    quick: {
      studio: 60,
      oneBed: 75,
      twoBed: 95,
      threeBed: 120,
      fourBed: 150
    }
  };

  const ADDON_PRICES = {
    laundry: 25,
    insideOven: 20,
    insideFridge: 20,
    windows: 30,
    garage: 25,
    supplies: 15
  };

  // Get base price
  let basePrice = BASE_PRICES[cleaningType]?.[propertySize] || 95;

  // Calculate addon total
  let addonTotal = 0;
  addons.forEach(addon => {
    if (typeof addon === 'string') {
      addonTotal += ADDON_PRICES[addon] || 0;
    } else if (addon.price) {
      addonTotal += addon.price;
    }
  });

  // Calculate cleaner payout (what cleaner receives)
  const cleanerPayout = basePrice + addonTotal;

  // Calculate platform fee (15% of cleaner payout)
  const platformFee = Math.round(cleanerPayout * 0.15 * 100) / 100;

  // Calculate total price (what customer pays)
  const totalPrice = cleanerPayout + platformFee;

  return {
    cleanerPayout,
    platformFee,
    totalPrice,
    feePercentage: 15,
    breakdown: {
      baseService: basePrice,
      addons: addonTotal,
      addonsList: addons
    }
  };
}

/**
 * Retrieve checkout session details
 */
async function getCheckoutSession(sessionId) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'payment_intent']
    });
    return {
      success: true,
      session
    };
  } catch (error) {
    console.error('Error retrieving session:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  createCheckoutSession,
  getCheckoutSession,
  calculatePricing
};
