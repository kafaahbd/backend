import { Resend } from 'resend';

// Resend ক্লায়েন্ট ইনিশিয়ালাইজ করুন
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (email: string, token: string, name: string) => {
  console.log('📧 Sending verification email via Resend to:', email);

  const verificationLink = `${process.env.APP_URL}/verify-email?token=${token}`;
  console.log('🔗 Verification link:', verificationLink);

  try {
    const { data, error } = await resend.emails.send({
      // ⚠️ আপনার ডোমেইন না থাকলে onboarding@resend.dev ব্যবহার করুন
      from: 'Kafa\'ah <onboarding@resend.dev>',
      to: [email],
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
    });

    if (error) {
      console.error('❌ Resend error:', error);
      throw error;
    }

    console.log('✅ Email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw error;
  }
};