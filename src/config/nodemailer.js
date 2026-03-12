// src/config/nodemailer.js
import dotenv from "dotenv";
dotenv.config();
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const baseLayout = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="background-color:#f8fafc;padding:40px 20px;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#334155;margin:0;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 10px 15px -3px rgba(0,0,0,0.05);">
    <div style="padding:38px 32px 32px;text-align:center;border-bottom:1px solid #f1f5f9;">
      <span style="font-family:ui-serif,Georgia,Cambria,'Times New Roman',Times,serif;font-size:33px;font-weight:700;color:#0f172a;letter-spacing:-0.03em;white-space:nowrap;">Mind<span style="color:#0f766e;">Loom</span></span>
    </div>
    <div style="padding:40px 32px;">
      ${content}
    </div>
    <div style="background:#f8fafc;padding:24px;text-align:center;font-size:13px;color:#64748b;border-top:1px solid #f1f5f9;">
      <p style="margin:0;">© ${new Date().getFullYear()} MindLoom. A platform for modern storytelling.</p>
    </div>
  </div>
</body>
</html>
`;


/**
 * Generic email sender
 */
const sendEmail = async ({ email, subject, message, html }) => {
  try {
    const mailOptions = {
      from: `"MindLoom" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      text: message || "", // fallback plain text
      html: html || baseLayout(`
        <h2 style="font-family:ui-serif,Georgia,Cambria,'Times New Roman',Times,serif;color:#0f172a;font-size:24px;font-weight:700;margin-top:0;margin-bottom:16px;letter-spacing:-0.02em;">${subject}</h2>
        <p style="font-size:16px;line-height:1.8;margin:0;color:#475569;">${message}</p>
      `),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("📩 Email sent:", info.response);
    return true;
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    throw new Error("Email sending failed");
  }
};

/**
 * OTP email sender
 */
const sendOtpEmail = async (to, otp) => {
  const html = baseLayout(`
    <h2 style="font-family:ui-serif,Georgia,Cambria,'Times New Roman',Times,serif;color:#0f172a;font-size:24px;font-weight:700;margin-top:0;margin-bottom:16px;letter-spacing:-0.02em;">Account Verification</h2>
    <p style="font-size:16px;line-height:1.8;margin-bottom:24px;color:#475569;">Use the secure code below to verify your MindLoom account:</p>
    <div style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
      <span style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:36px;font-weight:700;color:#0f766e;letter-spacing:0.2em;">${otp}</span>
    </div>
    <p style="font-size:14px;line-height:1.6;color:#64748b;margin:0;">This code will expire securely in <strong>10 minutes</strong>. If you did not request this, you can safely ignore this email.</p>
  `);

  return sendEmail({
    email: to,
    subject: "MindLoom Security: Your Verification Code",
    message: `Your verification code is ${otp}`,
    html,
  });
};

/**
 * Predefined templates with editorial theme
 */
