import nodemailer from 'nodemailer';
import dns from 'dns';

// IPv4 বাধ্যতামূলক করতে DNS রেজলভার সেট করুন
dns.setDefaultResultOrder('ipv4first');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false // Render-এ SSL সংযোগের জন্য প্রয়োজন
  },
  // IPv4 ব্যবহার বাধ্যতামূলক করতে নিচের অপশন যোগ করুন
  connectionTimeout: 30000, // 30 সেকেন্ড
  socketTimeout: 30000,
});

export const sendVerificationEmail = async (email: string, token: string, name: string) => {
  // ডিবাগিং লগ
  console.log('📧 Sending verification email to:', email);
  console.log('🔧 SMTP Config:', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS ? '✅ Set' : '❌ Not set',
    appUrl: process.env.APP_URL,
  });

  const verificationLink = `${process.env.APP_URL}/verify-email?token=${token}`;
  console.log('🔗 Verification link:', verificationLink);
  
  const mailOptions = {
    from: `"Kafa'ah" <${process.env.SMTP_USER}>`,
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

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Email sending error:', error);
    throw error; // error টি register ফাংশনে ধরা হবে
  }
};