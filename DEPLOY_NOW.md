# 🚀 ONE-CLICK DEPLOYMENT GUIDE

## Deploy Your Website in 5 Minutes!

---

## Option 1: Automated Script (EASIEST) ⚡

```bash
cd /Users/noahwilson/host-helper-clean
./deploy.sh
```

Follow the prompts and your site will be live! 🎉

---

## Option 2: Railway.app (Recommended) 🚂

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Login
```bash
railway login
```
This will open your browser to login.

### Step 3: Initialize Project
```bash
cd /Users/noahwilson/host-helper-clean
railway init
```

### Step 4: Add PostgreSQL
```bash
railway add postgresql
```

### Step 5: Set Environment Variables
```bash
# Replace with your actual keys
railway variables set STRIPE_SECRET_KEY="sk_test_your_key_here"
railway variables set STRIPE_PUBLISHABLE_KEY="pk_test_your_key_here"
railway variables set STRIPE_WEBHOOK_SECRET="whsec_your_secret_here"
railway variables set NODE_ENV="production"
railway variables set JWT_SECRET="$(openssl rand -base64 32)"
```

### Step 6: Deploy!
```bash
railway up
```

### Step 7: Setup Database
```bash
railway run npm run db:setup
```

### Step 8: Get Your URL
```bash
railway domain
```

**✅ YOUR SITE IS NOW LIVE!**

---

## Option 3: Deploy via GitHub (NO CLI NEEDED) 🐙

### Railway via GitHub:

1. **Push to GitHub:**
   ```bash
   cd /Users/noahwilson/host-helper-clean
   git remote -v  # Check if remote exists
   git push origin main
   ```

2. **Go to Railway:**
   - Visit https://railway.app
   - Click "Start a New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Add PostgreSQL database
   - Set environment variables in dashboard
   - Deploy!

### Render via GitHub:

1. **Push to GitHub** (same as above)

2. **Go to Render:**
   - Visit https://dashboard.render.com
   - Click "New +"
   - Select "Blueprint"
   - Connect your GitHub repo
   - Render will auto-detect `render.yaml`
   - Set environment variables
   - Click "Apply"

**✅ DEPLOYED!**

---

## Option 4: Vercel (Serverless) ⚡

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd /Users/noahwilson/host-helper-clean
vercel --prod
```

**Note:** Vercel is serverless. You'll need Railway for the PostgreSQL database.

---

## Environment Variables You'll Need

Before deploying, gather these:

### Required:
- **STRIPE_SECRET_KEY** - From https://dashboard.stripe.com/test/apikeys
- **STRIPE_PUBLISHABLE_KEY** - From https://dashboard.stripe.com/test/apikeys
- **STRIPE_WEBHOOK_SECRET** - From https://dashboard.stripe.com/test/webhooks
- **DATABASE_URL** - Auto-provided by Railway/Render

### Optional (for email):
- **SMTP_HOST** - e.g., smtp.sendgrid.net
- **SMTP_PORT** - e.g., 587
- **SMTP_USER** - Your SMTP username
- **SMTP_PASS** - Your SMTP password

---

## After Deployment Checklist

### 1. Update Stripe Webhook URL
1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. URL: `https://your-domain.com/api/webhook`
4. Select events: `checkout.session.completed`, `payment_intent.succeeded`
5. Copy signing secret and update `STRIPE_WEBHOOK_SECRET`

### 2. Test Your Deployment
```bash
# Check if site is live
curl https://your-domain.com/api/health

# Should return: {"status":"ok",...}
```

### 3. Test Booking Flow
1. Visit your domain
2. Click "Book This Cleaning Now"
3. Fill in details
4. Use test card: `4242 4242 4242 4242`
5. Complete payment
6. Check your database:
   ```bash
   railway run psql $DATABASE_URL -c "SELECT * FROM bookings LIMIT 5;"
   ```

### 4. Verify Emails
- Check if confirmation emails are sending
- If not, configure SMTP variables

---

## Quick Commands Reference

### Railway:
```bash
railway login          # Login
railway status         # Check status
railway logs           # View logs
railway open           # Open in browser
railway run [cmd]      # Run command
railway link           # Link to existing project
railway variables      # View variables
```

### Git:
```bash
git status            # Check changes
git add .             # Stage all
git commit -m "msg"   # Commit
git push origin main  # Push to GitHub
```

---

## Troubleshooting

### "Railway CLI not found"
```bash
npm install -g @railway/cli
```

### "Database connection failed"
Make sure you ran:
```bash
railway run npm run db:setup
```

### "Stripe webhook failing"
1. Check webhook URL is correct
2. Verify signing secret matches
3. Check logs: `railway logs`

### "Site not loading"
```bash
railway logs  # Check for errors
railway status  # Check if running
```

---

## Cost Breakdown

### Development:
- Railway Hobby: **$5/month**
- PostgreSQL: **Included**
- Total: **$5/month** ✅

### Production:
- Railway Pro: **$20/month**
- PostgreSQL: **$15/month**
- SendGrid: **$15/month**
- Total: **$50/month**

**Break-even: 3-4 bookings/month**

---

## Support

### Need Help?

1. **Check logs:**
   ```bash
   railway logs --tail
   ```

2. **Check health:**
   ```bash
   curl https://your-domain.com/api/health
   ```

3. **Database issues:**
   ```bash
   railway run psql $DATABASE_URL
   ```

4. **Re-deploy:**
   ```bash
   railway up --detach
   ```

---

## Success! 🎉

Once deployed, you'll have:

✅ Live website  
✅ PostgreSQL database  
✅ Stripe payments working  
✅ Email notifications  
✅ User authentication  
✅ Automatic HTTPS  
✅ Custom domain ready  

---

## Next Steps After Deployment

1. **Test everything** - Make sure all features work
2. **Invite beta users** - Get 10-20 people to test
3. **Switch to live mode** - Use real Stripe keys
4. **Add custom domain** - Point your domain to Railway
5. **Market your platform** - Start getting customers!

---

## 🎊 CONGRATULATIONS!

**Your Host Helper Clean platform is now LIVE!**

Time to start signing up hosts and making money! 💰

---

**Questions? Check the other documentation files:**
- `PRODUCTION_READY.md` - Full deployment guide
- `QUICK_TEST.md` - Testing instructions
- `db/README.md` - Database help

**Happy launching!** 🚀
