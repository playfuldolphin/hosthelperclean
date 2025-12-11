// Host Helper Clean - Express Server
// This is the main server file that ties everything together

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// ============================================
// VALIDATE REQUIRED ENVIRONMENT VARIABLES
// ============================================
const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'DATABASE_URL'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('\n❌ ERROR: Missing required environment variables:');
  missingEnvVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\nPlease check your .env file and ensure all required variables are set.');
  console.error('See .env.example for reference.\n');
  process.exit(1);
}

// Import Stripe modules
const { createCheckoutSession, getCheckoutSession } = require('./api/stripe-checkout');
const { handleStripeWebhook } = require('./api/stripe-webhook');

// Import validation middleware
const { validateCheckoutSession, validateSessionId, validateUserRegistration, validateUserLogin } = require('./middleware/validation');

// Import email service
const emailService = require('./services/email');

// Import auth
const { requireAuth, requireRole } = require('./middleware/auth');
const authAPI = require('./api/auth');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.SITE_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);

// ============================================
// WEBHOOK ROUTE (MUST BE BEFORE body-parser)
// ============================================
app.post('/api/webhook',
  bodyParser.raw({ type: 'application/json' }),
  async (req, res) => {
    // Store raw body for signature verification
    req.rawBody = req.body;
    
    try {
      const result = await handleStripeWebhook(req);
      res.status(result.statusCode).send(result.body);
    } catch (error) {
      console.error('Webhook handler error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
);

// ============================================
// REGULAR ROUTES (AFTER WEBHOOK)
// ============================================
// JSON body parser for non-webhook routes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ============================================
// API ENDPOINTS
// ============================================

/**
 * Create Stripe checkout session
 * With comprehensive input validation
 */
app.post('/api/create-checkout-session', validateCheckoutSession, async (req, res) => {
  try {
    console.log('Creating checkout session:', req.body);
    
    // Validation already handled by middleware
    // Create checkout session
    const result = await createCheckoutSession(req.body);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Checkout session creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create checkout session'
    });
  }
});

/**
 * Verify checkout session after payment
 * With session ID validation
 */
app.get('/api/verify-session/:sessionId', validateSessionId, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Validation already handled by middleware
    const result = await getCheckoutSession(sessionId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Session verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify session'
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

/**
 * Get configuration (for frontend)
 */
app.get('/api/config', (req, res) => {
  res.json({
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    siteUrl: process.env.SITE_URL || 'http://localhost:3000'
  });
});

// ============================================
// AUTHENTICATION ROUTES
// ============================================

/**
 * Register new user
 */
app.post('/api/auth/register', validateUserRegistration, async (req, res) => {
  try {
    const result = await authAPI.registerUser(req.body);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Registration endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

/**
 * Login user
 */
app.post('/api/auth/login', validateUserLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authAPI.loginUser(email, password);
    
    if (!result.success) {
      return res.status(401).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Login endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

/**
 * Get user profile (authenticated)
 */
app.get('/api/auth/profile', requireAuth, async (req, res) => {
  try {
    const result = await authAPI.getUserProfile(req.user.id);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Get profile endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

/**
 * Update user profile (authenticated)
 */
app.patch('/api/auth/profile', requireAuth, async (req, res) => {
  try {
    const result = await authAPI.updateUserProfile(req.user.id, req.body);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Update profile endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

/**
 * Change password (authenticated)
 */
app.post('/api/auth/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }
    
    const result = await authAPI.changePassword(req.user.id, currentPassword, newPassword);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Change password endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

/**
 * Request password reset
 */
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }
    
    const result = await authAPI.requestPasswordReset(email);
    res.json(result);
  } catch (error) {
    console.error('Forgot password endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process request'
    });
  }
});

// ============================================
// SERVE STATIC FILES
// ============================================
app.use(express.static(path.join(__dirname)));

// Serve index.html for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve success page
app.get('/booking/success', (req, res) => {
  res.sendFile(path.join(__dirname, 'success.html'));
});

// Serve cancel page
app.get('/booking/cancel', (req, res) => {
  res.sendFile(path.join(__dirname, 'cancel.html'));
});

// ============================================
// ERROR HANDLING
// ============================================
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found'
  });
});

// ============================================
// START SERVER
// ============================================
const server = app.listen(PORT, async () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🧹 Host Helper Clean Server                    ║
║                                                   ║
║   Server running on port ${PORT}                     ║
║   Environment: ${process.env.NODE_ENV || 'development'}                    ║
║                                                   ║
║   📍 Local URL: http://localhost:${PORT}             ║
║   💳 Stripe: ${process.env.STRIPE_SECRET_KEY ? '✅ Configured' : '❌ Not configured'}                 ║
║   🔐 Webhook: ${process.env.STRIPE_WEBHOOK_SECRET ? '✅ Configured' : '❌ Not configured'}               ║
║                                                   ║
║   Endpoints:                                      ║
║   - POST /api/create-checkout-session            ║
║   - GET  /api/verify-session/:id                 ║
║   - POST /api/webhook                            ║
║   - GET  /api/health                             ║
║   - GET  /api/config                             ║
║   - POST /api/auth/register                      ║
║   - POST /api/auth/login                         ║
║   - GET  /api/auth/profile                       ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);
  
  // Initialize and verify email service
  emailService.initializeEmailService();
  if (process.env.SMTP_HOST) {
    const emailWorking = await emailService.verifyEmailConfig();
    console.log(`📧 Email service: ${emailWorking ? '✅ Working' : '⚠️  Not verified'}`);
  } else {
    console.log('📧 Email service: ⚠️  Not configured (set SMTP_HOST in .env)');
  }
  
  console.log('\n✨ Ready to accept bookings!\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;
