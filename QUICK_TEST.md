# 🚀 Quick Test Guide

## Test Your Fixes (5 minutes)

### 1. Test Environment Validation ✅

```bash
cd /Users/noahwilson/host-helper-clean

# This should fail with helpful error:
node server.js
```

**Expected:** Error listing missing environment variables

### 2. Setup Database ✅

```bash
# Install dependencies (if not already)
npm install

# Create database
createdb hosthelper

# Add to .env file:
DATABASE_URL=postgresql://postgres:@localhost:5432/hosthelper

# Setup database
npm run db:setup
```

**Expected:** "✅ Database setup complete!"

### 3. Start Server ✅

```bash
npm start
```

**Expected:** Server starts with green checkmarks for Stripe and Webhook

### 4. Test Stripe Key Loading ✅

Open http://localhost:3000 in browser

**Check console:**
- Should see: "✅ Stripe initialized successfully"
- Should NOT see any errors

### 5. Test SEO Meta Tags ✅

View page source (Cmd+U or Ctrl+U)

**Look for:**
- `<meta name="description"` ✅
- `<meta property="og:title"` ✅
- `<script type="application/ld+json"` ✅

### 6. Test Database Connection ✅

```bash
psql hosthelper -c "SELECT COUNT(*) FROM users;"
```

**Expected:** `0` (empty table, which is correct)

---

## Full Integration Test (10 minutes)

### 1. Create Test Booking

1. Go to http://localhost:3000
2. Click "Book This Cleaning Now" calculator
3. Fill in details
4. Click "Book Now"

### 2. Test Stripe Checkout

1. Use test card: `4242 4242 4242 4242`
2. Expiry: any future date
3. CVC: any 3 digits
4. Submit payment

### 3. Verify Database

```bash
psql hosthelper
```

```sql
-- Check booking was created
SELECT booking_number, status, payment_status, total_price 
FROM bookings 
ORDER BY created_at DESC 
LIMIT 1;

-- Check webhook event was recorded
SELECT stripe_event_id, event_type, processed 
FROM webhook_events 
ORDER BY created_at DESC 
LIMIT 5;

-- Exit
\q
```

**Expected:** Should see your booking with status='confirmed' and payment_status='paid'

---

## Troubleshooting

### "database hosthelper does not exist"

```bash
createdb hosthelper
npm run db:setup
```

### "Stripe.js not loaded"

Check that you're visiting http://localhost:3000 (not file://)

### "Failed to load payment configuration"

Make sure server is running: `npm start`

### "Connection refused"

```bash
# Start PostgreSQL
brew services start postgresql@15  # macOS
sudo systemctl start postgresql     # Linux
```

---

## Quick Commands

```bash
# Start fresh
npm run db:setup

# Check if PostgreSQL is running
psql postgres -c "SELECT version();"

# View server logs
npm start

# Test webhook locally
stripe listen --forward-to localhost:3000/api/webhook

# Trigger test webhook
stripe trigger payment_intent.succeeded
```

---

## What to Look For

✅ **Good:**
- Server starts without errors
- Database tables created
- Stripe initializes
- Bookings save to database
- Webhooks mark as processed

❌ **Bad:**
- Server crashes
- "Cannot find module" errors
- Database connection fails
- Bookings not in database

---

## Success Criteria

All 5 fixes working if:

1. ✅ SEO tags visible in page source
2. ✅ Stripe initializes without errors
3. ✅ Server validates environment variables
4. ✅ Database connection works
5. ✅ Bookings save to database
6. ✅ Webhooks don't duplicate

---

## Next: Deploy to Staging

Once all local tests pass:

```bash
# Push to GitHub
git add .
git commit -m "feat: add SEO, fix Stripe key, implement database"
git push origin main

# Deploy to Railway.app
railway up
railway run npm run db:setup
```

Test production URL to verify everything works!
