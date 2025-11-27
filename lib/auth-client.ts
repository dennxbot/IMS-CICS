import { createClient } from "@/utils/supabase/client";
import { User } from "@/types/internship";

export async function getCurrentUserClient(): Promise<User | null> {
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