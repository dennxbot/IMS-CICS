import { createClient } from "@/utils/supabase/client";
import { WeeklyReport } from "@/types/internship";

// Get weekly reports for a student (client-side version)
export async function getWeeklyReportsClient(studentId: string): Promise<WeeklyReport[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('weekly_reports')
    .select('*')
    .eq('student_id', studentId)
    .order('week_starting', { ascending: false });

  if (error || !data) {
    console.error('Error fetching weekly reports:', error);
    return [];
  }

  return data as WeeklyReport[];
}