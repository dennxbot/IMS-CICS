"use server";

import { z } from "zod";

import { createClient } from "@/utils/supabase/server";
// import { redirect } from "next/navigation";

import { createServiceRoleClient } from "@/utils/supabase/service-role";

const loginSchema = z.object({
  email: z.string().min(1, "Email or Student ID is required"),
  password: z.string().min(1, "Password is required"),
});

export const loginUser = async ({
  email: identifier,
  password,
}: {
  email: string;
  password: string;
}) => {
  const loginUserValidation = loginSchema.safeParse({
    email: identifier,
    password,
  });

  if (!loginUserValidation.success) {
    return {
      error: true,
      message:
        loginUserValidation.error.issues[0]?.message ?? "An error occured",
    };
  }

  let emailToUse = identifier;

  // Check if identifier is NOT an email
  const isEmail = z.string().email().safeParse(identifier).success;

  if (!isEmail) {
    // Assume it's a Student ID
    const serviceSupabase = createServiceRoleClient();
    const { data: user, error } = await serviceSupabase
      .from('users')
      .select('email')
      .eq('student_id', identifier)
      .single();

    if (error || !user) {
      return {
        error: true,
        message: "Invalid login credentials",
      };
    }
    emailToUse = user.email;
  }

  // supabase authentication from here
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailToUse,
    password,
  });

  if (error) {
    return {
      error: true,
      message: error.message,
    };
  }

  if (!data.user) {
    return {
      error: true,
      message: "Login failed. Please try again.",
    };
  }

  // Check if email is verified
  if (!data.user.email_confirmed_at) {
    // Sign out immediately so the session doesn't persist
    await supabase.auth.signOut();

    // Send confirmation link
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: emailToUse,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`,
      },
    });

    if (resendError) {
      return {
        error: true,
        message: "Email not verified. Please check your email for verification instructions.",
      };
    }

    return {
      error: true,
      message: "Email not verified. A confirmation link has been sent to your email.",
      redirectTo: `/auth/verify-email?email=${encodeURIComponent(emailToUse)}`,
    };
  }

  // Fetch user details from users table to get user_type
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('user_type, full_name')
    .eq('id', data.user.id)
    .single();

  if (userError || !userData) {
    return {
      error: true,
      message: "Failed to fetch user details.",
    };
  }

  // User successfully logged in
  return {
    success: true,
    message: "Login successful",
    user: {
      id: data.user.id,
      email: data.user.email,
      user_type: userData.user_type,
      full_name: userData.full_name,
    },
  };
};
