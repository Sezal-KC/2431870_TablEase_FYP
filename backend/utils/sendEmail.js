const SibApiV3Sdk = require('@getbrevo/brevo');

const sendEmail = async ({ to, subject, html }) => {
  // Use Brevo HTTP API — works on Render (HTTP port 443, never blocked)
  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

  apiInstance.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = html;
  sendSmtpEmail.sender = {
    name: 'TablEase',
    email: process.env.BREVO_SENDER_EMAIL || 'noreply@tablease.com'
  };
  sendSmtpEmail.to = [{ email: to }];

  await apiInstance.sendTransacEmail(sendSmtpEmail);
};

module.exports = sendEmail;