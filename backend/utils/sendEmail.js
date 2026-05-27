const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html }) => {
  // 1. Check for Brevo SMTP first
  if (process.env.BREVO_SMTP_KEY && process.env.BREVO_SMTP_USER) {
    console.log('Sending email via Brevo SMTP to:', to);
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false, // use STARTTLS
      auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_KEY
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: `"${process.env.EMAIL_SENDER_NAME || 'TablEase'}" <${process.env.EMAIL_SENDER || process.env.BREVO_SMTP_USER}>`,
      to,
      subject,
      html
    };

    return await transporter.sendMail(mailOptions);
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