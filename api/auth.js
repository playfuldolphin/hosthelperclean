// Authentication API
// User registration, login, and password management

const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/auth');
const db = require('../config/database');
const emailService = require('../services/email');
const crypto = require('crypto');

/**
 * Register new user
 */
async function registerUser(userData) {
  const { email, password, fullName, phone, role = 'host' } = userData;

  try {
    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return {
        success: false,
        error: 'Email already registered'
      };
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const result = await db.query(
      `INSERT INTO users (email, password_hash, full_name, phone, role, is_email_verified, is_active)
       VALUES ($1, $2, $3, $4, $5, FALSE, TRUE)
       RETURNING id, email, full_name, phone, role, created_at`,
      [email.toLowerCase(), passwordHash, fullName, phone || null, role]
    );

    const user = result.rows[0];

    // Generate token
    const token = generateToken(user);

    // TODO: Send verification email
    // await emailService.sendEmailVerification(user.email, verificationToken);

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        role: user.role,
        createdAt: user.created_at
      },
      token
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: 'Registration failed. Please try again.'
    };
  }
}

/**
 * Login user
 */
async function loginUser(email, password) {
  try {
    // Find user
    const result = await db.query(
      `SELECT id, email, password_hash, full_name, phone, role, is_active, is_email_verified
       FROM users 
       WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'Invalid email or password'
      };
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      return {
        success: false,
        error: 'Account has been deactivated. Please contact support.'
      };
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return {
        success: false,
        error: 'Invalid email or password'
      };
    }

    // Update last login
    await db.query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Generate token
    const token = generateToken(user);

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.is_email_verified
      },
      token
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'Login failed. Please try again.'
    };
  }
}

/**
 * Get user profile
 */
async function getUserProfile(userId) {
  try {
    const result = await db.query(
      `SELECT id, email, full_name, phone, role, company_name, 
              is_email_verified, created_at, last_login_at
       FROM users 
       WHERE id = $1 AND is_active = TRUE`,
      [userId]
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    const user = result.rows[0];

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        role: user.role,
        companyName: user.company_name,
        isEmailVerified: user.is_email_verified,
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at
      }
    };
  } catch (error) {
    console.error('Get profile error:', error);
    return {
      success: false,
      error: 'Failed to fetch user profile'
    };
  }
}

/**
 * Update user profile
 */
async function updateUserProfile(userId, updates) {
  const allowedFields = ['full_name', 'phone', 'company_name'];
  const updateFields = [];
  const values = [];
  let paramIndex = 1;

  // Build dynamic update query
  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      updateFields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (updateFields.length === 0) {
    return {
      success: false,
      error: 'No valid fields to update'
    };
  }

  values.push(userId);

  try {
    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING id, email, full_name, phone, company_name
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    const user = result.rows[0];

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        companyName: user.company_name
      }
    };
  } catch (error) {
    console.error('Update profile error:', error);
    return {
      success: false,
      error: 'Failed to update profile'
    };
  }
}

/**
 * Request password reset
 */
async function requestPasswordReset(email) {
  try {
    // Find user
    const result = await db.query(
      'SELECT id, full_name FROM users WHERE email = $1 AND is_active = TRUE',
      [email.toLowerCase()]
    );

    // Always return success (don't reveal if email exists)
    if (result.rows.length === 0) {
      return {
        success: true,
        message: 'If email exists, password reset instructions will be sent'
      };
    }

    const user = result.rows[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = await bcrypt.hash(resetToken, 10);
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Store reset token (in production, create a password_resets table)
    // For now, we'll use a temporary approach
    await db.query(
      `UPDATE users 
       SET updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [user.id]
    );

    // Send email
    await emailService.sendPasswordReset(email, resetToken, user.full_name);

    return {
      success: true,
      message: 'If email exists, password reset instructions will be sent'
    };
  } catch (error) {
    console.error('Password reset request error:', error);
    return {
      success: false,
      error: 'Failed to process password reset request'
    };
  }
}

/**
 * Reset password
 */
async function resetPassword(token, newPassword) {
  // TODO: Implement password reset verification
  // This would involve checking the token against a password_resets table
  
  return {
    success: false,
    error: 'Password reset not fully implemented yet'
  };
}

/**
 * Change password (authenticated)
 */
async function changePassword(userId, currentPassword, newPassword) {
  try {
    // Get user
    const result = await db.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    const user = result.rows[0];

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isValidPassword) {
      return {
        success: false,
        error: 'Current password is incorrect'
      };
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );

    return {
      success: true,
      message: 'Password changed successfully'
    };
  } catch (error) {
    console.error('Change password error:', error);
    return {
      success: false,
      error: 'Failed to change password'
    };
  }
}

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  requestPasswordReset,
  resetPassword,
  changePassword
};
