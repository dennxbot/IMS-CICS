import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { notFound } from "next/navigation";
import CourseDetailClient from "@/components/admin/CourseDetailClient";

interface Course {
  id: number;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

async function getCourse(id: number): Promise<Course | null> {
  const supabase = createServiceRoleClient();
  
  const { data: course, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching course:', error);
    return null;
  }

  return course;
}

export default async function CourseDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const courseId = parseInt(id);
  
  if (isNaN(courseId)) {
    notFound();
  }

  const course = await getCourse(courseId);
  
  if (!course) {
    notFound();
  }

  return <CourseDetailClient course={course} />;
}