import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { User } from "@/types/internship";

export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient();
  
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !authUser) {
    return null;
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (userError || !userData) {
    return null;
  }

  return userData as User;
}

export async function requireAuth(allowedTypes?: number[]) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  if (allowedTypes && !allowedTypes.includes(user.user_type)) {
    // Redirect based on user type
    switch (user.user_type) {
      case 1: // Admin
        redirect('/admin/dashboard');
        break;
      case 2: // Student
        redirect('/student/dashboard');
        break;
      default:
        redirect('/login');
    }
  }

  return user;
}

export async function getStudentById(studentId: string): Promise<User | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', studentId)
    .eq('user_type', 2)
    .single();

  if (error || !data) {
    return null;
  }

  return data as User;
}



export async function updateUserProfile(userId: string, updates: Partial<User>) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('users')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as User;
}