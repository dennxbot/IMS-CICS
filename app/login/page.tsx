import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";
import { SystemSettings } from "@/types/internship";

async function getSystemSettings(): Promise<SystemSettings | null> {
  try {
    const supabase = createServiceRoleClient();
    
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('*')
      .single();

    if (error) {
      console.warn('Failed to load system settings:', error);
      return null;
    }

    return settings;
  } catch (error) {
    console.warn('Error fetching system settings:', error);
    return null;
  }
}

export default async function LoginPage() {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      // If there's an auth error, don't redirect, just show login form
      console.log("Auth error in login page:", error);
      const systemSettings = await getSystemSettings();
      return <LoginForm systemSettings={systemSettings} />;
    }
    
    if (data.user) {
      // Fetch user type and redirect appropriately
      const { data: userData } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', data.user.id)
        .single();
      
      if (userData) {
        switch (userData.user_type) {
          case 1: // Admin
            redirect("/admin/dashboard");
            break;
          case 2: // Student
            redirect("/student/dashboard");
            break;
          case 3: // Coordinator
            redirect("/coordinator/dashboard");
            break;
          default:
            redirect("/student/dashboard");
        }
      } else {
        redirect("/student/dashboard");
      }
    }
  } catch (error) {
    console.log("Error checking auth state:", error);
    // If there's any error, just show the login form
    const systemSettings = await getSystemSettings();
    return <LoginForm systemSettings={systemSettings} />;
  }

  const systemSettings = await getSystemSettings();
  return <LoginForm systemSettings={systemSettings} />;
}
