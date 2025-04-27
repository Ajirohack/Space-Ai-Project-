/**
 * Email Service
 * Handles email sending functionality for the system
 */

const nodemailer = require('nodemailer');
const { logger } = require('../../middleware/logger');

// Create transporter based on environment
let transporter;

// In production, use configured SMTP settings
if (process.env.NODE_ENV === 'production') {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
} else {
  // In development, use Ethereal for testing
  // This will be initialized on first use
  transporter = null;
}

/**
 * Get the email transporter, creating a test account if needed for development
 * @returns {Promise<nodemailer.Transporter>} - Email transporter
 */
async function getTransporter() {
  if (transporter) return transporter;
  
  // Create a test account for development
  try {
    const testAccount = await nodemailer.createTestAccount();
    
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    
    logger.info('Created Ethereal test email account', {
      user: testAccount.user,
      url: 'https://ethereal.email'
    });
    
    return transporter;
  } catch (error) {
    logger.error('Failed to create test email account', {
      error: error.message
    });
    throw error;
  }
}

/**
 * Format a date for display in emails
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date string
 */
function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Send an invitation email
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.invitationCode - Invitation code
 * @param {string} options.pin - PIN for the invitation
 * @param {Date} options.expiresAt - Expiration date
 * @returns {Promise<Object>} - Send result
 */
async function sendInvitationEmail({ email, invitationCode, pin, expiresAt }) {
  try {
    const transport = await getTransporter();
    
    const formattedExpiresAt = formatDate(expiresAt);
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"The Space" <no-reply@thespace.example.com>',
      to: email,
      subject: 'Your Invitation to The Space',
      text: `
Hello!

You've been invited to join The Space. To accept this invitation, please use the following details:

Invitation Code: ${invitationCode}
PIN: ${pin}

This invitation will expire on ${formattedExpiresAt}.

To get started:
1. Visit our registration page
2. Enter the invitation code and PIN provided above
3. Complete your profile

If you have any questions, please contact our support team.

Best regards,
The Space Team
      `,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
    }
    .container {
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 5px;
    }
    .header {
      background-color: #3498db;
      color: white;
      padding: 10px;
      text-align: center;
      border-radius: 5px 5px 0 0;
      margin-bottom: 20px;
    }
    .code {
      font-family: monospace;
      background-color: #f7f7f7;
      padding: 10px;
      border-radius: 3px;
      border: 1px solid #ddd;
      margin: 10px 0;
      font-size: 18px;
      text-align: center;
    }
    .pin {
      font-size: 24px;
      font-weight: bold;
      letter-spacing: 2px;
      text-align: center;
      color: #e74c3c;
    }
    .expiry {
      color: #777;
      font-style: italic;
      margin: 20px 0;
    }
    .footer {
      margin-top: 30px;
      font-size: 12px;
      color: #777;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to The Space</h1>
    </div>
    
    <p>Hello!</p>
    
    <p>You've been invited to join <strong>The Space</strong>. To accept this invitation, please use the following details:</p>
    
    <p><strong>Invitation Code:</strong></p>
    <div class="code">${invitationCode}</div>
    
    <p><strong>PIN:</strong></p>
    <div class="pin">${pin}</div>
    
    <p class="expiry">This invitation will expire on <strong>${formattedExpiresAt}</strong>.</p>
    
    <h3>To get started:</h3>
    <ol>
      <li>Visit our registration page</li>
      <li>Enter the invitation code and PIN provided above</li>
      <li>Complete your profile</li>
    </ol>
    
    <p>If you have any questions, please contact our support team.</p>
    
    <p>Best regards,<br>The Space Team</p>
    
    <div class="footer">
      This is an automated message, please do not reply to this email.
    </div>
  </div>
</body>
</html>
      `
    };
    
    const info = await transport.sendMail(mailOptions);
    
    // For development, log the preview URL
    if (process.env.NODE_ENV !== 'production') {
      logger.info(`Invitation email preview: ${nodemailer.getTestMessageUrl(info)}`);
    }
    
    return info;
  } catch (error) {
    logger.error('Failed to send invitation email', {
      error: error.message,
      email
    });
    throw error;
  }
}

/**
 * Send a welcome email to new users
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.name - User's name
 * @param {string} options.membershipKey - User's membership key
 * @returns {Promise<Object>} - Send result
 */
async function sendWelcomeEmail({ email, name, membershipKey }) {
  try {
    const transport = await getTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"The Space" <no-reply@thespace.example.com>',
      to: email,
      subject: 'Welcome to The Space!',
      text: `
Hello ${name},

Welcome to The Space! Your account has been successfully created.

Your membership key is: ${membershipKey}

Please keep this key safe as it may be required for certain operations or to verify your membership.

If you have any questions or need assistance, please don't hesitate to contact our support team.

Best regards,
The Space Team
      `,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
    }
    .container {
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 5px;
    }
    .header {
      background-color: #2ecc71;
      color: white;
      padding: 10px;
      text-align: center;
      border-radius: 5px 5px 0 0;
      margin-bottom: 20px;
    }
    .membership-key {
      font-family: monospace;
      background-color: #f7f7f7;
      padding: 10px;
      border-radius: 3px;
      border: 1px solid #ddd;
      margin: 10px 0;
      font-size: 16px;
      text-align: center;
    }
    .footer {
      margin-top: 30px;
      font-size: 12px;
      color: #777;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to The Space!</h1>
    </div>
    
    <p>Hello ${name},</p>
    
    <p>Welcome to <strong>The Space</strong>! Your account has been successfully created.</p>
    
    <p><strong>Your membership key is:</strong></p>
    <div class="membership-key">${membershipKey}</div>
    
    <p>Please keep this key safe as it may be required for certain operations or to verify your membership.</p>
    
    <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
    
    <p>Best regards,<br>The Space Team</p>
    
    <div class="footer">
      This is an automated message, please do not reply to this email.
    </div>
  </div>
</body>
</html>
      `
    };
    
    const info = await transport.sendMail(mailOptions);
    
    // For development, log the preview URL
    if (process.env.NODE_ENV !== 'production') {
      logger.info(`Welcome email preview: ${nodemailer.getTestMessageUrl(info)}`);
    }
    
    return info;
  } catch (error) {
    logger.error('Failed to send welcome email', {
      error: error.message,
      email
    });
    throw error;
  }
}

module.exports = {
  sendInvitationEmail,
  sendWelcomeEmail
};