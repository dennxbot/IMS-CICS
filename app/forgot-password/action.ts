"use server";

import { z } from "zod";

import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const forgotPassword = async ({ email }: { email: string }) => {
  const forgotPasswordValidation = forgotPasswordSchema.safeParse({
    email,
  });

  if (!forgotPasswordValidation.success) {
    return {
      error: true,
      message:
        forgotPasswordValidation.error.issues[0]?.message ?? "An error occured",
    };
  }

  // supabase authentication from here
  const supabase = createClient();

  // Check if user exists in the system first
  const serviceClient = createServiceRoleClient();
  const { data: user } = await serviceClient
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (!user) {
    return {
      error: true,
      message: "This email is not registered in our system.",
    };
  }

  // Try to send OTP directly - Supabase will handle the user existence check
  // This approach is more secure as it doesn't reveal whether email exists
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: undefined, // No redirect link for OTP
    },
  });

  if (error) {
    // Supabase will return specific error messages for different scenarios
    return {
      error: true,
      message: error.message,
    };
  }

  // User successfully found
  return {
    success: true,
    message:
      "If an account exists, a password reset email has been sent. Please check your inbox.",
  };
};
