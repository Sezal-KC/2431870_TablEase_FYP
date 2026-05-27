const nodemailer = require('nodemailer');
const https = require('https');

const sendEmail = async ({ to, subject, html }) => {
  // 1. Check for Brevo API Key (HTTP API - works on Render without port blocking)
  if (process.env.BREVO_API_KEY) {
    console.log('Sending email via Brevo HTTP API to:', to);
    
    const postData = JSON.stringify({
      sender: {
        name: process.env.EMAIL_SENDER_NAME || 'TablEase',
        email: process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_SENDER || 'tableasepos@gmail.com'
      },
      to: [{ email: to }],
      subject: subject,
      htmlContent: html
    });

    try {
      await new Promise((resolve, reject) => {
        const options = {
          hostname: 'api.brevo.com',
          port: 443,
          path: '/v3/smtp/email',
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': process.env.BREVO_API_KEY,
            'content-type': 'application/json',
            'content-length': Buffer.byteLength(postData)
          }
        };

        const req = https.request(options, (res) => {
          let responseBody = '';
          res.on('data', (chunk) => { responseBody += chunk; });
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                resolve(JSON.parse(responseBody));
              } catch (err) {
                resolve({ message: 'Success but failed to parse JSON', body: responseBody });
              }
            } else {
              reject(new Error(`Brevo HTTP API failed with status ${res.statusCode}: ${responseBody}`));
            }
          });
        });

        req.on('error', (err) => {
          console.error('Brevo HTTP API request error:', err);
          reject(err);
        });

        req.write(postData);
        req.end();
      });
      return;
    } catch (err) {
      console.error('Brevo HTTP API failed, falling back to SMTP/Gmail:', err.message);
      // Fall through to other options if the API key request fails
    }
  }

  // 2. Check for Brevo SMTP first
  if (process.env.BREVO_SMTP_KEY && process.env.BREVO_SMTP_USER) {
    console.log('Sending email via Brevo SMTP to:', to);

    const trySend = async (port) => {
      const transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: port,
        secure: false, // use STARTTLS
        auth: {
          user: process.env.BREVO_SMTP_USER,
          pass: process.env.BREVO_SMTP_KEY
        },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 5000 // 5 seconds timeout before trying fallback
      });

      const mailOptions = {
        from: `"${process.env.EMAIL_SENDER_NAME || 'TablEase'}" <${process.env.EMAIL_SENDER || process.env.BREVO_SMTP_USER}>`,
        to,
        subject,
        html
      };

      return await transporter.sendMail(mailOptions);
    };

    try {
      return await trySend(587);
    } catch (err) {
      console.warn(`Brevo SMTP port 587 failed (${err.message}). Trying port 2525...`);
      try {
        return await trySend(2525);
      } catch (err2) {
        console.error('All Brevo SMTP ports failed:', err2.message);
        throw err2;
      }
    }
  }

  // 2. Check for standard SMTP (e.g., Gmail in development) if EMAIL_PASS is not a Resend key
  const emailPass = process.env.EMAIL_PASS || '';
  const isResendKey = emailPass.startsWith('re_') || process.env.RESEND_API_KEY;

  if (process.env.EMAIL_USER && emailPass && !isResendKey) {
    console.log('Sending email via Gmail SMTP to:', to);
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: emailPass.trim()
      }
    });

    const mailOptions = {
      from: `"${process.env.EMAIL_SENDER_NAME || 'TablEase'}" <${process.env.EMAIL_SENDER || process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };

    return await transporter.sendMail(mailOptions);
  }

  // 3. Fallback to Resend
  const resendApiKey = process.env.RESEND_API_KEY || (emailPass.startsWith('re_') ? emailPass : null);
  if (resendApiKey) {
    console.log('Sending email via Resend to:', to);
    const { Resend } = require('resend');
    const resend = new Resend(resendApiKey);
    return await resend.emails.send({
      from: 'TablEase <onboarding@resend.dev>',
      to,
      subject,
      html
    });
  }

  throw new Error('No email configuration found. Please set Brevo SMTP, Gmail SMTP, or Resend API key environment variables.');
};

module.exports = sendEmail;