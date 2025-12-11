// Email Service for Host Helper Clean
// Handles all transactional emails using Nodemailer

const nodemailer = require('nodemailer');

// Create reusable transporter
let transporter;

// Initialize email service
function initializeEmailService() {
  if (!process.env.SMTP_HOST) {
    console.warn('⚠️  Email service not configured. Set SMTP_HOST in .env');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  console.log('✅ Email service initialized');
  return transporter;
}

// Verify email configuration
async function verifyEmailConfig() {
  if (!transporter) {
    transporter = initializeEmailService();
  }
  
  if (!transporter) {
    return false;
  }

  try {
    await transporter.verify();
    console.log('✅ Email server connection verified');
    return true;
  } catch (error) {
    console.error('❌ Email server connection failed:', error.message);
    return false;
  }
}

/**
 * Send booking confirmation to host
 */
async function sendBookingConfirmation(booking) {
  if (!transporter) {
    transporter = initializeEmailService();
  }

  if (!transporter) {
    console.log('📧 Email not configured - would send booking confirmation to:', booking.userEmail);
    return { success: false, message: 'Email service not configured' };
  }

  const mailOptions = {
    from: `"Host Helper Clean" <${process.env.FROM_EMAIL || 'noreply@hosthelperclean.com'}>`,
    to: booking.userEmail,
    subject: `Booking Confirmed: ${booking.propertyName} - ${booking.scheduledDate}`,
    html: generateBookingConfirmationEmail(booking),
    text: generateBookingConfirmationText(booking)
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Booking confirmation sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send booking confirmation:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send cleaner assignment notification
 */
async function sendCleanerNotification(booking, cleanerEmail, cleanerName) {
  if (!transporter) {
    transporter = initializeEmailService();
  }

  if (!transporter) {
    console.log('📧 Email not configured - would notify cleaner:', cleanerEmail);
    return { success: false, message: 'Email service not configured' };
  }

  const mailOptions = {
    from: `"Host Helper Clean" <${process.env.FROM_EMAIL || 'noreply@hosthelperclean.com'}>`,
    to: cleanerEmail,
    subject: `New Cleaning Job: ${booking.propertyName} on ${booking.scheduledDate}`,
    html: generateCleanerNotificationEmail(booking, cleanerName),
    text: generateCleanerNotificationText(booking, cleanerName)
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Cleaner notification sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send cleaner notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send payment receipt
 */
async function sendPaymentReceipt(booking) {
  if (!transporter) {
    transporter = initializeEmailService();
  }

  if (!transporter) {
    console.log('📧 Email not configured - would send receipt to:', booking.userEmail);
    return { success: false, message: 'Email service not configured' };
  }

  const mailOptions = {
    from: `"Host Helper Clean" <${process.env.FROM_EMAIL || 'noreply@hosthelperclean.com'}>`,
    to: booking.userEmail,
    subject: `Payment Receipt - Booking #${booking.bookingNumber}`,
    html: generatePaymentReceiptEmail(booking),
    text: generatePaymentReceiptText(booking)
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Payment receipt sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send payment receipt:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send cleaning completion notification to host
 */
async function sendCompletionNotification(booking) {
  if (!transporter) {
    transporter = initializeEmailService();
  }

  if (!transporter) {
    console.log('📧 Email not configured - would send completion notice to:', booking.userEmail);
    return { success: false, message: 'Email service not configured' };
  }

  const mailOptions = {
    from: `"Host Helper Clean" <${process.env.FROM_EMAIL || 'noreply@hosthelperclean.com'}>`,
    to: booking.userEmail,
    subject: `Cleaning Completed: ${booking.propertyName}`,
    html: generateCompletionEmail(booking),
    text: generateCompletionText(booking)
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Completion notification sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send completion notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send password reset email
 */
async function sendPasswordReset(email, resetToken, userName) {
  if (!transporter) {
    transporter = initializeEmailService();
  }

  if (!transporter) {
    console.log('📧 Email not configured - would send reset to:', email);
    return { success: false, message: 'Email service not configured' };
  }

  const resetUrl = `${process.env.SITE_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"Host Helper Clean" <${process.env.FROM_EMAIL || 'noreply@hosthelperclean.com'}>`,
    to: email,
    subject: 'Password Reset Request',
    html: generatePasswordResetEmail(userName, resetUrl),
    text: `Hello ${userName},\n\nYou requested a password reset. Click here to reset: ${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, please ignore this email.`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send password reset:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// EMAIL TEMPLATES (HTML)
// ============================================

function generateBookingConfirmationEmail(booking) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #3182ce; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f7fafc; padding: 30px; border-radius: 0 0 8px 8px; }
    .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
    .detail-label { font-weight: bold; color: #4a5568; }
    .detail-value { color: #2d3748; }
    .button { display: inline-block; background: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #718096; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧹 Booking Confirmed!</h1>
    </div>
    <div class="content">
      <p>Hi there,</p>
      <p>Your cleaning has been confirmed! Here are the details:</p>
      
      <div class="booking-details">
        <div class="detail-row">
          <span class="detail-label">Booking Number:</span>
          <span class="detail-value">${booking.booking_number || booking.id}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Property:</span>
          <span class="detail-value">${booking.propertyName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date:</span>
          <span class="detail-value">${booking.scheduledDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Cleaning Type:</span>
          <span class="detail-value">${booking.cleaningType}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Total Paid:</span>
          <span class="detail-value">$${(booking.totalPrice || booking.totalAmount)?.toFixed(2)}</span>
        </div>
      </div>
      
      <p><strong>What happens next?</strong></p>
      <ul>
        <li>We'll assign a vetted cleaner to your property</li>
        <li>You'll receive notifications as the cleaner works</li>
        <li>Photos will be uploaded for verification</li>
        <li>You'll get a completion notification when done</li>
      </ul>
      
      <center>
        <a href="${process.env.SITE_URL || 'https://hosthelperclean.com'}/booking/${booking.id}" class="button">View Booking Details</a>
      </center>
      
      <p>Questions? Reply to this email or contact support at ${process.env.SUPPORT_EMAIL || 'support@hosthelperclean.com'}</p>
    </div>
    <div class="footer">
      <p>Host Helper Clean - Professional cleaning for rental properties</p>
      <p>© ${new Date().getFullYear()} Host Helper Clean. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateCleanerNotificationEmail(booking, cleanerName) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f7fafc; padding: 30px; border-radius: 0 0 8px 8px; }
    .job-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💼 New Cleaning Job Assigned</h1>
    </div>
    <div class="content">
      <p>Hi ${cleanerName},</p>
      <p>You've been assigned a new cleaning job!</p>
      
      <div class="job-details">
        <h3>Job Details</h3>
        <p><strong>Property:</strong> ${booking.propertyName}</p>
        <p><strong>Date:</strong> ${booking.scheduledDate}</p>
        <p><strong>Type:</strong> ${booking.cleaningType} cleaning</p>
        <p><strong>Size:</strong> ${booking.propertySize}</p>
        <p><strong>Your Payout:</strong> $${booking.cleanerPayout?.toFixed(2) || 'TBD'}</p>
      </div>
      
      <div class="alert">
        <strong>⏰ Remember:</strong> Take before/after photos and mark tasks complete in the app!
      </div>
      
      <center>
        <a href="${process.env.SITE_URL || 'https://hosthelperclean.com'}/cleaner/jobs/${booking.id}" class="button">View Job Details</a>
      </center>
    </div>
  </div>
</body>
</html>
  `;
}

function generatePaymentReceiptEmail(booking) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #3182ce; color: white; padding: 20px; text-align: center; }
    .receipt { background: white; padding: 30px; border: 2px solid #e2e8f0; margin: 20px 0; }
    .total { background: #f7fafc; padding: 15px; font-size: 20px; font-weight: bold; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💳 Payment Receipt</h1>
    </div>
    <div class="receipt">
      <h2>Thank you for your payment!</h2>
      <p><strong>Receipt #:</strong> ${booking.booking_number || booking.id}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      <hr>
      <p>Base Price: $${booking.basePrice?.toFixed(2)}</p>
      <p>Platform Fee (15%): $${booking.platformFee?.toFixed(2)}</p>
      ${booking.tax ? `<p>Tax: $${booking.tax.toFixed(2)}</p>` : ''}
      <div class="total">
        Total Paid: $${(booking.totalPrice || booking.totalAmount)?.toFixed(2)}
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

function generateCompletionEmail(booking) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; }
    .button { display: inline-block; background: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✨ Cleaning Completed!</h1>
    </div>
    <div class="content">
      <p>Great news! Your property has been cleaned and is ready for guests.</p>
      <p><strong>Property:</strong> ${booking.propertyName}</p>
      <p>Please review the completion photos and leave feedback for your cleaner.</p>
      <center>
        <a href="${process.env.SITE_URL}/booking/${booking.id}/review" class="button">Review & Rate Cleaner</a>
      </center>
    </div>
  </div>
</body>
</html>
  `;
}

function generatePasswordResetEmail(userName, resetUrl) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { display: inline-block; background: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <h2>🔐 Password Reset Request</h2>
    <p>Hi ${userName},</p>
    <p>You requested to reset your password. Click the button below to create a new password:</p>
    <center>
      <a href="${resetUrl}" class="button">Reset Password</a>
    </center>
    <p>This link expires in 1 hour.</p>
    <div class="warning">
      <strong>⚠️ Security Notice:</strong> If you didn't request this, please ignore this email. Your password will remain unchanged.
    </div>
  </div>
</body>
</html>
  `;
}

// ============================================
// TEXT VERSIONS (for email clients that don't support HTML)
// ============================================

function generateBookingConfirmationText(booking) {
  return `
BOOKING CONFIRMED!

Hi there,

Your cleaning has been confirmed! Here are the details:

Booking Number: ${booking.booking_number || booking.id}
Property: ${booking.propertyName}
Date: ${booking.scheduledDate}
Cleaning Type: ${booking.cleaningType}
Total Paid: $${(booking.totalPrice || booking.totalAmount)?.toFixed(2)}

What happens next?
- We'll assign a vetted cleaner to your property
- You'll receive notifications as the cleaner works
- Photos will be uploaded for verification
- You'll get a completion notification when done

View booking details: ${process.env.SITE_URL}/booking/${booking.id}

Questions? Contact support at ${process.env.SUPPORT_EMAIL || 'support@hosthelperclean.com'}

© ${new Date().getFullYear()} Host Helper Clean
  `.trim();
}

function generateCleanerNotificationText(booking, cleanerName) {
  return `
NEW CLEANING JOB ASSIGNED!

Hi ${cleanerName},

You've been assigned a new cleaning job!

JOB DETAILS:
Property: ${booking.propertyName}
Date: ${booking.scheduledDate}
Type: ${booking.cleaningType} cleaning
Size: ${booking.propertySize}
Your Payout: $${booking.cleanerPayout?.toFixed(2) || 'TBD'}

REMEMBER: Take before/after photos and mark tasks complete in the app!

View job details: ${process.env.SITE_URL}/cleaner/jobs/${booking.id}
  `.trim();
}

function generatePaymentReceiptText(booking) {
  return `
PAYMENT RECEIPT

Thank you for your payment!

Receipt #: ${booking.booking_number || booking.id}
Date: ${new Date().toLocaleDateString()}

Base Price: $${booking.basePrice?.toFixed(2)}
Platform Fee (15%): $${booking.platformFee?.toFixed(2)}
${booking.tax ? `Tax: $${booking.tax.toFixed(2)}` : ''}

TOTAL PAID: $${(booking.totalPrice || booking.totalAmount)?.toFixed(2)}

© ${new Date().getFullYear()} Host Helper Clean
  `.trim();
}

function generateCompletionText(booking) {
  return `
CLEANING COMPLETED!

Great news! Your property has been cleaned and is ready for guests.

Property: ${booking.propertyName}

Please review the completion photos and leave feedback for your cleaner.

Review & rate: ${process.env.SITE_URL}/booking/${booking.id}/review

© ${new Date().getFullYear()} Host Helper Clean
  `.trim();
}

module.exports = {
  initializeEmailService,
  verifyEmailConfig,
  sendBookingConfirmation,
  sendCleanerNotification,
  sendPaymentReceipt,
  sendCompletionNotification,
  sendPasswordReset
};
