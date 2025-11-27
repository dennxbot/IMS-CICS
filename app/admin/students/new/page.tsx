import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { StudentForm } from "@/components/admin/StudentForm";

export const metadata: Metadata = {
  title: "Add New Student - Admin",
  description: "Add a new student to the internship management system",
};

async function getCompanies() {
  const supabase = createClient();
  
  console.log('Fetching companies from database...');
  
  // First, let's try to get the current user to ensure we're authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError) {
    console.error('Auth error:', authError);
    return [];
  }
  
  console.log('Current user:', user?.email, 'User type:', user?.user_metadata?.user_type);
  
  const { data, error } = await supabase
    .from('companies')
    .select('id, name')
    .eq('is_active', true)
    .order('name', { ascending: true });

  console.log('Companies fetch result:', { data, error });

  if (error) {
    console.error('Error fetching companies:', error);
    return [];
  }

  if (!data) {
    console.log('No companies data returned');
    return [];
  }

  console.log(`Found ${data.length} companies`);
  return data;
}

async function getCourses() {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('courses')
    .select('id, name, code')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data;
}



export default async function AddStudentPage() {
  // Check authentication and admin access
  const user = await requireAuth();
  if (!user || user.user_type !== 1) {
    redirect("/login");
  }

  console.log('AddStudentPage: User authenticated as admin:', user.email);

  const companies = await getCompanies();
  const courses = await getCourses();

  console.log(`AddStudentPage: Found ${companies.length} companies and ${courses.length} courses`);
  
  if (companies.length === 0) {
    console.warn('No companies found in database!');
  }
  
  if (courses.length === 0) {
    console.warn('No courses found in database!');
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/students">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Student</h1>
          <p className="text-muted-foreground">
            Create a new student account with internship details
          </p>
        </div>
      </div>

      <StudentForm companies={companies} courses={courses} />
    </div>
  );
}