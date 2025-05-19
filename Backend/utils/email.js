const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: false // Only use this in development
    }
});

// Verify transporter configuration with retry
const verifyTransporter = async (retries = 3, delay = 5000) => {
    for (let i = 0; i < retries; i++) {
        try {
            await transporter.verify();
            console.log('Email server is ready to send messages');
            return true;
        } catch (error) {
            console.error(`Email configuration error (attempt ${i + 1}/${retries}):`, error);
            if (i < retries - 1) {
                console.log(`Retrying in ${delay/1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    console.error('Failed to verify email configuration after all retries');
    return false;
};

// Initial verification
verifyTransporter();

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