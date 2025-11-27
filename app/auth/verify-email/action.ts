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

export async function resendVerificationOTP(email: string) {
  const supabase = createClient();
  
  try {
    // Generate a new OTP and send it - no redirect needed for OTP flow
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: undefined, // No redirect link for OTP
      },
    });

    if (error) {
      return { error: true, message: error.message };
    }

    return { error: false, message: "Verification code sent" };
  } catch {
    return { error: true, message: "Failed to send verification code" };
  }
}