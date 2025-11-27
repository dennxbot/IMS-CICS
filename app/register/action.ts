"use server";

import { passwordMatchSchema } from "@/validation/passwordMatchSchema";
import { z } from "zod";

// import { revalidatePath } from "next/cache";
// import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";

// export const registerUser = async ({
//   email,
//   password,
//   passwordConfirm,
// }: {
//   email: string;
//   password: string;
//   passwordConfirm: string;
// }) => {
//   const newUserSchema = z
//     .object({
//       email: z.string().email(),
//     })
//     .and(passwordMatchSchema);

//   const newUserValidation = newUserSchema.safeParse({
//     email,
//     password,
//     passwordConfirm,
//   });

//   if (!newUserValidation.success) {
//     return {
//       error: true,
//       message: newUserValidation.error.issues[0]?.message ?? "An error occured",
//     };
//   }
// };

export const registerUser = async ({
  student_id,
  full_name,
  email,
  contact,
  address,
  course_id,
  company_id,
  password,
  passwordConfirm,
}: {
  student_id: string;
  full_name: string;
  email: string;
  contact: string;
  address: string;
  course_id: string;
  company_id?: string;
  password: string;
  passwordConfirm: string;
}) => {
  const newUserSchema = z.object({
    student_id: z.string().min(3, "Student ID must be at least 3 characters"),
    full_name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    contact: z.string().min(6, "Contact number must be at least 6 digits"),
    address: z.string().min(5, "Address must be at least 5 characters"),
    course_id: z.string().min(1, "Course is required"),
    company_id: z.string().min(1, "Company is required"),
  }).and(passwordMatchSchema);

  const newUserValidation = newUserSchema.safeParse({
    student_id,
    full_name,
    email,
    contact,
    address,
    course_id,
    company_id,
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

  // Check if student_id already exists (use service role to bypass RLS)
  const serviceSupabase = createServiceRoleClient();
  const { data: existingStudent } = await serviceSupabase
    .from('users')
    .select('student_id')
    .eq('student_id', student_id)
    .single();

  if (existingStudent) {
    return {
      error: true,
      message: "Student ID already exists",
    };
  }

  // Check if email already exists using service role client
  const { data: existingEmail } = await serviceSupabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existingEmail) {
    return {
      error: true,
      message: "Email already exists",
    };
  }

  // Create user using admin API with email confirmation disabled
  const { data: authData, error: authError } = await serviceSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: false, // Explicitly disable email confirmation
    user_metadata: {
      verification_type: 'otp',
    }
  });

  if (authError) {
    return {
      error: true,
      message: authError.message,
    };
  }

  if (!authData.user) {
    return {
      error: true,
      message: "Failed to create user account",
    };
  }

  // Send OTP using the standard method - this should send a 6-digit code
  const { error: otpError } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false, // Don't create user again
    }
  });

  if (otpError) {
    // Rollback user creation if OTP sending fails
    await serviceSupabase.auth.admin.deleteUser(authData.user.id);
    return {
      error: true,
      message: "Failed to send verification code. Please try again.",
    };
  }

  // Create user profile with student data (aligning with legacy system)
  if (authData.user) {
    // Get course name from course_id
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('name')
      .eq('id', parseInt(course_id))
      .single();

    if (courseError || !courseData) {
      // Rollback auth user if course fetch fails
      await serviceSupabase.auth.admin.deleteUser(authData.user.id);
      return {
        error: true,
        message: "Invalid course selected",
      };
    }

    // Get company time allocation settings
    // TODO: Implement company time settings usage
    // let companyTimeSettings = {
    //   total_required_hours: 500, // Default fallback
    //   working_days: '1,2,3,4,5',
    //   daily_hours_limit: 8.0,
    //   max_weekly_hours: 40.0
    // };

    if (company_id) {
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('total_required_hours, working_days, daily_hours_limit, max_weekly_hours')
        .eq('id', parseInt(company_id))
        .single();

      if (companyData && !companyError) {
        // TODO: Use companyTimeSettings when implementing time allocation logic
        // companyTimeSettings = {
        //   total_required_hours: companyData.total_required_hours || 500,
        //   working_days: companyData.working_days || '1,2,3,4,5',
        //   daily_hours_limit: companyData.daily_hours_limit || 8.0,
        //   max_weekly_hours: companyData.max_weekly_hours || 40.0
        // };
      }
    }

    // Use service role client to bypass RLS for profile creation
    const { error: profileError } = await serviceSupabase.from('users').insert({
      id: authData.user.id,
      student_id: student_id,
      full_name: full_name,
      email: email,
      contact_number: contact,
      address: address,
      user_type: 2, // Student type
      course: courseData.name,
      course_id: parseInt(course_id),
      company_id: company_id ? parseInt(company_id) : null,
      is_active: true,
      created_at: new Date().toISOString(),
    });

    if (profileError) {
      // Rollback auth user if profile creation fails
      await serviceSupabase.auth.admin.deleteUser(authData.user.id);
      return {
        error: true,
        message: "Failed to create user profile: " + profileError.message,
      };
    }
  }

  // User successfully created - redirect to OTP verification
  return {
    success: true,
    message: "Registration successful! Verification code sent to your email.",
    email: email,
  };
};
