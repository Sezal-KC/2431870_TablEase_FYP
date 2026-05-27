const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.BREVO_SMTP_PORT || '587', 10),
    secure: process.env.BREVO_SMTP_SECURE === 'true', // true for port 465, false for other ports
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_KEY,
    },
  });

  await transporter.sendMail({
    from: `"${process.env.EMAIL_SENDER_NAME || 'TablEase'}" <${process.env.EMAIL_SENDER || 'onboarding@resend.dev'}>`,
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;