import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function TestLogout() {
  const supabase = createClient();
  
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error("Logout error:", error);
  }
  
  redirect("/login");
}