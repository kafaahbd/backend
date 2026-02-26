import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendVerificationEmail = async (email: string, token: string, name: string) => {
  const verificationLink = `${process.env.APP_URL}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: '"Kafa\'ah" <noreply@kafaah.com>',
    to: email,
    subject: 'Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Welcome to Kafa'ah, ${name}!</h2>
        <p>Please verify your email address by clicking the button below:</p>
        <a href="${verificationLink}" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Verify Email</a>
        <p>Or copy and paste this link: <br> <small>${verificationLink}</small></p>
        <p>This link will expire in 24 hours.</p>
        <hr>
        <p style="color: #6b7280; font-size: 12px;">If you didn't create an account, please ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};