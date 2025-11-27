import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { createServiceRoleClient } from '@/utils/supabase/service-role';
import { AdminStudentReportsClient } from './page-client';

export const metadata: Metadata = {
  title: 'Student Weekly Reports - Admin',
  description: 'View student weekly reports',
};

interface PageProps {
  params: {
    id: string;
  };
}

export default async function AdminStudentReportsPage({ params }: PageProps) {
  const supabase = createClient();
  
  // Check authentication and admin access
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !authUser) {
    return notFound();
  }

  // Get user data
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (userError || !userData || userData.user_type !== 1) {
    return notFound();
  }

  const studentId = params.id;

  // Get student details
  const { data: student, error: studentError } = await supabase
    .from('users')
    .select(`
      id,
      full_name,
      student_id,
      email,
      course,
      year_level,
      companies(name)
    `)
    .eq('id', studentId)
    .eq('user_type', 2)
    .single();

  if (studentError || !student) {
    return notFound();
  }

  // Get student's weekly reports using service role client to bypass RLS
  const serviceRoleSupabase = createServiceRoleClient();
  const { data: reports, error: reportsError } = await serviceRoleSupabase
    .from('weekly_reports')
    .select(`
      id,
      week_starting,
      week_ending,
      tasks_completed,
      problems_encountered,
      learnings_acquired,
      next_week_plan,
      status,
      submitted_at,
      submission_type,
      document_name,
      document_url,
      document_type,
      total_hours_worked,
      supervisor_comments,
      supervisor_rating,
      reviewed_by,
      reviewed_at
    `)
    .eq('student_id', studentId)
    .order('week_starting', { ascending: false });

  if (reportsError) {
    console.error('Error fetching student reports:', reportsError);
  }

  // Debug logging
  console.log('Student ID:', studentId);
  console.log('Reports fetched:', reports);
  console.log('Reports count:', reports?.length || 0);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Weekly Reports</h1>
          <p className="text-muted-foreground">
            Submitted weekly reports for {student.full_name}
          </p>
        </div>
      </div>

      <AdminStudentReportsClient 
        student={{
          ...student,
          companies: student.companies?.[0] ?? { name: '' }
        }}
        initialReports={reports || []}
      />
    </div>
  );
}