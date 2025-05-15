const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Verify transporter configuration
transporter.verify(function(error, success) {
    if (error) {
        console.error('Email configuration error:', error);
    } else {
        console.log('Email server is ready to send messages');
    }
});

/**
 * Send an email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - Email body in HTML format
 * @returns {Promise<void>}
 */
const sendEmail = async (to, subject, html) => {
    try {
        console.log('Attempting to send email to:', to);
        console.log('Email configuration check:', {
            hasEmailUser: !!process.env.EMAIL_USER,
            hasEmailPassword: !!process.env.EMAIL_PASSWORD
        });

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            throw new Error('Email credentials not configured. Please set EMAIL_USER and EMAIL_PASSWORD in .env file');
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            html
        };

        console.log('Sending email with options:', {
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject
        });

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return info;
    } catch (error) {
        console.error('Detailed error sending email:', {
            error: error.message,
            stack: error.stack,
            code: error.code
        });
        throw new Error(`Failed to send email: ${error.message}`);
    }
};

module.exports = { sendEmail }; 