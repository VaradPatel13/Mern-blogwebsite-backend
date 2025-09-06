// In bolify-backend/src/config/nodemailer.js (NEW FILE)

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendOtpEmail = async (to, otp) => {
    const mailOptions = {
        from: `"Bolify" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: 'Your Mobile Number Verification Code',
        html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2>Hello!</h2>
                <p>Your verification code for Bolify is:</p>
                <p style="font-size: 24px; font-weight: bold; color: #d97706;">${otp}</p>
                <p>This code will expire in 10 minutes.</p>
                <p>If you did not request this, please ignore this email.</p>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
};



export { sendOtpEmail };
