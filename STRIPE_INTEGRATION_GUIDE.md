# Stripe Integration Guide for Host Helper Clean

This guide will help you set up complete Stripe payment processing for the Host Helper Clean website.

## Overview

The integration includes:
- ✅ Checkout session creation
- ✅ Webhook event handling
- ✅ Payment confirmation
- ✅ Automated booking creation
- ✅ Email notifications
- ✅ Subscription support (optional)

## Prerequisites

1. **Stripe Account**: Sign up at https://stripe.com
2. **Node.js**: Version 14+ installed
3. **Environment Variables**: Set up properly (see below)

## Step 1: Get Your Stripe Keys

### Test Mode Keys (for development)
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)

### Production Keys (for live site)
1. Go to https://dashboard.stripe.com/apikeys
2. Copy your **Publishable key** (starts with `pk_live_`)
3. Copy your **Secret key** (starts with `sk_live_`)

## Step 2: Set Up Environment Variables

Create a `.env` file in your project root:

```env
# Stripe Keys (TEST MODE - replace with live keys for production)
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# Site Configuration
SITE_URL=https://yourdomain.com
# For local development: SITE_URL=http://localhost:3000

# Email Configuration (for sending confirmations)
SMTP_HOST=smtp.your-email-provider.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-email-password
FROM_EMAIL=noreply@hosthelperclean.com

# Database Configuration (if using a database)
DATABASE_URL=your-database-connection-string
```

**⚠️ IMPORTANT**: Never commit `.env` to git! Add it to `.gitignore`.

## Step 3: Install Dependencies

```bash
npm install stripe express body-parser dotenv
```

Or if using a static site, include Stripe.js in your HTML:

```html
<script src="https://js.stripe.com/v3/"></script>
```

## Step 4: Frontend Integration

### Add Stripe.js to your HTML

In `index.html`, add before closing `</body>`:

```html
<script src="https://js.stripe.com/v3/"></script>
<script>
// Initialize Stripe
const stripe = Stripe('YOUR_PUBLISHABLE_KEY_HERE'); // Replace with actual key

// Handle booking/checkout
async function initiateCheckout(bookingData) {
    try {
        // Call your backend to create checkout session
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookingData)
        });
        
        const session = await response.json();
        
        if (session.error) {
            alert('Error: ' + session.error);
            return;
        }
        
        // Redirect to Stripe Checkout
        const result = await stripe.redirectToCheckout({
            sessionId: session.sessionId
        });
        
        if (result.error) {
            alert(result.error.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
}

// Example: Trigger checkout when user clicks "Book Now"
document.getElementById('bookNowButton').addEventListener('click', () => {
    const bookingData = {
        propertyId: 'prop_123',
        propertyName: 'Beach House',
        cleaningType: 'standard',
        propertySize: 'twoBed',
        scheduledDate: '2024-01-15',
        addons: ['laundry', 'windows'],
        userId: currentUser.id,
        userEmail: currentUser.email,
        cleanerId: 'cleaner_456'
    };
    
    initiateCheckout(bookingData);
});
</script>
```

## Step 5: Backend API Setup

### Option A: Node.js/Express Server

Create `server.js`:

```javascript
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { createCheckoutSession } = require('./api/stripe-checkout');
const { handleStripeWebhook } = require('./api/stripe-webhook');

const app = express();

// For webhook route, use raw body
app.post('/api/webhook',
  bodyParser.raw({ type: 'application/json' }),
  async (req, res) => {
    req.rawBody = req.body;
    const result = await handleStripeWebhook(req);
    res.status(result.statusCode).send(result.body);
  }
);

// For other routes, use JSON parser
app.use(bodyParser.json());

// Create checkout session
app.post('/api/create-checkout-session', async (req, res) => {
  const result = await createCheckoutSession(req.body);
  res.json(result);
});

// Verify payment success
app.get('/api/verify-session/:sessionId', async (req, res) => {
  const { getCheckoutSession } = require('./api/stripe-checkout');
  const result = await getCheckoutSession(req.params.sessionId);
  res.json(result);
});

// Serve static files
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

Start your server:
```bash
node server.js
```

### Option B: Serverless Functions (Netlify/Vercel)

For Netlify, create `netlify/functions/create-checkout-session.js`:

```javascript
const { createCheckoutSession } = require('../../api/stripe-checkout');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const bookingData = JSON.parse(event.body);
  const result = await createCheckoutSession(bookingData);

  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
};
```

For Vercel, create `api/create-checkout-session.js`:

```javascript
const { createCheckoutSession } = require('../api/stripe-checkout');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const result = await createCheckoutSession(req.body);
  res.status(200).json(result);
}
```

## Step 6: Set Up Webhooks

Webhooks allow Stripe to notify your server about payment events.

### For Local Development

1. Install Stripe CLI:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Windows
   scoop install stripe
   
   # Linux
   # Download from https://github.com/stripe/stripe-cli/releases
   ```

2. Login to Stripe:
   ```bash
   stripe login
   ```

3. Forward webhooks to local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhook
   ```

4. Copy the webhook signing secret (starts with `whsec_`) and add to `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxx
   ```

### For Production

1. Go to https://dashboard.stripe.com/webhooks
2. Click **Add endpoint**
3. Enter your webhook URL: `https://yourdomain.com/api/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created` (if using subscriptions)
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

