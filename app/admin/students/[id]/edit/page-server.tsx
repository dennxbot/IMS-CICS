import { createServiceRoleClient } from '@/utils/supabase/service-role';
import { requireAuth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import EditStudentPage from './page-client';

interface Student {
  id: string;
  email: string;
  full_name: string;
  student_id: string;
  course: string;
  company_id: number;
  contact_number: string;
  address: string;
  profile_image_url?: string;
  is_active: boolean;
  created_at: string;
}

interface Company {
  id: number;
  name: string;
}

interface Course {
  id: number;
  name: string;
}

async function getStudent(id: string): Promise<Student | null> {
  const supabase = createServiceRoleClient();
  
  const { data: student, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .eq('user_type', 2) // Ensure it's a student
    .single();

  if (error || !student) {
    return null;
  }

  return student;
}

async function getCompanies(): Promise<Company[]> {
  const supabase = createServiceRoleClient();
  
  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, name')
    .order('name');

  if (error || !companies) {
    return [];
  }

  return companies;
}

async function getCourses(): Promise<Course[]> {
  const supabase = createServiceRoleClient();
  
  const { data: courses, error } = await supabase
    .from('courses')
    .select('id, name')
    .order('name');

  if (error || !courses) {
    return [];
  }

  return courses;
}

export default async function EditStudentServerPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  await requireAuth();
  
  const student = await getStudent(params.id);
  const companies = await getCompanies();
  const courses = await getCourses();
  
  if (!student) {
    notFound();
  }

  // Ensure courses is always an array, even if empty
  return <EditStudentPage student={student} companies={companies} courses={courses || []} />;
}