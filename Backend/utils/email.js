// utils/email.js
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY); // Add this in Render env

const sendEmail = async (to, subject, html) => {
  try {
    console.log('Sending email to:', to);

    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SendGrid API key not configured in environment variables');
    }

    const msg = {
      to, // recipient
      from: 'no-reply@sendgrid.net', // SendGrid default domain sender
      subject,
      html,
    };

    const info = await sgMail.send(msg);
    console.log('Email sent successfully:', info);
    return info;
  } catch (error) {
    console.error('Error sending email:', error.response?.body || error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

module.exports = { sendEmail };
