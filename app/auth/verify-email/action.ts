"use server";

import { createClient } from '@/utils/supabase/server';

export async function verifyEmailOTP(email: string, code: string) {
  const supabase = createClient();

  try {
    // Try magiclink first (most likely what Supabase is sending)
    const { data: magicData, error: magicError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'magiclink',
    });

    if (!magicError && magicData.session) {
      return { error: false, message: "Email verified successfully" };
    }

    // If magiclink fails, try email OTP
    const { data: emailData, error: emailError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    });

    if (!emailError && emailData.session) {
      return { error: false, message: "Email verified successfully" };
    }

    // Both methods failed
    return { error: true, message: "Invalid verification code" };

  } catch {
    return { error: true, message: "Verification failed" };
  }
}

export async function resendConfirmationLink(email: string) {
  const supabase = createClient();

  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`,
      },
    });

    if (error) {
      return { error: true, message: error.message };
    }

    return { error: false, message: "Confirmation link sent" };
  } catch {
    return { error: true, message: "Failed to send confirmation link" };
  }
}