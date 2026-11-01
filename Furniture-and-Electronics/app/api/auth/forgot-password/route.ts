import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email';
import { getWhatsappSettings } from '@/lib/whatsapp';
import { getClientIp, checkExponentialBackoff } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    // 1. Enforce Exponential Backoff Rate Limiting
    const ip = getClientIp(req);
    const rateCheck = checkExponentialBackoff(`forgot-pw:${ip}`);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: `Too many password reset attempts. Please wait ${rateCheck.retryAfterSeconds} seconds before trying again.` },
        { status: 429 }
      );
    }

    const { username, email } = await req.json();

    if (!username || !email) {
      return NextResponse.json({ error: 'Username and Email are required' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { username: cleanUsername }
    });

    // Generic safe response to prevent username enumeration
    const genericSuccessResponse = {
      message: 'If the provided credentials match an active owner account, reset instructions have been dispatched.',
      success: true
    };

    if (!user || !['OWNER', 'ADMIN'].includes(user.role.toUpperCase())) {
      console.warn(`[Forgot Password] Account not found or non-owner: "${cleanUsername}" from IP: ${ip}`);
      // Sleep slightly to mitigate timing attacks
      await new Promise(r => setTimeout(r, 400));
      return NextResponse.json(genericSuccessResponse);
    }

    if (!user.email || user.email.toLowerCase() !== cleanEmail) {
      console.warn(`[Forgot Password] Email mismatch for: "${cleanUsername}". DB: "${user.email}", Input: "${cleanEmail}" from IP: ${ip}`);
      await new Promise(r => setTimeout(r, 400));
      return NextResponse.json(genericSuccessResponse);
    }

    console.log(`[Forgot Password] Validation success for "${cleanUsername}". Generating secure token...`);

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiration

    // Store token
    await (prisma as any).passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt
      }
    });

    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    let sentVia = 'console';

    // 1. Try WhatsApp first
    const settings = await getWhatsappSettings();
    if (settings.status === 'connected' && settings.ownerPhone) {
      try {
        const text = `*Security Alert: Password Reset Requested*\n\nA password reset was requested for your owner account. Click the link below to reset your password:\n\n${resetUrl}\n\n_If you did not request this, please ignore this message._`;
        
        const { isBotConfigured, botSendMessage } = await import("@/lib/whatsapp/client");
        if (!isBotConfigured()) {
          throw new Error("WhatsApp bot not configured");
        }
        await botSendMessage(settings.ownerPhone, text);
        
        sentVia = 'whatsapp';
        console.log("Reset link sent via WhatsApp");
      } catch (waError) {
        console.error("WhatsApp failed, falling back to email:", waError);
      }
    }

    // 2. Fallback to Email
    if (sentVia === 'console') {
      try {
        await sendEmail({
          to: (user as any).email,
          subject: 'Password Reset Request',
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset</h2>
            <p>A password reset was requested for your owner account.</p>
            <p>Click the button below to set a new password:</p>
            <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p style="margin-top: 20px; font-size: 12px; color: #666;">If you didn't request this, please ignore this email.</p>
          </div>`
        });
        sentVia = 'email';
        console.log("Reset link sent via Email/Console");
      } catch (emailError) {
        console.error("Email failed:", emailError);
        return NextResponse.json({ error: 'Failed to send reset link. Please check server logs.' }, { status: 500 });
      }
    }

    return NextResponse.json({ ...genericSuccessResponse, method: sentVia });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
