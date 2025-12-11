# 🚀 Quick Start Guide - Host Helper Clean

Get your cleaning management platform up and running in 15 minutes!

## Prerequisites

- Node.js 14+ installed
- Stripe account (free to sign up)
- Text editor (VS Code recommended)

## Step 1: Get Your Stripe Keys (5 minutes)

1. Go to https://dashboard.stripe.com/register
2. Sign up for a free account
3. Navigate to **Developers** → **API keys**
4. Copy your **Publishable key** (`pk_test_...`)
5. Copy your **Secret key** (`sk_test_...`)

## Step 2: Set Up Environment (2 minutes)

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` in your text editor and add your Stripe keys:
   ```env
   STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
   STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
   SITE_URL=http://localhost:3000
   ```

3. Save the file

## Step 3: Install Dependencies (3 minutes)

```bash
npm install
```

This will install:
- Stripe SDK
- Express server
- Security middleware
- And other dependencies

## Step 4: Set Up Webhooks (3 minutes)

### Option A: Using Stripe CLI (Recommended for Development)

1. Install Stripe CLI:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Windows (with Scoop)
   scoop install stripe
   
   # Or download from: https://github.com/stripe/stripe-cli/releases
   ```

2. Login to Stripe:
   ```bash
   stripe login
   ```

3. Start webhook forwarding (in a separate terminal):
   ```bash
   npm run stripe:listen
   ```
   
   Or manually:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhook
   ```

4. Copy the webhook signing secret (starts with `whsec_`) and add to `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
   ```

### Option B: Skip Webhooks for Now

If you just want to test the UI, you can skip webhooks for now. Payments will work, but automated booking creation won't happen until webhooks are configured.

## Step 5: Start the Server (1 minute)

```bash
npm start
```

You should see:
```
╔═══════════════════════════════════════════════════╗
║   🧹 Host Helper Clean Server                    ║
║   Server running on port 3000                    ║
║   📍 Local URL: http://localhost:3000            ║
║   💳 Stripe: ✅ Configured                       ║
╚═══════════════════════════════════════════════════╝
```

## Step 6: Test It Out! (1 minute)

1. Open http://localhost:3000 in your browser
2. Click "Sign Up Free" (uses demo authentication)
3. Add a test property
4. Click "Book Now" on a property
5. Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

## ✅ You're Done!

Your platform is now running locally. Next steps:

### Immediate Next Steps:
- [ ] Test the booking flow end-to-end
- [ ] Check webhook events in Stripe CLI output
- [ ] Customize the design/colors if desired
- [ ] Add your own properties

### Before Going Live:
- [ ] Switch to live Stripe keys
- [ ] Set up production webhook endpoint
- [ ] Configure email notifications
- [ ] Set up a real database (currently using localStorage)
- [ ] Deploy to hosting platform (Netlify, Vercel, etc.)

## Common Issues

### "STRIPE_SECRET_KEY not set"
- Make sure you created the `.env` file
- Check that the keys are correct (no extra spaces)
- Restart the server after editing `.env`

### "Webhook signature verification failed"
- Make sure Stripe CLI is running: `npm run stripe:listen`
- Copy the webhook secret from CLI output to `.env`
- Restart the server

### "Cannot find module"
- Run `npm install` again
- Make sure you're in the project directory

## Need Help?

1. Check `STRIPE_INTEGRATION_GUIDE.md` for detailed setup
2. Review `IMPLEMENTATION_SUMMARY.md` for overview
3. Check Stripe Dashboard logs
4. Email: support@hosthelperclean.com

## What's Included

✅ **Full Stripe Integration**
- Checkout session creation
- Webhook event handling
- Payment confirmation
- Automated booking creation

✅ **Modern UI Components**
- Beautiful booking modal
- Real-time price calculator
- Success animations
- Mobile-responsive design

✅ **Backend API**
- Express server
- Security middleware
- Rate limiting
- Error handling

✅ **Documentation**
- Comprehensive integration guide
- API documentation
- Best practices
- Troubleshooting

## Project Structure

```
host-helper-clean/
├── index.html              # Main landing page
├── success.html            # Payment success page
├── cancel.html             # Payment cancelled page
├── server.js               # Express server
├── package.json            # Dependencies
├── .env                    # Environment variables (create this!)
├── .env.example            # Environment template
├── api/
│   ├── stripe-checkout.js  # Checkout session logic
│   └── stripe-webhook.js   # Webhook event handler
├── css/
│   ├── style.css           # Main styles
│   └── enhanced-components.css  # Modern components
├── js/
│   ├── script.js           # Main application logic
│   └── stripe-client.js    # Stripe client integration
└── docs/
    ├── STRIPE_INTEGRATION_GUIDE.md
    ├── IMPLEMENTATION_SUMMARY.md
    └── QUICK_START.md (this file)
```

## Development vs Production

### Development (Current):
- Test Stripe keys (`pk_test_` and `sk_test_`)
- Stripe CLI for webhooks
- localhost URLs
- localStorage for data

### Production (Before Launch):
- Live Stripe keys (`pk_live_` and `sk_live_`)
- Real webhook endpoint (https://yourdomain.com/api/webhook)
- Production URLs
- Real database (PostgreSQL, MongoDB, Firebase, etc.)
- Email/SMS notifications configured
- SSL certificate
- Error monitoring (Sentry, etc.)

## Deployment Options

### Netlify (Easiest)
1. Push code to GitHub
2. Connect to Netlify
3. Add environment variables in Netlify dashboard
4. Deploy!

### Vercel
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

### Traditional Hosting (DigitalOcean, AWS, etc.)
1. Set up Node.js server
2. Configure environment variables
3. Set up SSL certificate
4. Configure nginx/Apache
5. Deploy!

---

**You're now ready to start accepting bookings!** 🎉

If you run into any issues, check the comprehensive guides in the `docs` folder or reach out for support.

Happy coding! 🚀
