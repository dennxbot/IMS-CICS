"use server";

import { createClient } from '@/utils/supabase/server';

export async function verifyPasswordResetOTP(email: string, code: string) {
  const supabase = createClient();
  
  try {
    // Try magiclink first (most likely what Supabase is sending)
    const { data: magicData, error: magicError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'magiclink',
    });

    if (!magicError && magicData.session) {
      // Generate a verification token that can be used for password reset
      const verificationToken = Buffer.from(`${email}:${code}:${Date.now()}`).toString('base64');
      return { 
        error: false, 
        message: "Code verified successfully",
        verificationToken,
        session: magicData.session
      };
    }

    // If magiclink fails, try email OTP
    const { data: emailData, error: emailError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    });
    
    if (!emailError && emailData.session) {
      // Generate a verification token that can be used for password reset
      const verificationToken = Buffer.from(`${email}:${code}:${Date.now()}`).toString('base64');
      return { 
        error: false, 
        message: "Code verified successfully",
        verificationToken,
        session: emailData.session
      };
    }

    // Both methods failed
    return { error: true, message: "Invalid verification code" };
    
  } catch {
    return { error: true, message: "Verification failed" };
  }
}

export async function resendPasswordResetOTP(email: string) {
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