const mailTemplates = {
  welcome: (user) => ({
    subject: "Welcome to MindLoom",
    message: `Hi ${user.fullName}, welcome to MindLoom!`,
    html: baseLayout(`
      <h2 style="font-family:ui-serif,Georgia,Cambria,'Times New Roman',Times,serif;color:#0f172a;font-size:24px;font-weight:700;margin-top:0;margin-bottom:16px;letter-spacing:-0.02em;">Welcome, ${user.fullName}.</h2>
      <p style="font-size:16px;line-height:1.8;margin-bottom:32px;color:#475569;">We are thrilled to have you join our community of readers and writers. MindLoom is designed to be your quiet corner of the internet for thoughtful stories and big ideas.</p>
      <div style="text-align:center;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="display:inline-block;padding:14px 28px;background-color:#0f766e;color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;border-radius:6px;transition:background-color 0.2s;">Start Exploring</a>
      </div>
      <p style="font-size:16px;line-height:1.8;margin-top:32px;margin-bottom:0;color:#475569;">— The Editorial Team</p>
    `),
  }),

  loginNotification: (user) => ({
    subject: "New login to your MindLoom account",
    message: `Hi ${user.fullName}, your account was just accessed.`,
    html: baseLayout(`
      <h2 style="font-family:ui-serif,Georgia,Cambria,'Times New Roman',Times,serif;color:#0f172a;font-size:24px;font-weight:700;margin-top:0;margin-bottom:16px;letter-spacing:-0.02em;">Security Notice</h2>
      <p style="font-size:16px;line-height:1.8;margin-bottom:16px;color:#475569;">Hello ${user.fullName},</p>
      <p style="font-size:16px;line-height:1.8;margin-bottom:24px;color:#475569;">We noticed a new login to your MindLoom account. If this was you, you don't need to do anything.</p>
      <div style="background:#fff1f2;border-left:4px solid #e11d48;padding:16px;margin-bottom:24px;border-radius:0 4px 4px 0;">
        <p style="font-size:15px;line-height:1.6;margin:0;color:#9f1239;">If you do not recognize this activity, please <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password" style="color:#be123c;font-weight:600;text-decoration:underline;">change your password immediately</a> to secure your account.</p>
      </div>
    `),
  }),

  passwordReset: (user, resetURL) => ({
    subject: "Reset your MindLoom password",
    message: `Click here to reset your password: ${resetURL}`,
    html: baseLayout(`
      <h2 style="font-family:ui-serif,Georgia,Cambria,'Times New Roman',Times,serif;color:#0f172a;font-size:24px;font-weight:700;margin-top:0;margin-bottom:16px;letter-spacing:-0.02em;">Password Reset Request</h2>
      <p style="font-size:16px;line-height:1.8;margin-bottom:32px;color:#475569;">Hello ${user.fullName}, we received a request to reset the password for your MindLoom account. Click the button below to choose a new password.</p>
      <div style="text-align:center;margin-bottom:32px;">
        <a href="${resetURL}" style="display:inline-block;padding:14px 28px;background-color:#0f172a;color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;border-radius:6px;transition:background-color 0.2s;">Reset Password</a>
      </div>
      <p style="font-size:14px;line-height:1.6;color:#64748b;margin:0;border-top:1px solid #f1f5f9;padding-top:24px;">For your security, this link will expire in <strong>10 minutes</strong>. If you did not make this request, simply ignore this email.</p>
    `),
  }),

  resetConfirmation: (user) => ({
    subject: "Your password has been changed",
    message: `Hi ${user.fullName}, your password was reset successfully.`,
    html: baseLayout(`
      <h2 style="font-family:ui-serif,Georgia,Cambria,'Times New Roman',Times,serif;color:#0f172a;font-size:24px;font-weight:700;margin-top:0;margin-bottom:16px;letter-spacing:-0.02em;">Password Successfully Changed</h2>
      <p style="font-size:16px;line-height:1.8;margin-bottom:16px;color:#475569;">Hello ${user.fullName},</p>
      <p style="font-size:16px;line-height:1.8;margin-bottom:0;color:#475569;">This is a confirmation that the password for your MindLoom account has just been changed securely. You can now use your new password to sign in.</p>
    `),
  }),

  googleWelcome: (user) => ({
    subject: "Welcome to MindLoom",
    message: `Hi ${user.fullName}, you logged in using Google.`,
    html: baseLayout(`
      <h2 style="font-family:ui-serif,Georgia,Cambria,'Times New Roman',Times,serif;color:#0f172a;font-size:24px;font-weight:700;margin-top:0;margin-bottom:16px;letter-spacing:-0.02em;">Welcome, ${user.fullName}.</h2>
      <p style="font-size:16px;line-height:1.8;margin-bottom:32px;color:#475569;">You have successfully signed in using your Google account. MindLoom is ready for you to start reading, writing, and sharing your stories.</p>
      <div style="text-align:center;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/home" style="display:inline-block;padding:14px 28px;background-color:#0f766e;color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;border-radius:6px;transition:background-color 0.2s;">Go to Feed</a>
      </div>
    `),
  }),
};

export { sendEmail, sendOtpEmail, mailTemplates };
