const sendEmail = async ({ to, subject, html }) => {
  const apiKey = process.env.BREVO_API_KEY || process.env.BREVO_SMTP_KEY;
  if (!apiKey) {
    throw new Error("Brevo API key (BREVO_API_KEY) is not defined in environment variables.");
  }

  const senderEmail = process.env.EMAIL_SENDER || 'tableasepos@gmail.com';
  const senderName = process.env.EMAIL_SENDER_NAME || 'TablEase';

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      sender: {
        name: senderName,
        email: senderEmail
      },
      to: [
        {
          email: to
        }
      ],
      subject: subject,
      htmlContent: html
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Brevo HTTP API email sending failed: ${response.statusText} ${JSON.stringify(errorData)}`);
  }
};

module.exports = sendEmail;