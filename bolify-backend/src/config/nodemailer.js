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
      html:
        html ||
        `
        <div style="max-width:600px;margin:0 auto;font-family:'Segoe UI',Arial,sans-serif;color:#374151;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
          <div style="background:#f59e0b;color:#fff;padding:18px 24px;text-align:center;font-size:20px;font-weight:600;">
            MindLoom
          </div>
          <div style="padding:24px;">
            <h2 style="color:#111827;font-size:22px;margin-bottom:12px;">${subject}</h2>
            <p style="color:#374151;font-size:15px;line-height:1.6;">${message}</p>
          </div>
          <div style="background:#f3f4f6;padding:14px;text-align:center;font-size:12px;color:#6b7280;">
            © ${new Date().getFullYear()} MindLoom. All rights reserved.
          </div>
        </div>
      `,
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
  const html = `
    <div style="max-width:600px;margin:0 auto;font-family:'Segoe UI',Arial,sans-serif;color:#374151;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:#f59e0b;color:#fff;padding:18px 24px;text-align:center;font-size:20px;font-weight:600;">
        MindLoom Verification
      </div>
      <div style="padding:24px;">
        <h2 style="color:#111827;margin-bottom:10px;">Your Verification Code</h2>
        <p style="margin-bottom:16px;">Use the code below to verify your account:</p>
        <div style="font-size:28px;font-weight:bold;color:#f59e0b;margin:20px 0;text-align:center;">${otp}</div>
        <p>This code will expire in <strong>10 minutes</strong>.</p>
        <p>If you didn’t request this, you can safely ignore this email.</p>
      </div>
      <div style="background:#f3f4f6;padding:14px;text-align:center;font-size:12px;color:#6b7280;">
        © ${new Date().getFullYear()} MindLoom. All rights reserved.
      </div>
    </div>
  `;

  return sendEmail({
    email: to,
    subject: "Your MindLoom Verification Code",
    message: `Your verification code is ${otp}`,
    html,
  });
};

/**
 * Predefined templates with amber theme
 */
const mailTemplates = {
  welcome: (user) => ({
    subject: "🎉 Welcome to MindLoom!",
    message: `Hi ${user.fullName}, welcome to MindLoom!`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:'Segoe UI',Arial,sans-serif;color:#374151;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="background:#f59e0b;color:#fff;padding:18px 24px;text-align:center;font-size:20px;font-weight:600;">
          MindLoom
        </div>
        <div style="padding:24px;">
          <h2 style="color:#111827;margin-bottom:10px;">Welcome, ${user.fullName}!</h2>
          <p>We’re excited to have you on board. Start exploring MindLoom today 🚀</p>
          <p style="margin-top:18px;">— The MindLoom Team</p>
        </div>
        <div style="background:#f3f4f6;padding:14px;text-align:center;font-size:12px;color:#6b7280;">
          © ${new Date().getFullYear()} MindLoom. All rights reserved.
        </div>
      </div>
    `,
  }),

  loginNotification: (user) => ({
    subject: "🔐 New Login to Your MindLoom Account",
    message: `Hi ${user.fullName}, your account was just accessed.`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:'Segoe UI',Arial,sans-serif;color:#374151;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="background:#f59e0b;color:#fff;padding:18px 24px;text-align:center;font-size:20px;font-weight:600;">
          MindLoom
        </div>
        <div style="padding:24px;">
          <h2 style="color:#111827;margin-bottom:10px;">Security Notice</h2>
          <p>Hello ${user.fullName}, your MindLoom account was just logged in.</p>
          <p>If this wasn’t you, <a href="${process.env.FRONTEND_URL}/reset-password" style="color:#f59e0b;font-weight:600;">reset your password immediately</a>.</p>
        </div>
        <div style="background:#f3f4f6;padding:14px;text-align:center;font-size:12px;color:#6b7280;">
          © ${new Date().getFullYear()} MindLoom. All rights reserved.
        </div>
      </div>
    `,
  }),

  passwordReset: (user, resetURL) => ({
    subject: "Password Reset (valid for 10 min)",
    message: `Click here to reset your password: ${resetURL}`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:'Segoe UI',Arial,sans-serif;color:#374151;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="background:#f59e0b;color:#fff;padding:18px 24px;text-align:center;font-size:20px;font-weight:600;">
          MindLoom
        </div>
        <div style="padding:24px;">
          <h2 style="color:#111827;margin-bottom:10px;">Password Reset</h2>
          <p>Hello ${user.fullName}, click below to reset your password:</p>
          <a href="${resetURL}" style="display:inline-block;margin-top:12px;padding:12px 24px;background:#f59e0b;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">
            Reset Password
          </a>
          <p style="margin-top:16px;">This link will expire in <strong>10 minutes</strong>.</p>
        </div>
        <div style="background:#f3f4f6;padding:14px;text-align:center;font-size:12px;color:#6b7280;">
          © ${new Date().getFullYear()} MindLoom. All rights reserved.
        </div>
      </div>
    `,
  }),

  resetConfirmation: (user) => ({
    subject: "✅ Your Password Has Been Reset",
    message: `Hi ${user.fullName}, your password was reset successfully.`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:'Segoe UI',Arial,sans-serif;color:#374151;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="background:#f59e0b;color:#fff;padding:18px 24px;text-align:center;font-size:20px;font-weight:600;">
          MindLoom
        </div>
        <div style="padding:24px;">
          <h2 style="color:#111827;margin-bottom:10px;">Password Reset Successful</h2>
          <p>Hello ${user.fullName}, your MindLoom account password has been changed successfully.</p>
        </div>
        <div style="background:#f3f4f6;padding:14px;text-align:center;font-size:12px;color:#6b7280;">
          © ${new Date().getFullYear()} MindLoom. All rights reserved.
        </div>
      </div>
    `,
  }),

  googleWelcome: (user) => ({
    subject: "👋 Welcome with Google Login",
    message: `Hi ${user.fullName}, you logged in using Google.`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:'Segoe UI',Arial,sans-serif;color:#374151;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="background:#f59e0b;color:#fff;padding:18px 24px;text-align:center;font-size:20px;font-weight:600;">
          MindLoom
        </div>
        <div style="padding:24px;">
          <h2 style="color:#111827;margin-bottom:10px;">Welcome, ${user.fullName}!</h2>
          <p>You signed in using Google. Enjoy exploring MindLoom!</p>
        </div>
        <div style="background:#f3f4f6;padding:14px;text-align:center;font-size:12px;color:#6b7280;">
          © ${new Date().getFullYear()} MindLoom. All rights reserved.
        </div>
      </div>
    `,
  }),
};

export { sendEmail, sendOtpEmail, mailTemplates };