5. Copy the **Signing secret** and add to your production `.env` file

## Step 7: Test the Integration

### Test Mode Credit Cards

Use these test cards (from https://stripe.com/docs/testing):

**Successful Payment:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

**Payment Requires Authentication:**
- Card: `4000 0025 0000 3155`

**Payment Fails:**
- Card: `4000 0000 0000 9995`

### Testing Checklist

- [ ] Create a test booking
- [ ] Complete checkout with test card
- [ ] Verify redirect to success page
- [ ] Check webhook logs for events
- [ ] Verify booking created in database
- [ ] Confirm email sent (if configured)
- [ ] Test payment failure scenario
- [ ] Test cancellation flow

## Step 8: Go Live!

### Pre-Launch Checklist

- [ ] Switch from test keys to live keys in production `.env`
- [ ] Update webhook endpoint to production URL
- [ ] Test with real card (small amount)
- [ ] Set up error monitoring (e.g., Sentry)
- [ ] Configure backup payment methods
- [ ] Enable Stripe Radar (fraud prevention)
- [ ] Set up email notifications
- [ ] Test refund process
- [ ] Document support procedures

### Update Environment Variables

In production (e.g., Netlify/Vercel dashboard):

```env
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_WEBHOOK_SECRET
SITE_URL=https://yourdomain.com
```

### Update Frontend

In your `index.html` or JavaScript, use your **live publishable key**:

```javascript
const stripe = Stripe('pk_live_YOUR_LIVE_PUBLISHABLE_KEY');
```

## Pricing Structure

Based on competitor research, here's the recommended pricing:

### Per-Booking Model (Transaction-Based)
- Platform fee: **15%** of cleaner payout
- No monthly subscription required
- Cleaners receive **85%** of booking amount
- Hosts pay total = cleaner payout + platform fee

### Example Calculation
- Standard 2BR clean: $120 (cleaner receives)
- Platform fee: $18 (15% of $120)
- **Total host pays: $138**

### Volume Discounts
- 20+ bookings/month: **10%** platform fee (automatic)
- Enterprise (50+ properties): **Custom pricing**

## Security Best Practices

1. **Never expose secret keys** in frontend code
2. **Validate all data** on the server before creating charges
3. **Use HTTPS** in production
4. **Implement rate limiting** on checkout endpoints
5. **Enable Stripe Radar** for fraud prevention
6. **Log all transactions** for auditing
7. **Set up alerts** for failed payments
8. **Implement retry logic** for webhooks
9. **Use environment variables** for all keys
10. **Regular security audits**

## Common Issues & Solutions

### Issue: Webhook not receiving events
**Solution**: 
- Check webhook endpoint is publicly accessible
- Verify webhook secret matches Stripe dashboard
- Check webhook endpoint logs for errors
- Ensure rawBody is passed to webhook handler

### Issue: Payment succeeds but booking not created
**Solution**:
- Check webhook logs for errors
- Verify metadata is correctly set in checkout session
- Check database connection
- Review webhook event processing logic

### Issue: "Invalid API key" error
**Solution**:
- Verify you're using the correct key (test vs live)
- Check key is properly loaded from environment variables
- Ensure no extra spaces or newlines in `.env` file

### Issue: Checkout page not loading
**Solution**:
- Check Stripe.js is loaded (view browser console)
- Verify publishable key is correct
- Check for JavaScript errors
- Ensure CORS is configured if using separate backend

## Monitoring & Analytics

### Stripe Dashboard
- Monitor payments: https://dashboard.stripe.com/payments
- View customers: https://dashboard.stripe.com/customers
- Check webhooks: https://dashboard.stripe.com/webhooks
- Analytics: https://dashboard.stripe.com/reports

### Recommended Metrics to Track
- Successful payment rate
- Average booking value
- Payment failure reasons
- Conversion rate (checkout initiated vs completed)
- Time to complete checkout
- Customer lifetime value
- Refund rate
- Chargeback rate

## Support & Resources

- **Stripe Documentation**: https://stripe.com/docs
- **API Reference**: https://stripe.com/docs/api
- **Testing Guide**: https://stripe.com/docs/testing
- **Webhook Guide**: https://stripe.com/docs/webhooks
- **Stripe Status**: https://status.stripe.com
- **Community**: https://support.stripe.com

## Next Steps

After basic integration works:

1. **Add Subscription Plans** (optional)
   - Offer monthly property management plans
   - Implement in `api/stripe-checkout.js`

2. **Implement Refunds**
   - Create refund processing logic
   - Add admin interface for refunds

3. **Add Invoice Generation**
   - Automatic invoice creation
   - PDF generation for bookings

4. **Enhance Notifications**
   - SMS notifications via Twilio
   - Push notifications for mobile app

5. **Analytics Dashboard**
   - Revenue tracking
   - Booking trends
   - Cleaner performance metrics

6. **Connect Accounts** (advanced)
   - Allow cleaners to receive direct payouts
   - Implement Stripe Connect

---

## Questions?

If you encounter issues:
1. Check Stripe dashboard logs
2. Review webhook event logs
3. Check browser console for errors
4. Review server logs
5. Test with Stripe CLI
6. Contact Stripe support if needed

Good luck with your integration! 🚀
