"use server"

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteStudent(studentId: string) {
  try {
    const supabase = createClient();

    // First, delete related timesheet records
    const { error: timesheetError } = await supabase
      .from('timesheets')
      .delete()
      .eq('student_id', studentId);

    if (timesheetError) {
      console.error('Error deleting timesheets:', timesheetError);
      throw new Error('Failed to delete student timesheets');
    }

    // Then delete the student user record
    const { error: studentError } = await supabase
      .from('users')
      .delete()
      .eq('id', studentId)
      .eq('user_type', 2); // Ensure we're only deleting students

    if (studentError) {
      console.error('Error deleting student:', studentError);
      throw new Error('Failed to delete student');
    }

    // Revalidate the students page
    revalidatePath('/admin/students');

    return { success: true };
  } catch (error) {
    console.error('Delete student error:', error);
    throw error;
  }
}