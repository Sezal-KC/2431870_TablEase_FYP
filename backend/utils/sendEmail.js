const nodemailer = require('nodemailer');
const https = require('https');

const sendEmail = async ({ to, subject, html }) => {
  // 1. Check for Brevo API Key
  if (process.env.BREVO_SMTP_KEY) {
    console.log('Sending email via Brevo HTTP API to:', to);
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        sender: {
          name: process.env.EMAIL_SENDER_NAME || 'TablEase',
          email: process.env.EMAIL_SENDER || process.env.BREVO_SMTP_USER || 'tableasepos@gmail.com'
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html
      });

      const options = {
        hostname: 'api.brevo.com',
        port: 443,
        path: '/v3/smtp/email',
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': process.env.BREVO_SMTP_KEY,
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(data)
        }
      };

      const req = https.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => responseBody += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(responseBody));
          } else {
            reject(new Error(`Brevo API returned status ${res.statusCode}: ${responseBody}`));
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.write(data);
      req.end();
    });
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

  throw new Error('No email configuration found. Please set Brevo SMTP key, Gmail SMTP, or Resend API key environment variables.');
};

module.exports = sendEmail;