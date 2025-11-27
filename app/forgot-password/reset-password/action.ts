"use server";

import { z } from "zod";

import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";

export const resetPasswordFunc = async ({
  password,
  passwordConfirm,
}: {
  password: string;
  passwordConfirm: string;
}) => {
  const newUserSchema = z.object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    passwordConfirm: z.string().min(6, "Password confirmation must be at least 6 characters"),
  }).refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords don't match",
    path: ["passwordConfirm"],
  });

  const newUserValidation = newUserSchema.safeParse({
    password,
    passwordConfirm,
  });

  if (!newUserValidation.success) {
    return {
      error: true,
      message: newUserValidation.error.issues[0]?.message ?? "An error occured",
    };
  }

  // supabase authentication from here
  const supabase = createClient();

  const { data, error } = await supabase.auth.updateUser({
    password: password,
  });

  console.log("data : ", data);

  if (error) {
    return {
      error: true,
      message: error.message,
    };
  }

  // Ensure user record exists in users table after password reset
  if (data.user) {
    // Use service role client to bypass RLS policies
    const serviceSupabase = createServiceRoleClient();
    
    const { data: existingUser, error: checkError } = await serviceSupabase
      .from('users')
      .select('id')
      .eq('id', data.user.id)
      .single();

    if (checkError || !existingUser) {
      // Create a basic user record if it doesn't exist
      const { error: insertError } = await serviceSupabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.email?.split('@')[0] || 'User',
          user_type: 2, // Default to student type
          is_active: true,
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Failed to create user record after password reset:', insertError);
        // Don't fail the password reset if user record creation fails
        // The user can still log in, but may encounter issues later
      }
    }
  }

  // User successfully created
  return {
    success: true,
    message: "Password reset successful",
  };
};
