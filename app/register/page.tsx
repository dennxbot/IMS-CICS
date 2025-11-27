import { createServiceRoleClient } from '@/utils/supabase/service-role';
import { Metadata } from 'next';
import RegisterClient from './RegisterClient';
import NoCompaniesError from './NoCompaniesError';

export const metadata: Metadata = {
  title: 'Student Registration',
  description: 'Register for a new student account',
};

async function getCompanies() {
  const supabase = createServiceRoleClient();
  
  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, name')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching companies:', error);
    return [];
  }

  return companies || [];
}

async function getCourses() {
  const supabase = createServiceRoleClient();
  
  const { data: courses, error } = await supabase
    .from('courses')
    .select('id, name, code')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching courses:', error);
    return [];
  }

  return courses || [];
}

export default async function Register() {
  const companies = await getCompanies();
  const courses = await getCourses();
  
  // If no companies are available, show error message
  if (companies.length === 0) {
    return <NoCompaniesError />;
  }
  
  return <RegisterClient companies={companies} courses={courses} />;
}
