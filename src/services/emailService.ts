import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationCode = async (email: string, code: string, name: string) => {
  console.log('📧 Sending verification code to:', email);
  console.log('🔢 Verification code:', code);

  try {
    const { data, error } = await resend.emails.send({
      from: 'Kafa\'ah <onboarding@resend.dev>',
      to: [email],
      subject: 'Your Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Welcome to Kafa'ah, ${name}!</h2>
          <p>Your email verification code is:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; border-radius: 8px; margin: 20px 0;">
            ${code}
          </div>
          <p>This code will expire in <strong>15 minutes</strong>.</p>
          <p>If you didn't create an account, please ignore this email.</p>
          <hr>
          <p style="color: #6b7280; font-size: 12px;">Kafa'ah - Islamic Learning Platform</p>
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