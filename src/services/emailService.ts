import nodemailer from 'nodemailer';
import dns from 'dns';
import { promisify } from 'util';

const resolve4 = promisify(dns.resolve4);

export const sendVerificationEmail = async (email: string, token: string, name: string) => {
  console.log('📧 Sending verification email to:', email);
  
  // প্রথমে SMTP হোস্টের IPv4 ঠিকানা বের করি
  let smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  let smtpPort = parseInt(process.env.SMTP_PORT || '587');
  
  let ipAddress;
  try {
    const addresses = await resolve4(smtpHost);
    ipAddress = addresses[0]; // প্রথম IPv4 ঠিকানা নিন
    console.log(`🔍 Resolved ${smtpHost} to IPv4: ${ipAddress}`);
  } catch (err) {
    console.error('❌ DNS resolution failed, falling back to hostname', err);
    ipAddress = smtpHost; // fallback
  }
  
  // IPv4 ঠিকানা দিয়ে ট্রান্সপোর্টার তৈরি করুন
  const transporter = nodemailer.createTransport({
    host: ipAddress, // সরাসরি IP ব্যবহার করুন
    port: smtpPort,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
      servername: smtpHost, // TLS-এর জন্য SNI-এ হোস্টনেম দিন
    },
    // connectionTimeout: 30000,
    // socketTimeout: 30000,
  });

  const verificationLink = `${process.env.APP_URL}/verify-email?token=${token}`;
  console.log('🔗 Verification link:', verificationLink);
  
  const mailOptions = {
    from: `"Kafa'ah" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Verify Your Email Address',
    html: `...`, // আপনার HTML
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('❌ Email sending error:', error);
    throw error;
  }
};