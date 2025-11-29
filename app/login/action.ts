"use server";

import { z } from "zod";

import { createClient } from "@/utils/supabase/server";
// import { redirect } from "next/navigation";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(5), // Adjust the minimum length as needed
});

export const loginUser = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  const loginUserValidation = loginSchema.safeParse({
    email,
    password,
  });

  if (!loginUserValidation.success) {
    return {
      error: true,
      message:
        loginUserValidation.error.issues[0]?.message ?? "An error occured",
    };
  }

  // supabase authentication from here
  const supabase = createClient();

  ///////////////////////////// TEST for redirection ///////////
  // const { data, error } = await supabase.auth.getUser();
  // const {
  //   data: { user },
  // } = await supabase.auth.getUser();

  // if (user) {
  //   return redirect("/dashboard");
  // }

  ///////////////////////////////////////////

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
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
      email,
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
      redirectTo: `/auth/verify-email?email=${encodeURIComponent(email)}`,
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
